import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoleStore } from '../../store/roleStore';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../ui/Spinner';
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserPlusIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

/**
 * Role Management Component
 * Complete admin role management UI with user lookup, grant/revoke, and audit log
 * Redesigned for high-fidelity Senior UI/UX standards
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
    grantRateLimit,
    revokeRateLimit,
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
  }, [fetchAllAdmins]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLog();
    }
  }, [activeTab, fetchAuditLog]);

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
    }
  };

  const handleRevokeConfirm = async () => {
    const result = await revokeAdminRole(user.id, revokeReason);
    if (result.success) {
      setRevokeReason('');
    }
  };

  const getCooldownSeconds = (rateLimit) => {
    if (!rateLimit?.resetAt) return null;
    const remaining = Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    return remaining;
  };

  // Tab switching with data fetch
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'audit' && auditLogs.length === 0) {
      fetchAuditLog();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-teal-400 font-mono text-sm tracking-wider uppercase">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Security & Access</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            ROLE <span className="text-teal-500">MANAGEMENT</span>
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Configure administrative privileges, monitor access changes, and manage the core team permissions.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Active Admins</p>
            <p className="text-2xl font-black text-white font-mono">{adminCount}</p>
          </div>
          <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20">
            <UserGroupIcon className="w-6 h-6 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {(adminError || grantError || revokeError) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-start gap-4 backdrop-blur-md"
          >
            <div className="p-2 bg-red-500/20 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold uppercase tracking-tight text-sm">System Error</p>
              <p className="text-sm opacity-80">{adminError || grantError || revokeError}</p>
            </div>
            <button 
              onClick={() => fetchAllAdmins()}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'lookup', label: 'Find & Grant', icon: UserPlusIcon, desc: 'Add new administrators' },
            { id: 'admins', label: 'Active Team', icon: ShieldCheckIcon, desc: 'Manage current admins' },
            { id: 'audit', label: 'Audit Log', icon: ClipboardDocumentListIcon, desc: 'Track all role changes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 border border-slate-800/50'
                }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm uppercase tracking-tight">{tab.label}</p>
                <p className={`text-[10px] uppercase tracking-widest opacity-60 font-medium ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`}>
                  {tab.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl min-h-[500px]"
          >
            {/* TAB 1: USER LOOKUP & GRANT */}
            {activeTab === 'lookup' && (
              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">User Discovery</h2>
                  <p className="text-slate-400 text-sm">Search for users by email to grant administrative privileges.</p>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    placeholder="Search by email address..."
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                  />
                  {searchLoading && (
                    <div className="absolute right-4 top-4">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>

                {/* Search Results */}
                <AnimatePresence mode="wait">
                  {searchResults.length > 0 && !selectedUser ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] px-2">
                        Search Results ({searchResults.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map(result => (
                          <button
                            key={result.id}
                            onClick={() => selectUser(result.id)}
                            className="p-4 bg-slate-950/30 hover:bg-slate-800/50 border border-slate-800 rounded-2xl text-left transition-all group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-teal-500 font-bold group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                {result.full_name?.[0] || '?'}
                              </div>
                              <span className="text-[10px] px-2 py-1 bg-slate-800 text-slate-400 rounded-lg font-bold uppercase tracking-widest">
                                {result.subscription_tier}
                              </span>
                            </div>
                            <p className="font-bold text-white truncate">{result.full_name || 'Anonymous User'}</p>
                            <p className="text-xs text-slate-500 truncate font-mono">{result.email}</p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : selectedUser ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-teal-500/5 border border-teal-500/20 rounded-3xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4">
                        <button
                          onClick={clearSearch}
                          className="p-2 hover:bg-teal-500/10 rounded-xl text-teal-500 transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-teal-500 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-teal-500/20">
                          {selectedUser.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUser.full_name}</h3>
                          <p className="text-teal-500 font-mono text-sm">{selectedUser.email}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-[10px] px-2 py-1 bg-teal-500/20 text-teal-400 rounded-lg font-bold uppercase tracking-widest border border-teal-500/20">
                              {selectedUser.subscription_tier}
                            </span>
                            <span className="text-[10px] px-2 py-1 bg-slate-800 text-slate-400 rounded-lg font-bold uppercase tracking-widest">
                              Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedUser.isAdmin ? (
                        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                          <ShieldCheckIcon className="w-5 h-5" />
                          <p className="text-sm font-bold uppercase tracking-tight">User already has administrative access</p>
                        </div>
                      ) : (
                        <button
                          onClick={openGrantModal}
                          className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                        >
                          <UserPlusIcon className="w-5 h-5" />
                          Grant Admin Privileges
                        </button>
                      )}
                    </motion.div>
                  ) : searchQuery && !searchLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-12 text-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                        <MagnifyingGlassIcon className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-500 font-medium">No users found matching "{searchQuery}"</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}

            {/* TAB 2: ALL ADMINS */}
            {activeTab === 'admins' && (
              <div className="flex flex-col h-full">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Administrative Team</h2>
                    <p className="text-slate-400 text-sm">Current users with system-wide access.</p>
                  </div>
                  <button 
                    onClick={() => fetchAllAdmins()}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                  >
                    <ArrowPathIcon className={`w-5 h-5 ${loadingAdmins ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingAdmins ? (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <Spinner />
                  </div>
                ) : admins.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center">
                      <ShieldCheckIcon className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-medium">No active administrators found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] border-b border-slate-800">
                          <th className="px-8 py-4 text-left">Administrator</th>
                          <th className="px-8 py-4 text-left">Access Level</th>
                          <th className="px-8 py-4 text-left">Granted</th>
                          <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {admins.map(admin => (
                          <tr key={admin.id} className="group hover:bg-slate-800/30 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-teal-500 font-bold">
                                  {admin.fullName?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="font-bold text-white flex items-center gap-2">
                                    {admin.fullName || 'Unknown'}
                                    {admin.userId === user.id && (
                                      <span className="text-[8px] px-1.5 py-0.5 bg-teal-500/20 text-teal-400 rounded font-black uppercase tracking-widest">You</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono">{admin.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] px-2 py-1 bg-slate-800 text-slate-300 rounded-lg font-bold uppercase tracking-widest border border-slate-700">
                                {admin.role}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-xs text-slate-400 font-medium">{new Date(admin.grantedAt).toLocaleDateString()}</p>
                              <p className="text-[10px] text-slate-600 uppercase font-bold">by {admin.grantedBy?.name || 'System'}</p>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button
                                onClick={() => handleRevokeClick(admin.userId)}
                                disabled={admin.userId === user.id || revokingRole === admin.userId}
                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${admin.userId === user.id
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : revokingRole === admin.userId
                                    ? 'text-slate-500 animate-pulse'
                                    : 'text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20'
                                  }`}
                              >
                                {revokingRole === admin.userId ? 'Revoking...' : 'Revoke Access'}
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
              <div className="flex flex-col h-full">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Security Audit Log</h2>
                    <p className="text-slate-400 text-sm">Immutable record of all administrative access changes.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Live Monitoring</span>
                  </div>
                </div>

                {auditLoading && auditLogs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <Spinner />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-medium">No audit entries recorded yet.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="divide-y divide-slate-800/50">
                      {auditLogs.map(log => (
                        <div key={log.id} className="px-8 py-6 hover:bg-slate-800/20 transition-colors group">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${log.action === 'GRANT'
                                ? 'bg-teal-500/10 text-teal-500'
                                : 'bg-red-500/10 text-red-500'
                                }`}>
                                {log.action === 'GRANT' ? <UserPlusIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${log.action === 'GRANT'
                                    ? 'bg-teal-500/20 text-teal-400'
                                    : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {log.action}
                                  </span>
                                  <span className="text-white font-bold">{log.user?.email || 'Unknown User'}</span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Action performed by <span className="text-slate-300 font-medium">{log.admin?.name || log.admin?.email || 'System'}</span>
                                </p>
                                {log.reason && (
                                  <div className="mt-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                    <p className="text-xs text-slate-400 italic">"{log.reason}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-white font-mono font-bold">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono uppercase">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Load More */}
                    {auditHasMore && (
                      <div className="p-8">
                        <button
                          onClick={loadMoreAuditLogs}
                          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all text-xs font-black uppercase tracking-[0.2em] border border-slate-700"
                        >
                          Load More Entries
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* MODAL: Grant Admin */}
      <AnimatePresence>
        {showGrantModal && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeGrantModal}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl relative z-10"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-800 bg-slate-950/50">
                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <ShieldCheckIcon className="w-6 h-6 text-teal-500" />
                  </div>
                  Grant Access
                </h2>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Target User</p>
                  <p className="text-white font-bold">{selectedUser.email}</p>
                </div>

                {/* Verification Step */}
                <div className="space-y-3">
                  <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    Security Confirmation
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={grantVerificationEmail}
                      onChange={(e) => verifyGrantEmail(e.target.value)}
                      placeholder="Type user email to confirm..."
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-teal-500 transition-all text-sm"
                    />
                    {grantVerificationConfirmed && (
                      <div className="absolute right-3 top-3 text-teal-500">
                        <CheckIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {grantVerificationConfirmed && (
                    <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      Identity Confirmed
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-3">
                  <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    Authorization Reason
                  </label>
                  <textarea
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    placeholder="Why is this access being granted?"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-teal-500 transition-all text-sm resize-none"
                    rows="2"
                  />
                </div>

                {/* Permissions Preview */}
                <div className="p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">Privileges Included</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['User Management', 'Role Control', 'Coupon Access', 'Audit Viewing'].map(p => (
                      <div key={p} className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        <div className="w-1 h-1 bg-teal-500 rounded-full" />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>

                {grantRateLimit && (
                  <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                    {grantRateLimit.remaining === 0
                      ? `Rate limited. Reset in ${getCooldownSeconds(grantRateLimit)}s`
                      : `${grantRateLimit.remaining}/${grantRateLimit.limit} attempts remaining`}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-slate-800 bg-slate-950/50 flex gap-4">
                <button
                  onClick={closeGrantModal}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantClick}
                  disabled={!grantVerificationConfirmed || grantingRole === selectedUser.id || grantRateLimit?.remaining === 0}
                  className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-teal-500/20"
                >
                  {grantingRole === selectedUser.id ? 'Processing...' : 'Confirm Grant'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Revoke Admin Confirmation */}
      <AnimatePresence>
        {showRevokeConfirmModal && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeRevokeModal}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl relative z-10"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-800 bg-red-500/10">
                <h2 className="text-xl font-black text-red-500 uppercase tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                  </div>
                  Revoke Access
                </h2>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">You are about to remove administrative privileges from:</p>
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                    <p className="text-white font-bold text-lg">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-3">
                  <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    Revocation Reason
                  </label>
                  <textarea
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Why is this access being revoked?"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-red-500 transition-all text-sm resize-none"
                    rows="2"
                  />
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-tight leading-relaxed">
                    Warning: This user will lose all access to admin tools immediately. This action is logged.
                  </p>
                </div>

                {revokeRateLimit && (
                  <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                    {revokeRateLimit.remaining === 0
                      ? `Rate limited. Reset in ${getCooldownSeconds(revokeRateLimit)}s`
                      : `${revokeRateLimit.remaining}/${revokeRateLimit.limit} attempts remaining`}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-slate-800 bg-slate-950/50 flex gap-4">
                <button
                  onClick={closeRevokeModal}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeConfirm}
                  disabled={revokingRole === selectedUser.userId || revokeRateLimit?.remaining === 0}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20"
                >
                  {revokingRole === selectedUser.userId ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

