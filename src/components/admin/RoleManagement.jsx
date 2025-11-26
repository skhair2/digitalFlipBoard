import React, { useEffect, useState } from 'react';
import { useRoleStore } from '../../store/roleStore';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../ui/Spinner';
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

/**
 * Role Management Component
 * Complete admin role management UI with user lookup, grant/revoke, and audit log
 * Integrated subcomponents: UserLookupPanel, AdminsList, AuditLog
 */

export default function RoleManagement() {
  const { user } = useAuthStore();
  const {
    admins,
    adminCount,
    loadingAdmins,
    adminError,
    searchResults,
    searchQuery,
    searchLoading,
    searchError,
    selectedUser,
    showGrantModal,
    showRevokeConfirmModal,
    grantVerificationEmail,
    grantVerificationConfirmed,
    grantingRole,
    revokingRole,
    grantError,
    revokeError,
    auditLogs,
    auditLoading,
    auditHasMore,
    fetchAllAdmins,
    searchUsers,
    selectUser,
    clearSearch,
    openGrantModal,
    closeGrantModal,
    verifyGrantEmail,
    grantAdminRole,
    openRevokeModal,
    closeRevokeModal,
    revokeAdminRole,
    fetchAuditLog,
    loadMoreAuditLogs,
  } = useRoleStore();

  const [activeTab, setActiveTab] = useState('lookup'); // lookup, admins, audit
  const [grantReason, setGrantReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Load data on mount
  useEffect(() => {
    fetchAllAdmins();
    if (activeTab === 'audit') {
      fetchAuditLog();
    }
  }, []);

  // Debounced search
  const handleSearchChange = (email) => {
    clearTimeout(searchDebounce);
    const timeout = setTimeout(() => {
      if (email.trim()) {
        searchUsers(email);
      }
    }, 300);
    setSearchDebounce(timeout);
  };

  const handleGrantClick = async () => {
    const result = await grantAdminRole(user.id, grantReason);
    if (result.success) {
      setGrantReason('');
      // Store will handle closing modal
    }
  };

  const handleRevokeClick = async (adminUserId) => {
    openRevokeModal(adminUserId);
  };

  const handleRevokeConfirm = async () => {
    const result = await revokeAdminRole(user.id, revokeReason);
    if (result.success) {
      setRevokeReason('');
    }
  };

  // Tab switching with data fetch
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'audit' && auditLogs.length === 0) {
      fetchAuditLog();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600/20 rounded-lg">
          <ShieldCheckIcon className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Role Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage admin roles and permissions ({adminCount} active admins)</p>
        </div>
      </div>

      {/* Error Banner */}
      {(adminError || grantError || revokeError) && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 flex items-start gap-3">
          <ExclamationIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{adminError || grantError || revokeError}</p>
            <p className="text-sm mt-1">Please try again or contact support if the problem persists.</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'lookup', label: '🔍 Find & Grant', icon: MagnifyingGlassIcon },
          { id: 'admins', label: '👥 All Admins', icon: ShieldCheckIcon },
          { id: 'audit', label: '📋 Audit Log', icon: ClockIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: USER LOOKUP & GRANT */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          {/* Search Panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Search User by Email</h2>

            {/* Search Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">User Email</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-3">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {!searchLoading && searchQuery && (
                    <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Search Error */}
              {searchError && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-300 text-sm">
                  {searchError}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                  <div className="space-y-2">
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => selectUser(result.id)}
                        className="w-full p-3 bg-gray-700 hover:bg-gray-650 border border-gray-600 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-white">{result.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-400">{result.email}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded">
                            {result.subscription_tier}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchQuery && searchResults.length === 0 && !searchLoading && !selectedUser && (
                <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-center text-gray-400">
                  No users found with that email
                </div>
              )}

              {/* Selected User Card */}
              {selectedUser && (
                <div className="mt-6 p-4 bg-indigo-600/10 border border-indigo-500/50 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Selected User</p>
                      <h3 className="text-lg font-semibold text-white">{selectedUser.full_name}</h3>
                      <p className="text-sm text-gray-400">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={clearSearch}
                      className="text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* User Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-400">Subscription</p>
                      <p className="text-white font-medium">{selectedUser.subscription_tier}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Member Since</p>
                      <p className="text-white font-medium">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Current Role */}
                  {selectedUser.isAdmin ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/50 rounded text-amber-300 text-sm">
                      ⚠️ This user is already an admin
                    </div>
                  ) : (
                    <button
                      onClick={openGrantModal}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ✓ Grant Admin Role
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL ADMINS */}
      {activeTab === 'admins' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {loadingAdmins ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No admins found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-300 font-semibold">Admin</th>
                    <th className="px-6 py-3 text-left text-gray-300 font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-gray-300 font-semibold">Granted</th>
                    <th className="px-6 py-3 text-left text-gray-300 font-semibold">By</th>
                    <th className="px-6 py-3 text-left text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {admins.map(admin => (
                    <tr key={admin.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{admin.fullName || 'Unknown'}</p>
                          {admin.userId === user.id && (
                            <p className="text-xs text-indigo-400 mt-1">You</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{admin.email}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(admin.grantedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {admin.grantedBy?.name || 'System'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRevokeClick(admin.userId)}
                          disabled={admin.userId === user.id || revokingRole === admin.userId}
                          className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                            admin.userId === user.id
                              ? 'text-gray-500 cursor-not-allowed opacity-50'
                              : revokingRole === admin.userId
                                ? 'text-gray-400'
                                : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                          }`}
                        >
                          {revokingRole === admin.userId ? 'Revoking...' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {auditLoading && auditLogs.length === 0 ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No role changes yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {auditLogs.map(log => (
                <div key={log.id} className="px-6 py-4 border-b border-gray-700 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-sm font-semibold px-2 py-1 rounded ${
                          log.action === 'GRANT'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-white font-medium">{log.user?.email}</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        by {log.admin?.name || log.admin?.email || 'System'}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-gray-500 mt-1 italic">{log.reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {auditHasMore && (
                <div className="px-6 py-4 border-t border-gray-700">
                  <button
                    onClick={loadMoreAuditLogs}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm font-medium"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Grant Admin */}
      {showGrantModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-700 bg-gray-750">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-indigo-400" />
                Grant Admin Role
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">User</p>
                <p className="text-white font-medium">{selectedUser.email}</p>
              </div>

              {/* Verification Step */}
              <div className="pt-4 border-t border-gray-700">
                <label className="block text-sm text-gray-400 mb-2">
                  Type email to confirm:
                </label>
                <input
                  type="email"
                  value={grantVerificationEmail}
                  onChange={(e) => verifyGrantEmail(e.target.value)}
                  placeholder={selectedUser.email}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
                {grantVerificationConfirmed && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <CheckIcon className="w-4 h-4" />
                    Email verified
                  </p>
                )}
              </div>

              {/* Reason (Optional) */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="e.g. New team member"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                  rows="2"
                />
              </div>

              {/* Permissions Preview */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Permissions Granted</p>
                <div className="space-y-1 text-xs text-gray-300">
                  <p>✓ View all users</p>
                  <p>✓ Grant/revoke admin roles</p>
                  <p>✓ Manage coupons</p>
                  <p>✓ View audit logs</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-700 bg-gray-750 flex gap-3">
              <button
                onClick={closeGrantModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantClick}
                disabled={!grantVerificationConfirmed || grantingRole === selectedUser.id}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                {grantingRole === selectedUser.id ? 'Granting...' : 'Grant Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Revoke Admin Confirmation */}
      {showRevokeConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-700 bg-red-950/50">
              <h2 className="text-lg font-bold text-red-300 flex items-center gap-2">
                <ExclamationIcon className="w-5 h-5" />
                Revoke Admin Access
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-300">Are you sure you want to revoke admin access from:</p>
                <p className="text-lg font-semibold text-white mt-2">{selectedUser.email}</p>
              </div>

              {/* Reason */}
              <div className="pt-4 border-t border-gray-700">
                <label className="block text-sm text-gray-400 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Left the team"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                  rows="2"
                />
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/50 rounded text-amber-300 text-sm">
                This action cannot be undone. The user will lose all admin privileges immediately.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-700 bg-gray-750 flex gap-3">
              <button
                onClick={closeRevokeModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeConfirm}
                disabled={revokingRole === selectedUser.userId}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                {revokingRole === selectedUser.userId ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
