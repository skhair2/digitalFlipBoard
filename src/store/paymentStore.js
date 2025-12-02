import { create } from 'zustand';
import * as paymentService from '../services/paymentService';

export const usePaymentStore = create((set) => ({
  sessionCreating: false,
  error: null,
  sessionUrl: null,

  createCheckoutSession: async ({ token, planId, finalPriceCents, couponCode }) => {
    set({ sessionCreating: true, error: null });

    try {
      const payload = await paymentService.createCheckoutSession({
        token,
        planId,
        finalPriceCents,
        couponCode
      });

      if (payload.upgradedWithoutPayment) {
        set({ sessionUrl: null, sessionCreating: false });
        return payload;
      }

      set({ sessionUrl: payload.url, sessionCreating: false });
      return payload;
    } catch (error) {
      set({ error: error.message, sessionCreating: false });
      throw error;
    }
  }
}));
