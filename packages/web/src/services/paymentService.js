const API_URL = import.meta.env.VITE_API_URL || '';

export async function createCheckoutSession({ token, planId, finalPriceCents, couponCode }) {
  const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ planId, finalPriceCents, couponCode })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || 'Failed to create checkout session');
    error.details = payload;
    throw error;
  }

  return payload;
}
