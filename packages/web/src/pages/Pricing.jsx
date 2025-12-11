import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import CouponInput, { CouponBanner } from '../components/common/CouponInput';
import { Button, Card } from '../components/ui/Components';
import { PRO_PLAN } from '../config/plans';
import { useAuthStore } from '../store/authStore';
import { useCouponStore } from '../store/couponStore';
import { usePaymentStore } from '../store/paymentStore';
import mixpanel from '../services/mixpanelService';

const formatCurrency = (value) => value.toFixed(2);

export default function Pricing() {
  const plan = PRO_PLAN;
  const { user, session, isPremium } = useAuthStore();
  const { coupons } = useCouponStore();
  const { sessionCreating, createCheckoutSession } = usePaymentStore();

  const [finalPrice, setFinalPrice] = useState(plan.price);
  const [couponSummary, setCouponSummary] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

  const hasCouponApplied = Boolean(couponSummary);
  const discountAmount = couponSummary ? couponSummary.discount : 0;

  const handleCouponApply = useCallback((payload) => {
    setCouponSummary(payload);
    setFinalPrice(payload.finalPrice);
    setFeedback({ type: 'success', message: `Coupon ${payload.couponCode} unlocked $${payload.discount.toFixed(2)} off.` });
    mixpanel.track('Coupon Applied', { couponCode: payload.couponCode, discount: payload.discount });
  }, []);

  const handleCouponFeedback = useCallback((result) => {
    if (!result) return;
    if (result.valid === false) {
      setFeedback({ type: 'error', message: result.error });
    }
  }, []);

  const handleCouponReset = useCallback(() => {
    setCouponSummary(null);
    setFinalPrice(plan.price);
    setFeedback(null);
  }, [plan.price]);

  const handleCheckout = async () => {
    if (!user) {
      setCheckoutError('Sign in to proceed to Stripe checkout.');
      return;
    }

    if (isPremium) {
      setCheckoutSuccess('You already have Pro access. Enjoy!');
      return;
    }

    setCheckoutError(null);
    setCheckoutSuccess(null);

    const finalPriceCents = Math.round(Math.max(0, finalPrice) * 100);
    const couponCode = couponSummary?.couponCode;
    const token = session?.access_token;

    if (!token) {
      setCheckoutError('Authentication token missing. Please refresh the page and try again.');
      return;
    }

    try {
      const payload = await createCheckoutSession({
        token,
        planId: plan.id,
        finalPriceCents,
        couponCode
      });

      if (payload.upgradedWithoutPayment) {
        setCheckoutSuccess('Coupon covered the upgrade. Welcome to Pro!');
        mixpanel.track('Checkout Completed (Coupon Only)', { plan: plan.id, coupon: couponCode });
        return;
      }

      mixpanel.track('Checkout Session Ready', {
        plan: plan.id,
        finalPrice: finalPriceCents / 100,
        coupon: couponCode || null
      });

      if (payload.url) {
        window.location.href = payload.url;
      }
    } catch (error) {
      const message = (error.details && error.details.error) || error.message || 'Failed to initialize checkout.';
      setCheckoutError(message);
      mixpanel.track('Checkout Error', { plan: plan.id, error: message });
    }
  };

  const summaryRows = [
    { label: 'Plan price', value: `$${formatCurrency(plan.price)}` },
    { label: 'Coupon discount', value: couponSummary ? `- $${formatCurrency(discountAmount)}` : '- $0.00' },
    { label: 'Payable today', value: `$${formatCurrency(finalPrice)}` }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-teal-400">Subscription</p>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black">FlipBoard Pro is ready when you are</h1>
          <p className="text-slate-400 text-lg">Unlock unlimited boards, scheduled playlists, and premium support. Coupons and Stripe power this upgrade, so you always know what you pay.</p>
          <CouponBanner coupons={coupons} />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <Card className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-teal-400">Pro plan</p>
                  <h2 className="text-3xl font-bold text-white">{plan.name}</h2>
                </div>
                <span className="text-sm border border-white/20 rounded-full px-3 py-1 text-slate-300">{plan.heroBadge}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{plan.description}</p>
              <div className="grid gap-3">
                {plan.highlights.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm text-slate-300">
                    <SparklesIcon className="h-4 w-4 text-teal-400" />
                    {benefit}
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 pt-4 text-sm text-slate-400">
                {plan.legalCopy}
              </div>
            </Card>

            <Card className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-teal-400" />
                <p className="text-sm text-slate-300">Stripe handles your card data securely. No sensitive information touches our servers.</p>
              </div>
              <CouponInput
                purchaseAmount={plan.price}
                onApply={handleCouponApply}
                onFeedback={handleCouponFeedback}
                onReset={handleCouponReset}
              />
              {feedback && (
                <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-400' : 'text-teal-300'}`}>
                  {feedback.message}
                </p>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Summary</p>
                  <h3 className="text-2xl font-semibold">Final price</h3>
                </div>
                <div className="text-xl font-bold text-white">${formatCurrency(finalPrice)}</div>
              </div>
              <div className="space-y-2 text-sm text-slate-400">
                {summaryRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span>{row.label}</span>
                    <span className={row.label === 'Payable today' ? 'font-semibold text-white' : 'text-slate-300'}>{row.value}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={sessionCreating || !user || isPremium}
              >
                <span className="flex items-center justify-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  {isPremium
                    ? 'Already on Pro'
                    : sessionCreating
                      ? 'Setting up checkout…'
                      : 'Continue with Stripe'}
                </span>
              </Button>
              <p className="text-xs text-slate-500">
                Powered by Stripe · {plan.interval} billing · Cancel anytime.
              </p>
              {checkoutError && <p className="text-sm text-rose-400">{checkoutError}</p>}
              {checkoutSuccess && <p className="text-sm text-teal-300">{checkoutSuccess}</p>}
              {!user && (
                <p className="text-sm text-slate-400">
                  Already have an account? <Link to="/login" className="text-teal-300 underline">Sign in</Link> to skip the queue.
                </p>
              )}
              {hasCouponApplied && (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  Coupon {couponSummary?.couponCode} locked in. Finalized price resets if you remove the code.
                </div>
              )}
            </Card>

            <Card className="space-y-3 bg-slate-900/60">
              <h4 className="text-sm uppercase tracking-[0.4em] text-slate-400">What happens next?</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Stripe handles the checkout flow. When you land back on the dashboard, your profile tier updates automatically. Coupons generated by admins can be applied above for instant savings.
              </p>
              <div className="space-y-2 text-xs text-slate-500">
                <p>• Secure 3DS verification when required.</p>
                <p>• Mixpanel tracks upgrade events for analytics.</p>
                <p>• Need to talk? Reply to the upgrade confirmation email—we respond in under 1 business day.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
