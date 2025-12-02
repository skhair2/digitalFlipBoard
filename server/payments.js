import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { cache } from './redis.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-08-01'
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

const PLANS = {
  pro: {
    id: 'pro',
    priceCents: 499,
    currency: 'usd',
    name: 'Digital FlipBoard Pro',
    interval: 'month',
    description: 'Monthly Pro subscription with unlimited boards, scheduling, and premium support.'
  }
};

const WEBHOOK_SIGNING_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const MAX_INVOICE_PAGE = 50;
const MIN_INVOICE_PAGE = 5;
const PAYING_TIERS = ['pro', 'premium', 'enterprise'];
const SUMMARY_CACHE_KEY = 'admin:customer-summary';
const SUMMARY_CACHE_TTL = 60; // seconds

async function hydrateStripeCustomer(userId, email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Failed to read user profile');
  }

  if (data?.stripe_customer_id) {
    return data.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId }
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

function getPlan(planId) {
  return PLANS[planId] || null;
}

async function applyProTier(userId, planId = 'pro') {
  const plan = getPlan(planId);
  const days = plan?.interval === 'year' ? 365 : 30;
  const premiumUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: 'pro', is_premium: true, premium_until: premiumUntil })
    .eq('id', userId);

  if (error) {
    throw new Error('Failed to upgrade profile tier');
  }

  return { premiumUntil }; 
}

export async function createCheckoutSession({ userId, userEmail, planId, finalPriceCents, couponCode }) {
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error('Unsupported plan selected');
  }

  if (finalPriceCents < 0 || finalPriceCents > plan.priceCents) {
    throw new Error('Invalid final price for the selected plan');
  }

  if (finalPriceCents === 0) {
    await applyProTier(userId, planId);
    return { upgradedWithoutPayment: true };
  }

  const customerId = await hydrateStripeCustomer(userId, userEmail);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: plan.description
          },
          unit_amount: finalPriceCents,
          recurring: {
            interval: plan.interval
          }
        },
        quantity: 1
      }
    ],
    success_url: `${FRONTEND_URL}/dashboard?upgrade=success`,
    cancel_url: `${FRONTEND_URL}/pricing?paymentCancelled=true`,
    metadata: {
      userId,
      planId,
      couponCode: couponCode || 'none'
    }
  });

  return { url: session.url };
}

export function constructStripeEvent(payload, signature) {
  if (!WEBHOOK_SIGNING_SECRET) {
    throw new Error('Stripe webhook secret is not configured');
  }
  return stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SIGNING_SECRET);
}

export async function handleCheckoutSessionCompleted(session) {
  const metadata = session.metadata || {};
  const userId = metadata.userId;

  if (!userId) {
    return;
  }

  await applyProTier(userId, metadata.planId || 'pro');
}

function normalizeStripeCustomer(customer) {
  if (!customer) return {};
  if (typeof customer === 'string') return { id: customer };
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name
  };
}

function mapInvoiceToDTO(invoice) {
  const customer = normalizeStripeCustomer(invoice.customer);
  const couponCode =
    invoice.discount?.coupon?.id
    || (invoice.discounts?.[0]?.coupon?.id)
    || null;

  return {
    id: invoice.id,
    invoiceNumber: invoice.number || null,
    customerId: customer.id || invoice.customer || null,
    customerEmail: invoice.customer_email || customer.email || null,
    customerName: invoice.customer_name || customer.name || null,
    created: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
    periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    currency: invoice.currency,
    status: invoice.status,
    billingReason: invoice.billing_reason,
    description: invoice.description,
    amountPaid: invoice.amount_paid ?? 0,
    amountDue: invoice.amount_due ?? 0,
    hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    pdfUrl: invoice.invoice_pdf || null,
    subscriptionId: invoice.subscription || null,
    paymentIntent: invoice.payment_intent || null,
    couponCode,
    metadata: invoice.metadata || {}
  };
}

export async function fetchAdminInvoiceLedger({ emailFilter = '', limit = 25, cursor = null } = {}) {
  const clampedLimit = Math.min(Math.max(limit, MIN_INVOICE_PAGE), MAX_INVOICE_PAGE);
  const params = {
    limit: clampedLimit,
    expand: ['data.customer']
  };

  if (cursor) {
    params.starting_after = cursor;
  }

  const invoiceList = await stripe.invoices.list(params);
  const normalizedInvoices = invoiceList.data.map(mapInvoiceToDTO);

  const filteredInvoices = emailFilter
    ? normalizedInvoices.filter((invoice) =>
        invoice.customerEmail?.toLowerCase().includes(emailFilter.toLowerCase())
      )
    : normalizedInvoices;

  return {
    invoices: filteredInvoices,
    pagination: {
      hasMore: invoiceList.has_more,
      nextCursor: invoiceList.data.length ? invoiceList.data[invoiceList.data.length - 1].id : null,
      limit: clampedLimit
    }
  };
}

export async function fetchAdminCustomerSummary() {
  const cached = await cache.get(SUMMARY_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const [freeResult, payingResult, anonymousResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('subscription_tier', 'free'),
    supabase.from('profiles').select('id', { count: 'exact' }).in('subscription_tier', PAYING_TIERS),
    supabase.from('profiles').select('id', { count: 'exact' }).or('subscription_tier.is.null,subscription_tier.eq.anonymous')
  ]);

  if (freeResult.error || payingResult.error || anonymousResult.error) {
    throw new Error('Failed to load customer summary counts');
  }

  const summary = {
    totalFreeCustomers: freeResult.count || 0,
    totalPayingCustomers: payingResult.count || 0,
    totalAnonymousUsers: anonymousResult.count || 0
  };

  cache.set(SUMMARY_CACHE_KEY, summary, SUMMARY_CACHE_TTL).catch(() => {});

  return summary;
}
