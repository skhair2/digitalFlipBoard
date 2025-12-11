import { supabase } from './supabaseClient';
import mixpanel from './mixpanelService';

/**
 * Coupon Service
 * Comprehensive coupon management: generation, validation, redemption, analytics
 * Enterprise-grade validation with business rule enforcement
 */

// ============================================
// COUPON GENERATION & CREATION
// ============================================

/**
 * Generate random alphanumeric coupon code
 * Format: ABC-1234-DEFG (business-friendly)
 */
function generateCouponCode(prefix = '') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix ? prefix.toUpperCase() : '';
  
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Generate bulk coupons
 * @param {Object} config - Coupon configuration
 * @param {string} config.couponType - 'percentage' or 'fixed'
 * @param {number} config.discountValue - Discount amount
 * @param {number} config.quantity - How many coupons to generate
 * @param {string} config.prefix - Optional code prefix
 * @param {number} config.maxUses - Max usage per coupon
 * @param {string} config.applicableTier - 'free', 'pro', 'enterprise', 'all'
 * @param {number} config.minPurchaseAmount - Minimum purchase requirement
 * @param {Date} config.expiryDate - Coupon expiration date
 * @param {string} config.description - Coupon description
 * @param {string} adminId - Admin user ID
 */
export async function generateCoupons(config, adminId) {
  try {
    const {
      couponType,
      discountValue,
      quantity = 1,
      prefix = 'FLIP',
      maxUses = 1,
      applicableTier = 'all',
      minPurchaseAmount = 0,
      expiryDate = null,
      description = ''
    } = config;

    // Validation
    if (!['percentage', 'fixed'].includes(couponType)) {
      throw new Error('Invalid coupon type. Must be "percentage" or "fixed"');
    }

    if (couponType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      throw new Error('Percentage discount must be between 0 and 100');
    }

    if (couponType === 'fixed' && discountValue <= 0) {
      throw new Error('Fixed discount must be greater than 0');
    }

    if (quantity < 1 || quantity > 1000) {
      throw new Error('Quantity must be between 1 and 1000');
    }

    // Generate codes and insert
    const coupons = [];
    const codes = new Set();

    // Avoid duplicates
    while (coupons.length < quantity) {
      const code = generateCouponCode(prefix);
      if (!codes.has(code)) {
        codes.add(code);
        coupons.push({
          code,
          coupon_type: couponType,
          discount_value: discountValue,
          max_uses: maxUses,
          applicable_tier: applicableTier,
          min_purchase_amount: minPurchaseAmount,
          expiry_date: expiryDate,
          description: description || `${couponType === 'percentage' ? discountValue + '%' : '$' + discountValue} off`,
          is_active: true,
          created_by: adminId
        });
      }
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert(coupons)
      .select();

    if (error) throw error;

    // Track in Mixpanel
    mixpanel.track('Coupons Generated', {
      quantity,
      couponType,
      discountValue,
      adminId
    });

    return {
      success: true,
      coupons: data || [],
      count: data?.length || 0,
      codes: data?.map(c => c.code) || []
    };
  } catch (error) {
    console.error('Error generating coupons:', error);
    return { success: false, error: error.message, coupons: [] };
  }
}

// ============================================
// COUPON VALIDATION & REDEMPTION
// ============================================

/**
 * Validate coupon and calculate discount
 * @param {string} code - Coupon code to validate
 * @param {string} userId - User attempting to redeem
 * @param {number} purchaseAmount - Total purchase amount
 * @param {string} userTier - User's subscription tier
 */
export async function validateAndRedeemCoupon(code, userId, purchaseAmount = 0, userTier = 'free') {
  try {
    if (!code || typeof code !== 'string') {
      return { 
        valid: false, 
        error: 'Invalid coupon code format' 
      };
    }

    const normalizedCode = code.toUpperCase().trim();

    // Fetch coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (fetchError || !coupon) {
      return { 
        valid: false, 
        error: 'Coupon not found' 
      };
    }

    // Check if active
    if (!coupon.is_active) {
      return { 
        valid: false, 
        error: 'This coupon is no longer active' 
      };
    }

    // Check expiry
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { 
        valid: false, 
        error: 'This coupon has expired' 
      };
    }

    // Check usage limit
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { 
        valid: false, 
        error: 'This coupon has reached its usage limit' 
      };
    }

    // Check if user already used it
    const { count: userRedemptions } = await supabase
      .from('coupon_redemptions')
      .select('id', { count: 'exact' })
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId);

    if (userRedemptions && userRedemptions > 0) {
      return { 
        valid: false, 
        error: 'You have already redeemed this coupon' 
      };
    }

    // Check applicable tier
    if (coupon.applicable_tier !== 'all' && coupon.applicable_tier !== userTier) {
      return { 
        valid: false, 
        error: `This coupon is only applicable to ${coupon.applicable_tier} tier users` 
      };
    }

    // Check minimum purchase amount
    if (coupon.min_purchase_amount && purchaseAmount < coupon.min_purchase_amount) {
      return { 
        valid: false, 
        error: `Minimum purchase of $${coupon.min_purchase_amount} required` 
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.coupon_type === 'percentage') {
      discountAmount = (purchaseAmount * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    // Cap discount at purchase amount
    discountAmount = Math.min(discountAmount, purchaseAmount);

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.coupon_type,
        discountValue: coupon.discount_value,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalPrice: Math.round((purchaseAmount - discountAmount) * 100) / 100,
        description: coupon.description
      }
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { 
      valid: false, 
      error: 'An error occurred while validating the coupon' 
    };
  }
}

/**
 * Redeem a validated coupon
 * @param {string} couponId - Coupon UUID
 * @param {string} userId - User redeeming
 * @param {number} discountApplied - Discount amount applied
 * @param {string} transactionId - Optional transaction reference
 */
export async function redeemCoupon(couponId, userId, discountApplied, transactionId = null) {
  try {
    // Record redemption
    const { data: redemption, error: redeemError } = await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        discount_applied: discountApplied,
        transaction_id: transactionId
      })
      .select()
      .single();

    if (redeemError) throw redeemError;

    // Increment usage counter
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ current_uses: supabase.sql`current_uses + 1` })
      .eq('id', couponId);

    if (updateError) throw updateError;

    // Track redemption
    mixpanel.track('Coupon Redeemed', {
      couponId,
      userId,
      discountApplied,
      transactionId
    });

    return {
      success: true,
      redemption
    };
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// COUPON MANAGEMENT
// ============================================

/**
 * Fetch all coupons with optional filtering
 */
export async function fetchAllCoupons(options = {}) {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      isActive = null,
      searchQuery = ''
    } = options;

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isActive !== null) {
      query = query.eq('is_active', isActive);
    }

    if (searchQuery) {
      query = query.or(`code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      coupons: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return { success: false, coupons: [], totalCount: 0, error: error.message };
  }
}

/**
 * Get coupon details with redemption stats
 */
export async function getCouponDetails(couponId) {
  try {
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (couponError) throw couponError;

    // Fetch redemption history
    const { data: redemptions, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .select('*')
      .eq('coupon_id', couponId)
      .order('redeemed_at', { ascending: false });

    if (redemptionError) throw redemptionError;

    // Calculate stats
    const stats = {
      totalRedemptions: redemptions?.length || 0,
      totalDiscountGiven: redemptions?.reduce((sum, r) => sum + (r.discount_applied || 0), 0) || 0,
      utilizationRate: coupon.max_uses ? ((coupon.current_uses / coupon.max_uses) * 100).toFixed(2) : 'N/A'
    };

    return {
      success: true,
      coupon,
      redemptions: redemptions || [],
      stats
    };
  } catch (error) {
    console.error('Error fetching coupon details:', error);
    return { success: false, error: error.message, coupon: null };
  }
}

/**
 * Update coupon status
 */
export async function updateCouponStatus(couponId, isActive) {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', couponId)
      .select()
      .single();

    if (error) throw error;

    mixpanel.track('Coupon Status Updated', {
      couponId,
      isActive
    });

    return { success: true, coupon: data };
  } catch (error) {
    console.error('Error updating coupon status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete coupon
 */
export async function deleteCoupon(couponId) {
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) throw error;

    mixpanel.track('Coupon Deleted', { couponId });

    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// COUPON TEMPLATES
// ============================================

/**
 * Create coupon template for quick generation
 */
export async function createCouponTemplate(config, adminId) {
  try {
    const {
      templateName,
      couponType,
      discountValue,
      maxUses,
      applicableTier,
      minPurchaseAmount,
      description
    } = config;

    const { data, error } = await supabase
      .from('coupon_templates')
      .insert({
        template_name: templateName,
        coupon_type: couponType,
        discount_value: discountValue,
        max_uses: maxUses,
        applicable_tier: applicableTier,
        min_purchase_amount: minPurchaseAmount,
        description,
        created_by: adminId
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, template: data };
  } catch (error) {
    console.error('Error creating coupon template:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all coupon templates
 */
export async function fetchCouponTemplates() {
  try {
    const { data, error } = await supabase
      .from('coupon_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, templates: data || [] };
  } catch (error) {
    console.error('Error fetching templates:', error);
    return { success: false, templates: [], error: error.message };
  }
}

/**
 * Generate coupons from template
 */
export async function generateCouponsFromTemplate(templateId, quantity, adminId) {
  try {
    const { data: template, error: templateError } = await supabase
      .from('coupon_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Generate using template config
    const result = await generateCoupons({
      couponType: template.coupon_type,
      discountValue: template.discount_value,
      quantity,
      maxUses: template.max_uses,
      applicableTier: template.applicable_tier,
      minPurchaseAmount: template.min_purchase_amount,
      description: template.description,
      prefix: template.template_name.substring(0, 4).toUpperCase()
    }, adminId);

    return result;
  } catch (error) {
    console.error('Error generating coupons from template:', error);
    return { success: false, error: error.message, coupons: [] };
  }
}

// ============================================
// ANALYTICS & REPORTING
// ============================================

/**
 * Get coupon campaign analytics
 */
export async function getCouponAnalytics(dateRange = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    // Get redemptions in date range
    const { data: redemptions } = await supabase
      .from('coupon_redemptions')
      .select('discount_applied, redeemed_at, coupon_id')
      .gte('redeemed_at', startDate.toISOString());

    // Get all coupons
    const { data: coupons } = await supabase
      .from('coupons')
      .select('id, code, coupon_type, discount_value, current_uses, max_uses');

    // Calculate metrics
    const totalDiscounted = redemptions?.reduce((sum, r) => sum + (r.discount_applied || 0), 0) || 0;
    const totalRedemptions = redemptions?.length || 0;
    const activeCoupons = coupons?.filter(c => c.max_uses === null || c.current_uses < c.max_uses).length || 0;
    const totalCoupons = coupons?.length || 0;

    const topCoupons = coupons
      ?.sort((a, b) => b.current_uses - a.current_uses)
      .slice(0, 10);

    return {
      success: true,
      analytics: {
        totalRedemptions,
        totalDiscounted: Math.round(totalDiscounted * 100) / 100,
        averageDiscount: totalRedemptions > 0 ? Math.round((totalDiscounted / totalRedemptions) * 100) / 100 : 0,
        activeCoupons,
        totalCoupons,
        utilizationRate: totalCoupons > 0 ? ((activeCoupons / totalCoupons) * 100).toFixed(2) : 0,
        topCoupons: topCoupons || []
      }
    };
  } catch (error) {
    console.error('Error fetching coupon analytics:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export coupons (typically for CSV/spreadsheet)
 */
export async function exportCoupons(couponIds = []) {
  try {
    let query = supabase.from('coupons').select('*');
    
    if (couponIds.length > 0) {
      query = query.in('id', couponIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      totalExported: data?.length || 0
    };
  } catch (error) {
    console.error('Error exporting coupons:', error);
    return { success: false, error: error.message, data: [] };
  }
}
