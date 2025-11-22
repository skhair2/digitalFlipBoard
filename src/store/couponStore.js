import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as couponService from '../services/couponService';

/**
 * Coupon Store
 * Manages coupon state for admin panel and user redemption
 */

export const useCouponStore = create(
  persist(
    (set, get) => ({
      // Admin Coupon Management State
      coupons: [],
      couponsLoading: false,
      selectedCoupon: null,
      couponDetails: null,
      couponAnalytics: null,

      // Template State
      templates: [],
      templatesLoading: false,

      // User Redemption State
      userCoupons: [],
      validationResult: null,
      redemptionLoading: false,

      // Filters & Pagination
      couponSearch: '',
      couponStatusFilter: 'all', // 'all', 'active', 'inactive'
      currentPage: 1,
      couponsPerPage: 25,

      // ============================================
      // ADMIN: COUPON GENERATION
      // ============================================

      generateCoupons: async (config, adminId) => {
        set({ couponsLoading: true });
        const result = await couponService.generateCoupons(config, adminId);
        
        if (result.success) {
          set(state => ({
            coupons: [...result.coupons, ...state.coupons],
            couponsLoading: false
          }));
        } else {
          set({ couponsLoading: false });
        }

        return result;
      },

      // ============================================
      // ADMIN: COUPON MANAGEMENT
      // ============================================

      fetchCoupons: async (options = {}) => {
        set({ couponsLoading: true });
        const result = await couponService.fetchAllCoupons(options);
        
        if (result.success) {
          set({
            coupons: result.coupons,
            couponsLoading: false
          });
        } else {
          set({ couponsLoading: false });
        }

        return result;
      },

      getCouponDetails: async (couponId) => {
        set({ couponsLoading: true });
        const result = await couponService.getCouponDetails(couponId);
        
        if (result.success) {
          set({
            couponDetails: {
              coupon: result.coupon,
              redemptions: result.redemptions,
              stats: result.stats
            },
            selectedCoupon: result.coupon,
            couponsLoading: false
          });
        } else {
          set({ couponsLoading: false });
        }

        return result;
      },

      updateCouponStatus: async (couponId, isActive) => {
        set({ couponsLoading: true });
        const result = await couponService.updateCouponStatus(couponId, isActive);
        
        if (result.success) {
          set(state => ({
            coupons: state.coupons.map(c => c.id === couponId ? result.coupon : c),
            selectedCoupon: state.selectedCoupon?.id === couponId ? result.coupon : state.selectedCoupon,
            couponsLoading: false
          }));
        } else {
          set({ couponsLoading: false });
        }

        return result;
      },

      deleteCoupon: async (couponId) => {
        set({ couponsLoading: true });
        const result = await couponService.deleteCoupon(couponId);
        
        if (result.success) {
          set(state => ({
            coupons: state.coupons.filter(c => c.id !== couponId),
            selectedCoupon: state.selectedCoupon?.id === couponId ? null : state.selectedCoupon,
            couponsLoading: false
          }));
        } else {
          set({ couponsLoading: false });
        }

        return result;
      },

      // ============================================
      // ADMIN: TEMPLATES
      // ============================================

      fetchTemplates: async () => {
        set({ templatesLoading: true });
        const result = await couponService.fetchCouponTemplates();
        
        if (result.success) {
          set({
            templates: result.templates,
            templatesLoading: false
          });
        } else {
          set({ templatesLoading: false });
        }

        return result;
      },

      createTemplate: async (config, adminId) => {
        const result = await couponService.createCouponTemplate(config, adminId);
        
        if (result.success) {
          set(state => ({
            templates: [...state.templates, result.template]
          }));
        }

        return result;
      },

      generateCouponsFromTemplate: async (templateId, quantity, adminId) => {
        set({ couponsLoading: true });
        const result = await couponService.generateCouponsFromTemplate(templateId, quantity, adminId);
        
        if (result.success) {
          set(state => ({
            coupons: [...result.coupons, ...state.coupons],
            couponsLoading: false
          }));
        } else {
          set({ couponsLoading: false });
        }

        return result;
      },

      // ============================================
      // ADMIN: ANALYTICS
      // ============================================

      fetchCouponAnalytics: async (dateRange = 30) => {
        const result = await couponService.getCouponAnalytics(dateRange);
        
        if (result.success) {
          set({
            couponAnalytics: result.analytics
          });
        }

        return result;
      },

      // ============================================
      // USER: COUPON VALIDATION & REDEMPTION
      // ============================================

      validateCoupon: async (code, userId, purchaseAmount = 0, userTier = 'free') => {
        const result = await couponService.validateAndRedeemCoupon(
          code,
          userId,
          purchaseAmount,
          userTier
        );
        
        set({
          validationResult: result
        });

        return result;
      },

      redeemCoupon: async (couponId, userId, discountApplied, transactionId = null) => {
        set({ redemptionLoading: true });
        const result = await couponService.redeemCoupon(
          couponId,
          userId,
          discountApplied,
          transactionId
        );
        
        set({ redemptionLoading: false });
        return result;
      },

      // ============================================
      // EXPORT & DATA
      // ============================================

      exportCoupons: async (couponIds = []) => {
        const result = await couponService.exportCoupons(couponIds);
        return result;
      },

      // ============================================
      // UI STATE MANAGEMENT
      // ============================================

      setSelectedCoupon: (coupon) => set({ selectedCoupon: coupon }),
      setCouponSearch: (query) => set({ couponSearch: query, currentPage: 1 }),
      setCouponStatusFilter: (status) => set({ couponStatusFilter: status, currentPage: 1 }),
      setCurrentPage: (page) => set({ currentPage: page }),

      // Clear state
      clearCouponState: () => set({
        selectedCoupon: null,
        couponDetails: null,
        validationResult: null,
        couponSearch: '',
        couponStatusFilter: 'all',
        currentPage: 1
      })
    }),
    {
      name: 'coupon-store',
      partialize: (state) => ({
        couponStatusFilter: state.couponStatusFilter,
        couponsPerPage: state.couponsPerPage,
        couponSearch: state.couponSearch
      })
    }
  )
);
