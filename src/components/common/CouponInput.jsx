import React, { useState } from 'react';
import { useCouponStore } from '../../store/couponStore';
import { useAuthStore } from '../../store/authStore';

/**
 * CouponInput Component
 * User-facing coupon code validation and application
 * Displays discount preview and applies coupon to purchase
 */

export default function CouponInput({
  onApply = () => {},
  purchaseAmount = 0,
  disabled = false,
  className = ''
}) {
  const { user, profile } = useAuthStore();
  const { validateCoupon, redeemCoupon, validationResult } = useCouponStore();

  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleValidateCoupon = async (e) => {
    e.preventDefault();

    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    if (!user) {
      alert('Please log in to apply a coupon');
      return;
    }

    setIsValidating(true);
    const result = await validateCoupon(
      couponCode,
      user.id,
      purchaseAmount,
      profile?.subscription_tier || 'free'
    );

    setIsValidating(false);

    if (result.valid) {
      setShowResult(true);
    } else {
      setShowResult(true);
    }
  };

  const handleApplyCoupon = async () => {
    if (!validationResult?.coupon) return;

    // Redeem the coupon
    const result = await redeemCoupon(
      validationResult.coupon.id,
      user.id,
      validationResult.coupon.discountAmount
    );

    if (result.success) {
      setApplied(true);
      onApply({
        couponCode: validationResult.coupon.code,
        discount: validationResult.coupon.discountAmount,
        finalPrice: validationResult.coupon.finalPrice
      });

      // Reset after delay
      setTimeout(() => {
        setCouponCode('');
        setShowResult(false);
        setApplied(false);
      }, 2000);
    } else {
      alert('Error applying coupon: ' + result.error);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Section */}
      {!showResult && (
        <form onSubmit={handleValidateCoupon} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={disabled || isValidating || applied}
            className="flex-1 bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 placeholder-gray-500 focus:outline-none focus:border-teal-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || isValidating || applied || !couponCode.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 text-white px-6 py-2 rounded font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isValidating ? '⏳...' : 'Apply'}
          </button>
        </form>
      )}

      {/* Result Section */}
      {showResult && validationResult && (
        <div
          className={`rounded-lg p-4 border ${
            validationResult.valid
              ? 'bg-green-900/20 border-green-500/30'
              : 'bg-red-900/20 border-red-500/30'
          }`}
        >
          {validationResult.valid ? (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-green-400 font-bold mb-1">✓ Coupon Valid!</h4>
                  <p className="text-green-300 text-sm mb-2">{validationResult.coupon.description}</p>
                </div>
              </div>

              {/* Discount Preview */}
              <div className="bg-slate-900/50 rounded p-3 mb-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Original Price</span>
                  <span className="text-white font-medium">${purchaseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-medium">
                    {validationResult.coupon.type === 'percentage'
                      ? `Discount (${validationResult.coupon.discountValue}%)`
                      : 'Discount'}
                  </span>
                  <span className="text-green-400 font-bold">
                    -${validationResult.coupon.discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-white font-bold">Final Price</span>
                  <span className="text-green-400 font-bold text-lg">
                    ${validationResult.coupon.finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCouponCode('');
                    setShowResult(false);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Change Code
                </button>
                <button
                  onClick={handleApplyCoupon}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  {applied ? '✓ Applied!' : 'Apply Coupon'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-red-400 font-bold mb-1">✗ Coupon Invalid</h4>
              <p className="text-red-300 text-sm mb-3">{validationResult.error}</p>

              <button
                onClick={() => {
                  setCouponCode('');
                  setShowResult(false);
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Try Another Code
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CompactCouponApplier Component
 * Minimal coupon applier for checkout flow
 */
export function CompactCouponApplier({
  onApply = () => {},
  purchaseAmount = 0
}) {
  const { user, profile } = useAuthStore();
  const { validateCoupon, redeemCoupon, validationResult } = useCouponStore();
  const [couponCode, setCouponCode] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleApply = async () => {
    if (!user || !couponCode.trim()) return;

    const result = await validateCoupon(
      couponCode,
      user.id,
      purchaseAmount,
      profile?.subscription_tier || 'free'
    );

    if (result.valid) {
      await redeemCoupon(
        result.coupon.id,
        user.id,
        result.coupon.discountAmount
      );
      
      onApply(result.coupon);
      setCouponCode('');
    }
  };

  return (
    <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center justify-between w-full text-sm text-teal-400 hover:text-teal-300 font-medium"
      >
        <span>🎟️ Have a coupon code?</span>
        <span>{showDetails ? '▼' : '▶'}</span>
      </button>

      {showDetails && (
        <div className="mt-3 space-y-2 pt-3 border-t border-slate-600">
          <input
            type="text"
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded border border-slate-600 placeholder-gray-500"
          />
          <button
            onClick={handleApply}
            className="w-full bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 text-sm px-3 py-2 rounded font-medium transition-colors"
          >
            Apply
          </button>

          {validationResult && (
            <div className={`text-xs p-2 rounded ${
              validationResult.valid
                ? 'bg-green-900/20 text-green-400'
                : 'bg-red-900/20 text-red-400'
            }`}>
              {validationResult.valid
                ? `✓ ${validationResult.coupon.description}`
                : `✗ ${validationResult.error}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CouponBanner Component
 * Promotional banner for active coupons
 */
export function CouponBanner({ coupons = [] }) {
  if (coupons.length === 0) return null;

  const activeCoupons = coupons.filter(c => c.is_active && (!c.expiry_date || new Date(c.expiry_date) > new Date()));

  if (activeCoupons.length === 0) return null;

  const featured = activeCoupons[0];

  return (
    <div className="bg-gradient-to-r from-teal-900/30 to-blue-900/30 rounded-lg p-4 border border-teal-500/30">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-teal-400 font-bold">🎉 Limited Time Offer!</h4>
          <p className="text-gray-300 text-sm mt-1">
            Use code <code className="bg-slate-900 px-2 py-1 rounded font-mono text-teal-300">{featured.code}</code> for{' '}
            {featured.coupon_type === 'percentage'
              ? `${featured.discount_value}% off`
              : `$${featured.discount_value} off`}
          </p>
        </div>
        <span className="text-2xl">✨</span>
      </div>
    </div>
  );
}
