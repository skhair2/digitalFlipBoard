import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminStore } from '../../store/adminStore'
import { useAuthStore } from '../../store/authStore'
import * as adminService from '../../services/adminService'
import { emailService } from '../../services/emailService'
import Spinner from '../ui/Spinner'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
  UserPlusIcon,
  CreditCardIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
  ArrowUpRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

/**
 * User Management - High-fidelity redesign
 * Professional interface for managing users, subscriptions, and account status.
 */

export default function UserManagement() {
  const { users, totalUsers, setUsers, setTotalUsers } = useAdminStore()
  const { session } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [updatingUser, setUpdatingUser] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const result = await adminService.fetchAllUsers({ limit: 100 })
      setUsers(result.users)
      setTotalUsers(result.totalCount)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setUsers, setTotalUsers])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearchUsers = async () => {
    try {
      setLoading(true)
      const result = await adminService.fetchAllUsers({ 
        searchQuery: searchQuery.trim() || undefined,
        limit: 100 
      })
      setUsers(result.users || [])
      setTotalUsers(result.totalCount || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTier = async (userId, newTier) => {
    try {
      setUpdatingUser(userId)
      await adminService.updateUserSubscriptionTier(userId, newTier)
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u))
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, subscription_tier: newTier })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingUser(null)
    }
  }

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure? This will disable the user account.')) return
    
    try {
      setUpdatingUser(userId)
      await adminService.deactivateUser(userId)
      loadUsers()
      setSelectedUser(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingUser(null)
    }
  }

  const handleResendWelcomeEmail = async (user) => {
    try {
      setUpdatingUser(user.id)
      await emailService.sendWelcome(user.email, user.full_name || 'User')
      await adminService.updateUserWelcomeEmailFlag(user.id, true)
      
      setUsers(users.map(u => u.id === user.id ? { ...u, welcome_email_sent: true } : u))
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, welcome_email_sent: true })
      }
      alert('Welcome email sent successfully!')
    } catch (err) {
      setError('Failed to send welcome email: ' + err.message)
    } finally {
      setUpdatingUser(null)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filterTier !== 'all' && user.subscription_tier !== filterTier) return false
      return true
    })
  }, [users, filterTier])

  const TierBadge = ({ tier }) => {
    const configs = {
      free: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Free', icon: SparklesIcon },
      pro: { bg: 'bg-teal-500/10', text: 'text-teal-500', label: 'Pro', icon: RocketLaunchIcon },
      enterprise: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Enterprise', icon: BuildingOfficeIcon },
    }
    const config = configs[tier] || configs.free
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.text} border border-current/10`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const MethodBadge = ({ method }) => {
    const configs = {
      google_oauth: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Google', icon: GlobeAltIcon },
      magic_link: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Magic Link', icon: EnvelopeIcon },
      password: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Password', icon: ShieldCheckIcon },
    }
    const config = configs[method] || configs.password
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.text}`}>
        <Icon className="w-2.5 h-2.5" />
        {config.label}
      </span>
    )
  }

  if (loading && users.length === 0) return <Spinner />

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <UsersIcon className="w-6 h-6 text-teal-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">User Directory</h1>
              </div>
              <p className="text-slate-400 font-medium max-w-md">
                Manage platform users, subscription tiers, and account security.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadUsers}
                disabled={loading}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Users</span>
                <span className="text-lg font-black text-white">{totalUsers}</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 border border-slate-800/50 p-4 rounded-[2rem]">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="SEARCH BY NAME OR EMAIL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-teal-500/50 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-teal-500/10 border-teal-500/50 text-teal-500' : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="flex-1 md:w-48 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-teal-500/50 appearance-none cursor-pointer"
              >
                <option value="all">ALL SUBSCRIPTION TIERS</option>
                <option value="free">FREE TIER</option>
                <option value="pro">PRO TIER</option>
                <option value="enterprise">ENTERPRISE TIER</option>
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-3"
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          {/* Users Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/30">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">User Identity</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Subscription</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Auth Method</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Verification</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Joined</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedUser(user)}
                        className={`group cursor-pointer transition-all hover:bg-slate-800/30 ${selectedUser?.id === user.id ? 'bg-teal-500/5' : ''}`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-teal-500/20 group-hover:text-teal-500 transition-all">
                              {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-teal-400 transition-colors">{user.full_name || 'Anonymous User'}</span>
                              <span className="text-[10px] text-slate-500 font-medium font-mono">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <TierBadge tier={user.subscription_tier} />
                        </td>
                        <td className="px-6 py-5">
                          <MethodBadge method={user.signup_method} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {user.email_verified ? (
                              <CheckBadgeIcon className="w-4 h-4 text-teal-500" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            )}
                            <span className={`text-[10px] font-black uppercase tracking-widest ${user.email_verified ? 'text-teal-500' : 'text-amber-500'}`}>
                              {user.email_verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-medium text-slate-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="p-2 bg-slate-800/50 rounded-xl text-slate-500 group-hover:text-teal-400 group-hover:bg-teal-500/10 transition-all">
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto">
                  <UsersIcon className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No users found matching criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full md:w-[450px] bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl z-20"
          >
            {/* Sidebar Header */}
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">User Profile</p>
                <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-[280px]">
                  {selectedUser.full_name || 'Anonymous'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => handleResendWelcomeEmail(selectedUser)}
                  disabled={updatingUser === selectedUser.id}
                  className="w-full py-4 bg-teal-500/10 border border-teal-500/20 text-teal-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Resend Welcome Email
                </button>
                <button
                  onClick={() => handleDeactivateUser(selectedUser.id)}
                  disabled={updatingUser === selectedUser.id}
                  className="w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <NoSymbolIcon className="w-4 h-4" />
                  Deactivate Account
                </button>
              </div>

              {/* Subscription Management */}
              <div className="space-y-4">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Subscription Tier</h3>
                <div className="grid grid-cols-1 gap-2">
                  {['free', 'pro', 'enterprise'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => handleUpdateTier(selectedUser.id, tier)}
                      disabled={updatingUser === selectedUser.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        selectedUser.subscription_tier === tier
                          ? 'bg-teal-500/10 border-teal-500/50 text-teal-500'
                          : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{tier}</span>
                      </div>
                      {selectedUser.subscription_tier === tier && (
                        <CheckBadgeIcon className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Details Grid */}
              <div className="space-y-4">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Account Details</h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Email Address</p>
                      <p className="text-xs font-mono text-white truncate">{selectedUser.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">User ID</p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">{selectedUser.id.split('-')[0]}...</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Joined Date</p>
                      <div className="flex items-center gap-2 text-white">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Auth Method</p>
                      <MethodBadge method={selectedUser.signup_method} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedUser.email_verified ? 'bg-teal-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Status</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedUser.email_verified ? 'text-teal-500' : 'text-amber-500'}`}>
                      {selectedUser.email_verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Stats (Placeholder for future) */}
              <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-[2rem] flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-xl text-slate-500">
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Analytics</p>
                    <p className="text-[9px] text-slate-600 font-medium uppercase tracking-widest">Coming Soon</p>
                  </div>
                </div>
                <ArrowUpRightIcon className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
