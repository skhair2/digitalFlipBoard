import { supabase } from './supabaseClient';

/**
 * Admin Service
 * Handles all admin-related operations including user management,
 * analytics, activity logging, and system monitoring
 */

// ============================================
// USER MANAGEMENT
// ============================================

export async function fetchAllUsers(options = {}) {
  const { limit = 50, offset = 0, searchQuery = '', tierFilter = null } = options;
  
  try {
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, subscription_tier, role, created_at, updated_at, max_designs', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    if (tierFilter && tierFilter !== 'all') {
      query = query.eq('subscription_tier', tierFilter);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      users: data || [],
      totalCount: count || 0,
      success: true
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { users: [], totalCount: 0, error: error.message, success: false };
  }
}

export async function getUserDetails(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Get user's designs count
    const { count: designCount } = await supabase
      .from('premium_designs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    // Get user's sessions count
    const { count: sessionCount } = await supabase
      .from('boards')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    return {
      user: {
        ...data,
        designCount: designCount || 0,
        sessionCount: sessionCount || 0
      },
      success: true
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return { user: null, error: error.message, success: false };
  }
}

export async function updateUserSubscriptionTier(userId, newTier, adminId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ subscription_tier: newTier })
      .eq('id', userId)
      .select();

    if (error) throw error;

    // Log admin action
    await logAdminActivity(adminId, 'UPDATE_SUBSCRIPTION_TIER', userId, {
      newTier,
      oldTier: data[0]?.subscription_tier
    });

    return { success: true, user: data[0] };
  } catch (error) {
    console.error('Error updating user tier:', error);
    return { success: false, error: error.message };
  }
}

export async function deactivateUser(userId, adminId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'deactivated' })
      .eq('id', userId)
      .select();

    if (error) throw error;

    // Log admin action
    await logAdminActivity(adminId, 'DEACTIVATE_USER', userId, {
      reason: 'Admin deactivation'
    });

    return { success: true };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId, adminId) {
  try {
    // First log the action
    await logAdminActivity(adminId, 'DELETE_USER', userId, {
      reason: 'Account deletion'
    });

    // Delete user's data (cascading)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ANALYTICS & METRICS
// ============================================

export async function getSystemAnalytics() {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .neq('subscription_tier', 'deactivated');

    // Users by tier
    const { data: usersByTier } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .neq('subscription_tier', 'deactivated');

    const tierBreakdown = {
      free: usersByTier?.filter(u => u.subscription_tier === 'free').length || 0,
      pro: usersByTier?.filter(u => u.subscription_tier === 'pro').length || 0,
      premium: usersByTier?.filter(u => u.subscription_tier === 'premium').length || 0
    };

    // Total messages sent (estimated from boards)
    const { count: totalBoards } = await supabase
      .from('boards')
      .select('id', { count: 'exact' });

    // Total designs created
    const { count: totalDesigns } = await supabase
      .from('premium_designs')
      .select('id', { count: 'exact' });

    // Signup trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newSignups } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Active sessions (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { count: activeSessions } = await supabase
      .from('boards')
      .select('id', { count: 'exact' })
      .gte('updated_at', oneDayAgo.toISOString());

    return {
      success: true,
      analytics: {
        totalUsers,
        tierBreakdown,
        totalBoards,
        totalDesigns,
        newSignupsLast30Days: newSignups,
        activeSessions24h: activeSessions,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return { success: false, error: error.message, analytics: null };
  }
}

export async function getRevenueMetrics() {
  try {
    // Count pro and premium users
    const { data: paidUsers } = await supabase
      .from('profiles')
      .select('subscription_tier, created_at');

    const proCount = paidUsers?.filter(u => u.subscription_tier === 'pro').length || 0;
    const premiumCount = paidUsers?.filter(u => u.subscription_tier === 'premium').length || 0;

    // Estimate monthly recurring revenue (MRR)
    // Pro: $10/month, Premium: $29/month
    const mrr = (proCount * 10) + (premiumCount * 29);

    // Annual recurring revenue (ARR)
    const arr = mrr * 12;

    // Churn rate (deactivated users in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: churnedUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('subscription_tier', 'deactivated')
      .gte('updated_at', thirtyDaysAgo.toISOString());

    const totalUsers = proCount + premiumCount;
    const churnRate = totalUsers > 0 ? ((churnedUsers || 0) / totalUsers) * 100 : 0;

    return {
      success: true,
      revenue: {
        mrr,
        arr,
        proSubscriptions: proCount,
        premiumSubscriptions: premiumCount,
        churnRate: parseFloat(churnRate.toFixed(2)),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    return { success: false, error: error.message, revenue: null };
  }
}

export async function getUserActivityMetrics(userId) {
  try {
    // Get user's boards/sessions
    const { data: boards } = await supabase
      .from('boards')
      .select('created_at, updated_at')
      .eq('user_id', userId);

    // Get user's designs
    const { data: designs } = await supabase
      .from('premium_designs')
      .select('created_at')
      .eq('user_id', userId);

    // Calculate activity
    const lastActive = boards?.length > 0
      ? new Date(Math.max(...boards.map(b => new Date(b.updated_at))))
      : null;

    return {
      success: true,
      activity: {
        totalSessions: boards?.length || 0,
        totalDesigns: designs?.length || 0,
        lastActive,
        accountAge: Math.floor((Date.now() - new Date(boards?.[0]?.created_at || new Date()).getTime()) / (1000 * 60 * 60 * 24))
      }
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return { success: false, error: error.message, activity: null };
  }
}

// ============================================
// ACTIVITY LOGGING
// ============================================

export async function logAdminActivity(adminId, action, targetUserId = null, details = {}) {
  try {
    const { error } = await supabase
      .from('admin_activity_log')
      .insert([{
        admin_id: adminId,
        action,
        target_user_id: targetUserId,
        details,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return { success: false, error: error.message };
  }
}

export async function fetchAdminActivityLog(options = {}) {
  const { limit = 100, offset = 0, action = null, adminId = null } = options;

  try {
    let query = supabase
      .from('admin_activity_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data || [],
      totalCount: count || 0,
      success: true
    };
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return { logs: [], totalCount: 0, error: error.message, success: false };
  }
}

// ============================================
// SYSTEM HEALTH
// ============================================

export async function getSystemHealth() {
  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact' })
      .limit(1);

    const dbStatus = !dbError ? 'healthy' : 'unhealthy';

    // Check authentication system
    const { error: authError } = await supabase.auth.getUser();
    const authStatus = !authError ? 'healthy' : 'unhealthy';

    // Check realtime connection
    const realtimeStatus = 'healthy'; // Would need actual health check endpoint

    // Error rate (last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { count: recentErrors } = await supabase
      .from('admin_activity_log')
      .select('id', { count: 'exact' })
      .like('action', '%ERROR%')
      .gte('created_at', oneHourAgo.toISOString());

    return {
      success: true,
      health: {
        database: dbStatus,
        authentication: authStatus,
        realtime: realtimeStatus,
        recentErrorsLastHour: recentErrors || 0,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error checking system health:', error);
    return { success: false, error: error.message, health: null };
  }
}

export async function fetchInvoiceLedger(options = {}) {
  const { emailFilter = '', limit = 25, cursor = null } = options;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session || sessionData;
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('Admin authentication required to load invoices');
    }

    const params = new URLSearchParams();
    if (emailFilter) params.set('email', emailFilter);
    if (limit) params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);

    const response = await fetch(`${API_URL}/api/admin/invoices?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const payload = await response.json().catch(() => ({ error: 'Invalid response from payments API' }));

    if (!response.ok || !payload.success) {
      const error = payload.error || 'Failed to load invoices';
      throw new Error(error);
    }

    return payload;
  } catch (error) {
    console.error('Error fetching invoice ledger:', error);
    return { invoices: [], summary: null, pagination: null, error: error.message, success: false };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function isUserAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function promoteUserToAdmin(userId, adminId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select();

    if (error) throw error;

    // Log action
    await logAdminActivity(adminId, 'PROMOTE_ADMIN', userId, {
      newRole: 'admin'
    });

    return { success: true };
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return { success: false, error: error.message };
  }
}

export async function demoteAdminToUser(userId, adminId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userId)
      .select();

    if (error) throw error;

    // Log action
    await logAdminActivity(adminId, 'DEMOTE_ADMIN', userId, {
      newRole: 'user'
    });

    return { success: true };
  } catch (error) {
    console.error('Error demoting admin:', error);
    return { success: false, error: error.message };
  }
}
