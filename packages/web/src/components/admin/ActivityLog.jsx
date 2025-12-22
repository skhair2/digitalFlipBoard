import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminStore } from '../../store/adminStore'
import * as adminService from '../../services/adminService'
import Spinner from '../ui/Spinner'
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  CommandLineIcon,
  FingerPrintIcon,
  KeyIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  TrashIcon,
  PencilSquareIcon,
  NoSymbolIcon,
  StarIcon
} from '@heroicons/react/24/outline'

/**
 * Activity Log - High-fidelity redesign
 * Professional audit trail for system events and admin actions.
 */

export default function ActivityLog() {
  const { activityLog, setActivityLog } = useAdminStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const loadActivityLog = useCallback(async () => {
    try {
      setLoading(true)
      const result = await adminService.fetchAdminActivityLog({ limit: 100 })
      setActivityLog(result.logs || [])
    } catch (err) {
      console.error('Failed to load activity log:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setActivityLog])

  useEffect(() => {
    loadActivityLog()
  }, [loadActivityLog])

  const getActivityConfig = (type) => {
    const configs = {
      'user_created': { icon: UserIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'User Created' },
      'user_updated': { icon: PencilSquareIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'User Updated' },
      'user_deactivated': { icon: NoSymbolIcon, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'User Deactivated' },
      'user_deleted': { icon: TrashIcon, color: 'text-rose-600', bg: 'bg-rose-600/10', label: 'User Deleted' },
      'tier_changed': { icon: StarIcon, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Tier Changed' },
      'admin_login': { icon: KeyIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Admin Login' },
      'system_health': { icon: WrenchScrewdriverIcon, color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'System Health' },
      'alert': { icon: ExclamationTriangleIcon, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Security Alert' },
      'report_generated': { icon: ChartBarIcon, color: 'text-teal-500', bg: 'bg-teal-500/10', label: 'Report Generated' }
    }
    return configs[type] || { icon: ClipboardDocumentListIcon, color: 'text-slate-500', bg: 'bg-slate-500/10', label: type }
  }

  const filteredLog = useMemo(() => {
    return activityLog.filter(entry => {
      const matchesType = filterType === 'all' || entry.action_type === filterType
      const matchesSearch = !searchQuery || 
        entry.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.target_user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.action_type?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [activityLog, filterType, searchQuery])

  const activityTypes = useMemo(() => {
    return [...new Set(activityLog.map(entry => entry.action_type).filter(Boolean))]
  }, [activityLog])

  if (loading && activityLog.length === 0) return <Spinner />

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
                  <ClipboardDocumentListIcon className="w-6 h-6 text-teal-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Audit Trail</h1>
              </div>
              <p className="text-slate-400 font-medium max-w-md">
                Comprehensive log of administrative actions and system-wide security events.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadActivityLog}
                disabled={loading}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Events</span>
                <span className="text-lg font-black text-white">{activityLog.length}</span>
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
                  placeholder="SEARCH BY ADMIN OR TARGET..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 md:w-48 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-teal-500/50 appearance-none cursor-pointer"
              >
                <option value="all">ALL EVENT TYPES</option>
                {activityTypes.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
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

          {/* Activity Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/30">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Event Type</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Administrator</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Target / Context</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence mode="popLayout">
                    {filteredLog.map((entry) => {
                      const config = getActivityConfig(entry.action_type)
                      const Icon = config.icon
                      return (
                        <motion.tr
                          key={entry.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedEntry(entry)}
                          className={`group cursor-pointer transition-all hover:bg-slate-800/30 ${selectedEntry?.id === entry.id ? 'bg-teal-500/5' : ''}`}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                {config.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-teal-400 transition-colors">
                                {entry.admin_email?.split('@')[0] || 'System'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium font-mono">{entry.admin_email || 'automated_process'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">
                                {entry.target_user_email || entry.metadata?.description || 'N/A'}
                              </span>
                              {entry.ip_address && (
                                <span className="text-[9px] text-slate-600 font-mono">{entry.ip_address}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-slate-400">
                              <ClockIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">
                                {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="p-2 bg-slate-800/50 rounded-xl text-slate-500 group-hover:text-teal-400 group-hover:bg-teal-500/10 transition-all">
                              <ChevronRightIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {filteredLog.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto">
                  <ClipboardDocumentListIcon className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No activity records found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedEntry && (
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
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Event Details</p>
                <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-[280px]">
                  {getActivityConfig(selectedEntry.action_type).label}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Event Metadata */}
              <div className="space-y-4">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Contextual Data</h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Timestamp</p>
                      <div className="flex items-center gap-2 text-white">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold">{new Date(selectedEntry.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">IP Address</p>
                      <div className="flex items-center gap-2 text-white">
                        <FingerPrintIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-mono">{selectedEntry.ip_address || 'Internal'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">User Agent</p>
                    <p className="text-[10px] font-mono text-slate-400 break-all bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      {selectedEntry.user_agent || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw Metadata JSON */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Raw Payload</h3>
                  <CommandLineIcon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6 overflow-hidden">
                  <pre className="text-[10px] font-mono text-teal-500/80 overflow-x-auto">
                    {JSON.stringify(selectedEntry.metadata || {}, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                {selectedEntry.target_user_id && (
                  <button className="w-full py-4 bg-teal-500/10 border border-teal-500/20 text-teal-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    View Target User
                  </button>
                )}
                <button className="w-full py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all flex items-center justify-center gap-2">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Export Event Data
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
