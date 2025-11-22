import { supabase } from './supabaseClient';
import mixpanel from './mixpanelService';
import { checkAdminRateLimit } from './adminRateLimit';
import DOMPurify from 'dompurify';

/**
 * Permission Service
 * Handles all admin role and permission management
 * Including: grant/revoke roles, permission checks, audit logging
 */

// CSRF token storage (in production, use Redis or Supabase)
const csrfTokens = new Map();

/**
 * Generate a CSRF token for admin operations
 * @param {string} userId - User ID
 * @returns {string} CSRF token
 */
export function generateCSRFToken(userId) {
  // Generate random token
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  // Store token with expiry (10 minutes)
  const expiryTime = Date.now() + 600000;
  csrfTokens.set(token, { userId, expiryTime });
  
  // Cleanup expired tokens
  for (const [key, value] of csrfTokens) {
    if (Date.now() > value.expiryTime) {
      csrfTokens.delete(key);
    }
  }
  
  return token;
}

/**
 * Validate CSRF token
 * @param {string} token - CSRF token
 * @param {string} userId - User ID
 * @returns {boolean} True if valid
 */
export function validateCSRFToken(token, userId) {
  if (!csrfTokens.has(token)) {
    return false;
  }
  
  const tokenData = csrfTokens.get(token);
  
  // Check expiry
  if (Date.now() > tokenData.expiryTime) {
    csrfTokens.delete(token);
    return false;
  }
  
  // Check user match
  if (tokenData.userId !== userId) {
    return false;
  }
  
  // Token is valid - consume it (one-time use)
  csrfTokens.delete(token);
  return true;
}

// ============================================
// ROLE DEFINITIONS & CONSTANTS
// ============================================

export const ROLES = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  MODERATOR: 'moderator',
};

export const ROLE_PERMISSIONS = {
  admin: [
    'users:view_all',
    'users:grant_admin',
    'users:revoke_admin',
    'users:suspend',
    'coupons:manage',
    'roles:manage',
    'audit:view',
    'system:health',
  ],
  support: [
    'users:view_all',
    'audit:view',
    'system:health',
  ],
  moderator: [
    'users:view_limited',
    'content:moderate',
  ],
};

export const MAX_ADMINS = 10;

// ============================================
// USER LOOKUP
// ============================================

/**
 * Search for users by email
 * @param {string} email - Email to search for (partial match OK)
 * @returns {Promise<Array>} Array of matching users
 */
export async function searchUsersByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_tier, created_at')
      .ilike('email', `%${email}%`)
      .limit(10);

    if (error) throw error;

    return {
      success: true,
      users: data || [],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('Error searching users by email:', error);
    return {
      success: false,
      users: [],
      count: 0,
      error: error.message,
    };
  }
}

/**
 * Get detailed user info including current roles
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User with roles
 */
export async function getUserWithRoles(userId) {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('admin_roles')
      .select('role, permissions, granted_at, granted_by, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (rolesError) throw rolesError;

    return {
      success: true,
      user: {
        ...profile,
        roles: roles || [],
        isAdmin: roles?.some(r => r.role === 'admin') || false,
        isSupport: roles?.some(r => r.role === 'support') || false,
      },
    };
  } catch (error) {
    console.error('Error fetching user with roles:', error);
    return {
      success: false,
      user: null,
      error: error.message,
    };
  }
}

// ============================================
// GRANT & REVOKE ROLES
// ============================================

/**
 * Grant admin role to a user
 * @param {string} targetUserId - User to grant role to
 * @param {string} adminId - Admin making the change
 * @param {string} reason - Optional reason for audit log
 * @returns {Promise<Object>} Success/error result
 */
export async function grantAdminRole(targetUserId, adminId, reason = null, csrfToken = null) {
  try {
    // SECURITY: Check rate limit
    const rateLimitCheck = checkAdminRateLimit(adminId, 'grant');
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limited. Try again in ${rateLimitCheck.retryAfter} seconds.`);
    }

    // SECURITY: Validate CSRF token
    if (!csrfToken || !validateCSRFToken(csrfToken, adminId)) {
      throw new Error('Invalid or missing CSRF token. Request a new one.');
    }

    // 1. Validate: target user exists
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', targetUserId)
      .single();

    if (fetchError || !targetUser) {
      throw new Error('Target user not found');
    }

    // 2. Validate: admin making change is actually an admin
    const isValidAdmin = await checkUserPermission(adminId, 'users:grant_admin');
    if (!isValidAdmin) {
      throw new Error('Only admins can grant admin role');
    }

    // 3. Validate: not already an admin
    const existingRole = await supabase
      .from('admin_roles')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('role', 'admin')
      .eq('status', 'active')
      .single();

    if (existingRole.data) {
      throw new Error('User is already an admin');
    }

    // 4. Validate: admin limit not exceeded
    const { count: adminCount } = await supabase
      .from('admin_roles')
      .select('id', { count: 'exact' })
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminCount >= MAX_ADMINS) {
      throw new Error(`Maximum admins limit reached (${MAX_ADMINS})`);
    }

    // 5. Grant the role
    const { data: newRole, error: grantError } = await supabase
      .from('admin_roles')
      .insert([
        {
          user_id: targetUserId,
          role: ROLES.ADMIN,
          permissions: ROLE_PERMISSIONS.admin,
          granted_by: adminId,
          status: 'active',
        },
      ])
      .select();

    if (grantError) throw grantError;

    // 6. Log the action (with sanitized reason)
    const sanitizedReason = reason ? DOMPurify.sanitize(reason, { ALLOWED_TAGS: [] }) : null;
    await logRoleChange(
      'GRANT',
      targetUserId,
      adminId,
      null,
      ROLES.ADMIN,
      { added: ROLE_PERMISSIONS.admin },
      sanitizedReason
    );

    // 7. Track in Mixpanel
    mixpanel.track('Admin Role Granted', {
      targetUserId,
      targetEmail: targetUser.email,
      adminId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      role: newRole[0],
      message: `${targetUser.email} is now an admin`,
    };
  } catch (error) {
    console.error('Error granting admin role:', error);

    // SECURITY: Log failed grant attempts to audit trail
    try {
      const sanitizedReason = reason ? DOMPurify.sanitize(reason, { ALLOWED_TAGS: [] }) : null;
      await logRoleChange(
        'GRANT_FAILED',
        targetUserId,
        adminId,
        null,
        null,
        { error: error.message },
        sanitizedReason
      );
    } catch (logError) {
      console.error('Failed to log grant attempt:', logError);
    }

    // Track failure
    mixpanel.track('Admin Role Grant Failed', {
      targetUserId,
      adminId,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Revoke admin role from a user
 * @param {string} targetUserId - User to revoke role from
 * @param {string} adminId - Admin making the change
 * @param {string} reason - Optional reason for audit log
 * @returns {Promise<Object>} Success/error result
 */
export async function revokeAdminRole(targetUserId, adminId, reason = null, csrfToken = null) {
  try {
    // SECURITY: Check rate limit
    const rateLimitCheck = checkAdminRateLimit(adminId, 'revoke');
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limited. Try again in ${rateLimitCheck.retryAfter} seconds.`);
    }

    // SECURITY: Validate CSRF token
    if (!csrfToken || !validateCSRFToken(csrfToken, adminId)) {
      throw new Error('Invalid or missing CSRF token. Request a new one.');
    }

    // 1. Validate: can't revoke self
    if (targetUserId === adminId) {
      throw new Error("You can't revoke your own admin role");
    }

    // 2. Validate: target is actually an admin
    const { data: adminRole, error: fetchError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('role', 'admin')
      .eq('status', 'active')
      .single();

    if (fetchError || !adminRole) {
      throw new Error('User is not an active admin');
    }

    // 3. Validate: at least 2 admins exist (prevent lock-out)
    const { count: adminCount } = await supabase
      .from('admin_roles')
      .select('id', { count: 'exact' })
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminCount <= 1) {
      throw new Error('Cannot revoke the last admin (prevents system lock-out)');
    }

    // 4. Validate: admin making change has permission
    const isValidAdmin = await checkUserPermission(adminId, 'users:revoke_admin');
    if (!isValidAdmin) {
      throw new Error('Only admins can revoke admin role');
    }

    // 5. Get target user info for logging
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', targetUserId)
      .single();

    // 6. Revoke the role (soft delete: set revoked_at and status)
    const { error: revokeError } = await supabase
      .from('admin_roles')
      .update({
        status: 'inactive',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUserId)
      .eq('role', 'admin');

    if (revokeError) throw revokeError;

    // 7. Log the action (with sanitized reason)
    const sanitizedReason = reason ? DOMPurify.sanitize(reason, { ALLOWED_TAGS: [] }) : null;
    await logRoleChange(
      'REVOKE',
      targetUserId,
      adminId,
      ROLES.ADMIN,
      null,
      { removed: ROLE_PERMISSIONS.admin },
      sanitizedReason
    );

    // 8. Track in Mixpanel
    mixpanel.track('Admin Role Revoked', {
      targetUserId,
      targetEmail: targetUser?.email,
      adminId,
      reason,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Admin role revoked from ${targetUser?.email}`,
    };
  } catch (error) {
    console.error('Error revoking admin role:', error);

    // SECURITY: Log failed revoke attempts to audit trail
    try {
      const sanitizedReason = reason ? DOMPurify.sanitize(reason, { ALLOWED_TAGS: [] }) : null;
      await logRoleChange(
        'REVOKE_FAILED',
        targetUserId,
        adminId,
        ROLES.ADMIN,
        null,
        { error: error.message },
        sanitizedReason
      );
    } catch (logError) {
      console.error('Failed to log revoke attempt:', logError);
    }

    // Track failure
    mixpanel.track('Admin Role Revoke Failed', {
      targetUserId,
      adminId,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// PERMISSION CHECKS
// ============================================

/**
 * Check if a user has a specific permission
 * @param {string} userId - User ID to check
 * @param {string} permission - Permission code to check
 * @returns {Promise<boolean>} True if user has permission
 */
export async function checkUserPermission(userId, permission) {
  try {
    const { data: roles, error } = await supabase
      .from('admin_roles')
      .select('permissions')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;

    // Check if any active role has the permission
    return roles?.some(role => {
      const perms = role.permissions || [];
      return Array.isArray(perms) && perms.includes(permission);
    }) || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of all permissions
 */
export async function getUserPermissions(userId) {
  try {
    const { data: roles, error } = await supabase
      .from('admin_roles')
      .select('permissions')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;

    // Merge all permissions from all roles
    const allPermissions = new Set();
    roles?.forEach(role => {
      const perms = role.permissions || [];
      if (Array.isArray(perms)) {
        perms.forEach(p => allPermissions.add(p));
      }
    });

    return Array.from(allPermissions);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

// ============================================
// ADMIN LISTING
// ============================================

/**
 * Fetch all active admins
 * @returns {Promise<Object>} List of admins with details
 */
export async function fetchAllAdmins() {
  try {
    const { data: admins, error } = await supabase
      .from('admin_roles')
      .select(`
        id,
        user_id,
        role,
        permissions,
        granted_at,
        granted_by,
        status,
        profiles!admin_roles_granted_by_fkey(email as granted_by_email, full_name as granted_by_name),
        user:profiles!admin_roles_user_id_fkey(email, full_name, created_at)
      `)
      .eq('status', 'active')
      .eq('role', 'admin')
      .order('granted_at', { ascending: false });

    if (error) throw error;

    // Format the response
    const formatted = admins?.map(admin => ({
      id: admin.id,
      userId: admin.user_id,
      email: admin.user?.email,
      fullName: admin.user?.full_name,
      role: admin.role,
      permissions: admin.permissions,
      grantedAt: admin.granted_at,
      grantedBy: {
        email: admin.profiles?.granted_by_email,
        name: admin.profiles?.granted_by_name,
      },
      status: admin.status,
    })) || [];

    return {
      success: true,
      admins: formatted,
      count: formatted.length,
    };
  } catch (error) {
    console.error('Error fetching admins:', error);
    return {
      success: false,
      admins: [],
      count: 0,
      error: error.message,
    };
  }
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log a role change to audit table
 * @param {string} action - GRANT, REVOKE, SUSPEND, etc.
 * @param {string} userId - User whose role changed
 * @param {string} adminId - Admin who made the change
 * @param {string} oldRole - Previous role
 * @param {string} newRole - New role
 * @param {object} permissionsChange - What changed
 * @param {string} reason - Optional reason
 * @returns {Promise<Object>} Audit log entry
 */
export async function logRoleChange(
  action,
  userId,
  adminId,
  oldRole,
  newRole,
  permissionsChange,
  reason = null
) {
  try {
    // SECURITY: Sanitize reason field to prevent injection
    const sanitizedReason = reason ? DOMPurify.sanitize(reason, { ALLOWED_TAGS: [] }) : null;

    const { data, error } = await supabase
      .from('role_change_audit_log')
      .insert([
        {
          action,
          user_id: userId,
          admin_id: adminId,
          old_role: oldRole,
          new_role: newRole,
          permissions_change: permissionsChange,
          reason: sanitizedReason, // Sanitized
        },
      ])
      .select();

    if (error) throw error;

    return {
      success: true,
      logEntry: data[0],
    };
  } catch (error) {
    console.error('Error logging role change:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetch audit log entries
 * @param {object} options - Filter options
 * @returns {Promise<Object>} Audit log entries
 */
export async function fetchAuditLog(options = {}) {
  try {
    const { 
      limit = 50, 
      offset = 0,
      action = null,
      userId = null,
      dateFrom = null,
      dateTo = null,
    } = options;

    let query = supabase
      .from('role_change_audit_log')
      .select(`
        id,
        action,
        user_id,
        admin_id,
        old_role,
        new_role,
        reason,
        created_at
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Format response (fetch user details separately to prevent SQL injection)
    const formatted = data?.map(entry => ({
      id: entry.id,
      action: entry.action,
      userId: entry.user_id,
      adminId: entry.admin_id,
      user: null,
      admin: null,
      oldRole: entry.old_role,
      newRole: entry.new_role,
      reason: entry.reason,
      timestamp: entry.created_at,
    })) || [];

    return {
      success: true,
      logs: formatted,
      totalCount: count || 0,
      hasMore: offset + limit < (count || 0),
    };
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return {
      success: false,
      logs: [],
      totalCount: 0,
      error: error.message,
    };
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that user has admin access
 * @param {string} userId - User to check
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isUserAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .eq('status', 'active')
      .single();

    if (error) return false;
    return !!data;
  } catch (error) {
    return false;
  }
}
