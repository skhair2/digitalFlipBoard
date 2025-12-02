import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as permissionService from '../services/permissionService';
import mixpanel from '../services/mixpanelService';

/**
 * Admin Role Store
 * Manages admin roles, permissions, and user access control
 */

export const useRoleStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE: Admin Management
      // ============================================

      admins: [],
      adminCount: 0,
      loadingAdmins: false,
      adminError: null,

      // ============================================
      // STATE: User Lookup & Search
      // ============================================

      searchResults: [],
      searchQuery: '',
      searchLoading: false,
      searchError: null,
      selectedUser: null,

      // ============================================
      // STATE: Grant/Revoke
      // ============================================

      grantingRole: null,
      revokingRole: null,
      grantError: null,
      revokeError: null,
      grantRateLimit: null,
      revokeRateLimit: null,

      // ============================================
      // STATE: Audit Log
      // ============================================

      auditLogs: [],
      auditLoading: false,
      auditError: null,
      auditPage: 0,
      auditPageSize: 50,
      auditHasMore: false,

      // ============================================
      // STATE: Modal/UI State
      // ============================================

      showGrantModal: false,
      showRevokeConfirmModal: false,
      grantVerificationEmail: '',
      grantVerificationConfirmed: false,

      // ============================================
      // ACTIONS: Admin Listing
      // ============================================

      /**
       * Fetch all active admins
       */
      fetchAllAdmins: async () => {
        set({ loadingAdmins: true, adminError: null });
        try {
          const result = await permissionService.fetchAllAdmins();
          if (result.success) {
            set({
              admins: result.admins,
              adminCount: result.count,
              loadingAdmins: false,
            });

            mixpanel.track('Admins Fetched', {
              adminCount: result.count,
            });
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({
            adminError: error.message,
            loadingAdmins: false,
          });
          console.error('Error fetching admins:', error);
        }
      },

      // ============================================
      // ACTIONS: User Search/Lookup
      // ============================================

      /**
       * Search for users by email
       */
      searchUsers: async (email) => {
        if (!email.trim()) {
          set({ searchResults: [], searchQuery: '' });
          return;
        }

        set({
          searchQuery: email,
          searchLoading: true,
          searchError: null,
          selectedUser: null,
        });

        try {
          const result = await permissionService.searchUsersByEmail(email);
          if (result.success) {
            set({
              searchResults: result.users,
              searchLoading: false,
            });

            mixpanel.track('User Search', {
              query: email,
              resultCount: result.count,
            });
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({
            searchError: error.message,
            searchLoading: false,
            searchResults: [],
          });
        }
      },

      /**
       * Select a user from search results
       */
      selectUser: async (userId) => {
        set({ searchLoading: true, searchError: null });
        try {
          const result = await permissionService.getUserWithRoles(userId);
          if (result.success) {
            set({
              selectedUser: result.user,
              searchLoading: false,
            });
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({
            searchError: error.message,
            selectedUser: null,
            searchLoading: false,
          });
        }
      },

      /**
       * Clear search state
       */
      clearSearch: () => {
        set({
          searchResults: [],
          searchQuery: '',
          selectedUser: null,
          searchError: null,
        });
      },

      // ============================================
      // ACTIONS: Grant Admin Role
      // ============================================

      /**
       * Show grant modal
       */
      openGrantModal: () => {
        set({
          showGrantModal: true,
          grantVerificationEmail: '',
          grantVerificationConfirmed: false,
        });
      },

      /**
       * Close grant modal
       */
      closeGrantModal: () => {
        set({
          showGrantModal: false,
          grantVerificationEmail: '',
          grantVerificationConfirmed: false,
          grantError: null,
        });
      },

      /**
       * Verify email in grant modal (user types email twice)
       */
      verifyGrantEmail: (email) => {
        const { selectedUser } = get();
        if (selectedUser && email.toLowerCase() === selectedUser.email.toLowerCase()) {
          set({ grantVerificationEmail: email, grantVerificationConfirmed: true });
        } else {
          set({
            grantVerificationEmail: email,
            grantVerificationConfirmed: false,
            grantError: email ? 'Email does not match' : null,
          });
        }
      },

      /**
       * Actually grant admin role to user
       */
      grantAdminRole: async (adminId, reason = null) => {
        const { selectedUser } = get();
        if (!selectedUser) {
          set({ grantError: 'No user selected' });
          return;
        }

        set({ grantingRole: selectedUser.id, grantError: null, grantRateLimit: null });
        try {
          const { csrfToken, rateLimit } = await permissionService.generateCSRFToken(adminId, 'grant');
          if (rateLimit) {
            set({ grantRateLimit: rateLimit });
          }

          const result = await permissionService.grantAdminRole(
            selectedUser.id,
            adminId,
            reason,
            csrfToken,
            'grant'
          );

          if (result.success) {
            // Refresh admin list
            await get().fetchAllAdmins();

            set({
              grantingRole: null,
              showGrantModal: false,
              grantVerificationEmail: '',
              grantVerificationConfirmed: false,
              grantRateLimit: rateLimit || null,
            });

            mixpanel.track('Admin Role Granted UI', {
              userId: selectedUser.id,
              userEmail: selectedUser.email,
            });

            return { success: true, message: result.message };
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          const rateLimit = error?.rateLimit || null;
          set({
            grantError: error?.message || 'Failed to grant admin role',
            grantingRole: null,
            grantRateLimit: rateLimit,
          });
          return { success: false, error: error?.message || 'Failed to grant admin role', rateLimit };
        }
      },

      // ============================================
      // ACTIONS: Revoke Admin Role
      // ============================================

      /**
       * Show revoke confirmation modal
       */
      openRevokeModal: (userId) => {
        set({
          showRevokeConfirmModal: true,
          selectedUser: get().admins.find(a => a.userId === userId),
          revokeError: null,
        });
      },

      /**
       * Close revoke modal
       */
      closeRevokeModal: () => {
        set({
          showRevokeConfirmModal: false,
          revokeError: null,
        });
      },

      /**
       * Actually revoke admin role from user
       */
      revokeAdminRole: async (adminId, reason = null) => {
        const { selectedUser } = get();
        if (!selectedUser) {
          set({ revokeError: 'No user selected' });
          return;
        }

        set({ revokingRole: selectedUser.userId, revokeError: null, revokeRateLimit: null });
        try {
          const { csrfToken, rateLimit } = await permissionService.generateCSRFToken(adminId, 'revoke');
          if (rateLimit) {
            set({ revokeRateLimit: rateLimit });
          }

          const result = await permissionService.revokeAdminRole(
            selectedUser.userId,
            adminId,
            reason,
            csrfToken,
            'revoke'
          );

          if (result.success) {
            // Refresh admin list
            await get().fetchAllAdmins();

            set({
              revokingRole: null,
              showRevokeConfirmModal: false,
              selectedUser: null,
              revokeRateLimit: rateLimit || null,
            });

            mixpanel.track('Admin Role Revoked UI', {
              userId: selectedUser.userId,
              userEmail: selectedUser.email,
            });

            return { success: true, message: result.message };
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          const rateLimit = error?.rateLimit || null;
          set({
            revokeError: error?.message || 'Failed to revoke admin role',
            revokingRole: null,
            revokeRateLimit: rateLimit,
          });
          return { success: false, error: error?.message || 'Failed to revoke admin role', rateLimit };
        }
      },

      // ============================================
      // ACTIONS: Audit Log
      // ============================================

      /**
       * Fetch audit log entries
       */
      fetchAuditLog: async (options = {}) => {
        set({ auditLoading: true, auditError: null });
        try {
          const result = await permissionService.fetchAuditLog({
            limit: get().auditPageSize,
            offset: options.page ? options.page * get().auditPageSize : 0,
            ...options,
          });

          if (result.success) {
            set({
              auditLogs: result.logs,
              auditHasMore: result.hasMore,
              auditLoading: false,
              auditPage: options.page || 0,
            });

            mixpanel.track('Audit Log Fetched', {
              count: result.logs.length,
            });
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          set({
            auditError: error.message,
            auditLoading: false,
          });
        }
      },

      /**
       * Load next page of audit logs
       */
      loadMoreAuditLogs: async () => {
        const { auditPage, auditHasMore } = get();
        if (!auditHasMore) return;

        await get().fetchAuditLog({ page: auditPage + 1 });
      },

      /**
       * Clear audit logs state
       */
      clearAuditLogs: () => {
        set({
          auditLogs: [],
          auditPage: 0,
          auditError: null,
        });
      },

      // ============================================
      // ACTIONS: Utility
      // ============================================

      /**
       * Clear all errors
       */
      clearErrors: () => {
        set({
          searchError: null,
          grantError: null,
          revokeError: null,
          adminError: null,
          auditError: null,
        });
      },

      /**
       * Reset entire role store
       */
      resetRoleStore: () => {
        set({
          admins: [],
          adminCount: 0,
          loadingAdmins: false,
          adminError: null,
          searchResults: [],
          searchQuery: '',
          searchLoading: false,
          searchError: null,
          selectedUser: null,
          grantingRole: null,
          revokingRole: null,
          grantError: null,
          revokeError: null,
          auditLogs: [],
          auditLoading: false,
          auditError: null,
          auditPage: 0,
          showGrantModal: false,
          showRevokeConfirmModal: false,
          grantVerificationEmail: '',
          grantVerificationConfirmed: false,
        });
      },
    }),
    {
      name: 'role-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        auditPage: state.auditPage,
        auditPageSize: state.auditPageSize,
      }),
    }
  )
);
