import React, { useCallback, useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import * as adminService from '../../services/adminService';
import { emailService } from '../../services/emailService';
import Spinner from '../ui/Spinner';

/**
 * User Management
 * View and manage all users, update subscriptions, etc.
 */

export default function UserManagement() {
  const { users, totalUsers, setUsers, setTotalUsers } = useAdminStore();
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await adminService.fetchAllUsers({ limit: 50 });
      setUsers(result.users);
      setTotalUsers(result.totalCount);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setUsers, setTotalUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }
    try {
      setLoading(true);
      const result = await adminService.fetchAllUsers({ searchQuery });
      setUsers(result.users || []);
      setTotalUsers(result.totalCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTier = async (userId, newTier) => {
    try {
      setUpdatingUser(userId);
      await adminService.updateUserSubscriptionTier(userId, newTier);
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u));
      setSelectedUser(null);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure? This will disable the user account.')) return;
    
    try {
      setUpdatingUser(userId);
      await adminService.deactivateUser(userId);
      
      // Reload users
      loadUsers();
      setSelectedUser(null);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleResendWelcomeEmail = async (userId) => {
    if (!selectedUser) return;
    
    try {
      setUpdatingUser(userId);
      await emailService.sendWelcome(selectedUser.email, selectedUser.full_name || 'User');
      
      // Update the welcome_email_sent flag in database
      await adminService.updateUserWelcomeEmailFlag(userId, true);
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, welcome_email_sent: true } : u));
      setSelectedUser({ ...selectedUser, welcome_email_sent: true });
      setError(null);
      alert('Welcome email sent successfully!');
    } catch (err) {
      setError('Failed to send welcome email: ' + err.message);
      alert('Error sending email: ' + err.message);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleResendVerificationEmail = async (userId) => {
    if (!selectedUser) return;
    
    try {
      setUpdatingUser(userId);
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call Supabase admin API to resend verification email
      const response = await fetch('/api/admin/resend-verification-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, email: selectedUser.email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend verification email');
      }
      
      setError(null);
      alert('Verification email sent successfully!');
    } catch (err) {
      setError('Failed to send verification email: ' + err.message);
      alert('Error sending email: ' + err.message);
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filterTier !== 'all' && user.subscription_tier !== filterTier) return false;
    return true;
  });

  if (loading && users.length === 0) return <Spinner />;

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-2">Manage users and subscriptions ({totalUsers} total)</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            <p>{error}</p>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Search Users</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  placeholder="Email or name..."
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSearchUsers}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  🔍
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Filter by Tier</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">&nbsp;</label>
              <button
                onClick={loadUsers}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-gray-300 font-semibold">User</th>
                <th className="px-6 py-3 text-left text-gray-300 font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-gray-300 font-semibold">Tier</th>
                <th className="px-6 py-3 text-left text-gray-300 font-semibold">Signup Method</th>
                <th className="px-6 py-3 text-left text-gray-300 font-semibold">Email Verified</th>
                <th className="px-6 py-3 text-left text-gray-300 font-semibold">Joined</th>
                <th className="px-6 py-3 text-left text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{user.full_name || user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.subscription_tier === 'free' ? 'bg-gray-700 text-gray-300' :
                        user.subscription_tier === 'pro' ? 'bg-indigo-600/30 text-indigo-300' :
                        'bg-purple-600/30 text-purple-300'
                      }`}>
                        {user.subscription_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        user.signup_method === 'google_oauth' ? 'bg-blue-600/30 text-blue-300' :
                        user.signup_method === 'magic_link' ? 'bg-green-600/30 text-green-300' :
                        'bg-gray-600/30 text-gray-300'
                      }`}>
                        {user.signup_method === 'google_oauth' ? '🔵 Google' :
                         user.signup_method === 'magic_link' ? '📧 Magic Link' :
                         '🔐 Password'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.email_verified ? 'bg-green-600/30 text-green-300' :
                        'bg-yellow-600/30 text-yellow-300'
                      }`}>
                        {user.email_verified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Manage User</h2>

            <div className="mb-6 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white font-medium">{selectedUser.full_name || selectedUser.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email Verification</p>
                <p className="text-white font-medium">
                  {selectedUser.email_verified ? '✅ Verified' : '⏳ Pending'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Change Subscription Tier</p>
                <div className="space-y-2">
                  {['free', 'pro', 'enterprise'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => handleUpdateTier(selectedUser.id, tier)}
                      disabled={updatingUser === selectedUser.id}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedUser.subscription_tier === tier
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      {updatingUser === selectedUser.id ? '⏳ Updating...' : tier.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleResendWelcomeEmail(selectedUser.id)}
                disabled={updatingUser === selectedUser.id}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {updatingUser === selectedUser.id ? '⏳ Sending...' : '📧 Resend Welcome Email'}
              </button>
              {selectedUser.signup_method !== 'google_oauth' && !selectedUser.email_verified && (
                <button
                  onClick={() => handleResendVerificationEmail(selectedUser.id)}
                  disabled={updatingUser === selectedUser.id}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {updatingUser === selectedUser.id ? '⏳ Sending...' : '✉️ Resend Verification Email'}
                </button>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeactivateUser(selectedUser.id)}
                  disabled={updatingUser === selectedUser.id}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {updatingUser === selectedUser.id ? '⏳ ...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
