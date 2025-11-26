import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as adminService from '../services/adminService';

/**
 * Admin Store
 * Manages admin view state, user list, analytics, and activity logs
 */

export const useAdminStore = create(
  persist(
    (set) => ({
      // State
      isAdminViewActive: false,
      currentAdminUserId: null,
      users: [],
      usersLoading: false,
      selectedUser: null,
      analytics: null,
      analyticsLoading: false,
      activityLog: [],
      activityLogLoading: false,
      systemHealth: null,
      systemHealthLoading: false,
      revenueMetrics: null,
      revenueMetricsLoading: false,
      searchQuery: '',
      tierFilter: 'all',
      currentPage: 1,
      usersPerPage: 25,
      sortBy: 'created_at',
      sortOrder: 'desc',

      // Admin View Toggle
      setAdminViewActive: (isActive) => set({ isAdminViewActive: isActive }),
      setCurrentAdminUserId: (userId) => set({ currentAdminUserId: userId }),

      // User Management
      fetchUsers: async (options = {}) => {
        set({ usersLoading: true });
        const { users, totalCount, error } = await adminService.fetchAllUsers(options);
        set({ 
          users,
          usersLoading: false,
          error: error || null
        });
        return { users, totalCount };
      },

      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
      setTierFilter: (tier) => set({ tierFilter: tier, currentPage: 1 }),
      setCurrentPage: (page) => set({ currentPage: page }),

      fetchUserDetails: async (userId) => {
        set({ usersLoading: true });
        const { user, error } = await adminService.getUserDetails(userId);
        set({ 
          selectedUser: user,
          usersLoading: false
        });
        return { user, error };
      },

      updateUserTier: async (userId, newTier, adminId) => {
        set({ usersLoading: true });
        const { success, error } = await adminService.updateUserSubscriptionTier(userId, newTier, adminId);
        
        if (success) {
          // Update in local state
          set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u),
            selectedUser: state.selectedUser?.id === userId 
              ? { ...state.selectedUser, subscription_tier: newTier }
              : state.selectedUser,
            usersLoading: false
          }));
        } else {
          set({ usersLoading: false });
        }

        return { success, error };
      },

      deactivateUser: async (userId, adminId) => {
        set({ usersLoading: true });
        const { success, error } = await adminService.deactivateUser(userId, adminId);
        
        if (success) {
          set(state => ({
            users: state.users.filter(u => u.id !== userId),
            selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
            usersLoading: false
          }));
        } else {
          set({ usersLoading: false });
        }

        return { success, error };
      },

      deleteUser: async (userId, adminId) => {
        set({ usersLoading: true });
        const { success, error } = await adminService.deleteUser(userId, adminId);
        
        if (success) {
          set(state => ({
            users: state.users.filter(u => u.id !== userId),
            selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
            usersLoading: false
          }));
        } else {
          set({ usersLoading: false });
        }

        return { success, error };
      },

      // Analytics
      fetchAnalytics: async () => {
        set({ analyticsLoading: true });
        const { success, analytics, error } = await adminService.getSystemAnalytics();
        set({ 
          analytics: success ? analytics : null,
          analyticsLoading: false
        });
        return { success, error };
      },

      fetchRevenueMetrics: async () => {
        set({ revenueMetricsLoading: true });
        const { success, revenue, error } = await adminService.getRevenueMetrics();
        set({ 
          revenueMetrics: success ? revenue : null,
          revenueMetricsLoading: false
        });
        return { success, error };
      },

      // Activity Log
      fetchActivityLog: async (options = {}) => {
        set({ activityLogLoading: true });
        const { logs, totalCount, error } = await adminService.fetchAdminActivityLog(options);
        set({ 
          activityLog: logs,
          activityLogLoading: false
        });
        return { logs, totalCount, error };
      },

      // System Health
      fetchSystemHealth: async () => {
        set({ systemHealthLoading: true });
        const { success, health, error } = await adminService.getSystemHealth();
        set({ 
          systemHealth: success ? health : null,
          systemHealthLoading: false
        });
        return { success, error };
      },

      // Admin Management
      promoteToAdmin: async (userId, adminId) => {
        const { success, error } = await adminService.promoteUserToAdmin(userId, adminId);
        
        if (success) {
          set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, role: 'admin' } : u),
            selectedUser: state.selectedUser?.id === userId 
              ? { ...state.selectedUser, role: 'admin' }
              : state.selectedUser
          }));
        }

        return { success, error };
      },

      demoteFromAdmin: async (userId, adminId) => {
        const { success, error } = await adminService.demoteAdminToUser(userId, adminId);
        
        if (success) {
          set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, role: 'user' } : u),
            selectedUser: state.selectedUser?.id === userId 
              ? { ...state.selectedUser, role: 'user' }
              : state.selectedUser
          }));
        }

        return { success, error };
      },

      // Clear admin view
      clearAdminView: () => set({
        isAdminViewActive: false,
        selectedUser: null,
        searchQuery: '',
        tierFilter: 'all',
        currentPage: 1
      })
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({
        isAdminViewActive: state.isAdminViewActive,
        tierFilter: state.tierFilter,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        usersPerPage: state.usersPerPage
      })
    }
  )
);
