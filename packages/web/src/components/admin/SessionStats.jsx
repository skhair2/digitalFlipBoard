import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'
import mixpanel from '../../services/mixpanelService'
import Spinner from '../ui/Spinner'
import {
  ArrowPathIcon,
  ListBulletIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  SignalIcon,
  BoltIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  StopCircleIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  TvIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

/**
 * SessionStats - High-fidelity redesign
 * Professional monitoring for display sessions and client health
 */

export default function SessionStats() {
  const { isAdmin } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [error, setError] = useState(null)
  
  // Advanced filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [terminateReason, setTerminateReason] = useState('')
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const refreshInterval = 5000

  // Fetch display sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('display_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError
      setSessions(data || [])
      mixpanel.track('Display Sessions Fetched', { count: data?.length || 0 })
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch connections for selected session
  const fetchConnections = useCallback(async (sessionId) => {
    if (!sessionId) return
    try {
      const { data, error: fetchError } = await supabase
        .from('display_connections')
        .select('*')
        .eq('session_id', sessionId)
        .order('connected_at', { ascending: false })

      if (fetchError) throw fetchError
      setConnections(data || [])
    } catch (err) {
      console.error('Failed to fetch connections:', err)
    }
  }, [])

  // Terminate session
  const terminateSession = useCallback(async (sessionId, reason = '') => {
    try {
      const { error: updateError } = await supabase
        .from('display_sessions')
        .update({ status: 'terminated', disconnect_reason: reason || 'Terminated by admin' })
        .eq('id', sessionId)

      if (updateError) throw updateError
      
      // Refresh data
      fetchSessions()
      setSelectedSession(null)
      setShowTerminateModal(false)
      setTerminateReason('')
      
      mixpanel.track('Session Terminated by Admin', { 
        sessionId, 
        reason 
      })
    } catch (err) {
      setError(err.message)
    }
  }, [fetchSessions])

  // Calculate filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Status filter
      if (filterStatus !== 'all' && session.status !== filterStatus) return false
      
      // Search query
      if (searchQuery && !session.session_code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Date range filter
      if (dateRange !== 'all') {
        const sessionDate = new Date(session.created_at)
        const now = new Date()
        const daysDiff = (now - sessionDate) / (1000 * 60 * 60 * 24)
        
        if (dateRange === 'today' && daysDiff > 1) return false
        if (dateRange === 'week' && daysDiff > 7) return false
        if (dateRange === 'month' && daysDiff > 30) return false
      }
      
      return true
    }).sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at) - new Date(a.created_at)
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at)
      } else if (sortBy === 'messages') {
        return (b.total_messages_sent || 0) - (a.total_messages_sent || 0)
      } else if (sortBy === 'duration') {
        const aDur = a.ended_at 
          ? new Date(a.ended_at) - new Date(a.created_at)
          : Date.now() - new Date(a.created_at).getTime()
        const bDur = b.ended_at 
          ? new Date(b.ended_at) - new Date(b.created_at)
          : Date.now() - new Date(b.created_at).getTime()
        return bDur - aDur
      }
      return 0
    })
  }, [sessions, filterStatus, searchQuery, dateRange, sortBy])

  // Export sessions as CSV
  const exportSessions = useCallback(() => {
    const headers = ['Session Code', 'Status', 'Created', 'Messages', 'Duration (min)', 'Display', 'Controller']
    const rows = filteredSessions.map(s => [
      s.session_code,
      s.status,
      new Date(s.created_at).toLocaleString(),
      s.total_messages_sent || 0,
      s.ended_at 
        ? Math.round((new Date(s.ended_at) - new Date(s.created_at)) / 1000 / 60)
        : Math.round((Date.now() - new Date(s.created_at).getTime()) / 1000 / 60),
      s.display_connected_at && !s.display_disconnected_at ? 'Connected' : 'Offline',
      s.controller_connected_at && !s.controller_disconnected_at ? 'Connected' : 'Offline',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    mixpanel.track('Sessions Exported', { count: filteredSessions.length })
  }, [filteredSessions])

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    fetchSessions()
    const interval = setInterval(fetchSessions, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchSessions])

  // Fetch connections when session is selected
  useEffect(() => {
    if (selectedSession) {
      fetchConnections(selectedSession.id)
    }
  }, [selectedSession, fetchConnections])

  // Stats calculation
  const totalMessages = sessions.reduce((sum, s) => sum + (s.total_messages_sent || 0), 0)
  const stats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.is_active).length,
    displayConnected: sessions.filter(s => s.display_connected_at && !s.display_disconnected_at).length,
    controllerConnected: sessions.filter(s => s.controller_connected_at && !s.controller_disconnected_at).length,
    totalMessages: totalMessages,
    avgMessages: sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0,
  }

  const StatusBadge = ({ status }) => {
    const configs = {
      active: { bg: 'bg-teal-500/10', text: 'text-teal-500', label: 'Active', icon: CheckCircleIcon },
      disconnected: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'Disconnected', icon: XMarkIcon },
      expired: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Expired', icon: ClockIcon },
      terminated: { bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'Terminated', icon: StopCircleIcon },
    }
    const config = configs[status] || configs.disconnected
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.text} border border-current/10`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const HealthIndicator = ({ session }) => {
    const displayConnected = session.display_connected_at && !session.display_disconnected_at
    const controllerConnected = session.controller_connected_at && !session.controller_disconnected_at
    const hasMessages = (session.total_messages_sent || 0) > 0
    
    let health = 'poor'
    if (displayConnected && controllerConnected && hasMessages) {
      health = 'excellent'
    } else if (displayConnected && controllerConnected) {
      health = 'good'
    } else if (displayConnected || controllerConnected) {
      health = 'fair'
    }

    const config = {
      excellent: { bg: 'bg-teal-500', label: 'Excellent' },
      good: { bg: 'bg-blue-500', label: 'Good' },
      fair: { bg: 'bg-amber-500', label: 'Fair' },
      poor: { bg: 'bg-rose-500', label: 'Poor' },
    }
    const c = config[health]

    return (
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${c.bg} shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-${c.bg.split('-')[1]}-500/50`} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheckIcon className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Access Restricted</h2>
          <p className="text-slate-400 text-sm">You do not have the required administrative privileges to view session analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <SignalIcon className="w-6 h-6 text-teal-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Session Monitor</h1>
              </div>
              <p className="text-slate-400 font-medium max-w-md">
                Real-time tracking of active display nodes and controller pairings.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
              <button
                onClick={exportSessions}
                className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active', value: stats.activeSessions, icon: BoltIcon, color: 'text-teal-400', bg: 'bg-teal-500/10' },
              { label: 'Displays', value: stats.displayConnected, icon: TvIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Controllers', value: stats.controllerConnected, icon: DevicePhoneMobileIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Messages', value: stats.totalMessages, icon: ChatBubbleLeftRightIcon, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4"
              >
                <div className={`p-2.5 ${stat.bg} rounded-xl`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.value.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 border border-slate-800/50 p-4 rounded-[2rem]">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="SEARCH SESSION CODE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-teal-500/50 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-teal-500/10 border-teal-500/50 text-teal-500' : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 md:w-40 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-teal-500/50 appearance-none cursor-pointer"
              >
                <option value="all">ALL STATUS</option>
                <option value="active">ACTIVE</option>
                <option value="disconnected">DISCONNECTED</option>
                <option value="expired">EXPIRED</option>
                <option value="terminated">TERMINATED</option>
              </select>
              
              <label className="flex items-center gap-3 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${autoRefresh ? 'bg-teal-500 border-teal-500' : 'border-slate-700 group-hover:border-slate-500'}`}>
                  {autoRefresh && <CheckCircleIcon className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-slate-300 transition-colors">Auto-refresh</span>
              </label>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/30">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Health</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Activity</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Duration</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence mode="popLayout">
                    {filteredSessions.map((session) => (
                      <motion.tr
                        key={session.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSession(session)}
                        className={`group cursor-pointer transition-all hover:bg-slate-800/30 ${selectedSession?.id === session.id ? 'bg-teal-500/5' : ''}`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white font-mono tracking-wider group-hover:text-teal-400 transition-colors">{session.session_code}</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-1">{new Date(session.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={session.status} />
                        </td>
                        <td className="px-6 py-5">
                          <HealthIndicator session={session} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-bold text-slate-300">{session.total_messages_sent || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-medium text-slate-400">
                            {session.ended_at
                              ? `${Math.round((new Date(session.ended_at) - new Date(session.created_at)) / 1000 / 60)}m`
                              : `${Math.round((Date.now() - new Date(session.created_at).getTime()) / 1000 / 60)}m`}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 bg-slate-800/50 rounded-xl text-slate-500 group-hover:text-teal-400 group-hover:bg-teal-500/10 transition-all">
                              <ChevronRightIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {filteredSessions.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto">
                  <MagnifyingGlassIcon className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No matching sessions found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedSession && (
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
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Session Details</p>
                <h2 className="text-2xl font-black text-white font-mono tracking-tight">{selectedSession.session_code}</h2>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Quick Actions */}
              <div className="flex gap-3">
                {selectedSession.status !== 'terminated' && (
                  <button
                    onClick={() => setShowTerminateModal(true)}
                    className="flex-1 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <StopCircleIcon className="w-4 h-4" />
                    Terminate Session
                  </button>
                )}
                <button className="flex-1 py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-4 h-4" />
                  Force Sync
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Messages</p>
                  <p className="text-2xl font-black text-white">{selectedSession.total_messages_sent || 0}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Duration</p>
                  <p className="text-2xl font-black text-white">
                    {selectedSession.ended_at
                      ? `${Math.round((new Date(selectedSession.ended_at) - new Date(selectedSession.created_at)) / 1000 / 60)}m`
                      : `${Math.round((Date.now() - new Date(selectedSession.created_at).getTime()) / 1000 / 60)}m`}
                  </p>
                </div>
              </div>

              {/* Connection Status */}
              <div className="space-y-4">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Node Status</h3>
                
                {/* Display Node */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedSession.display_connected_at && !selectedSession.display_disconnected_at ? 'bg-teal-500/10 text-teal-500' : 'bg-slate-800 text-slate-600'}`}>
                        <TvIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">Display Node</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${selectedSession.display_connected_at && !selectedSession.display_disconnected_at ? 'bg-teal-500 animate-pulse' : 'bg-slate-700'}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div className="space-y-1">
                      <p className="text-slate-500 font-black uppercase tracking-widest">Connected</p>
                      <p className="text-slate-300 font-mono">{selectedSession.display_connected_at ? new Date(selectedSession.display_connected_at).toLocaleTimeString() : '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 font-black uppercase tracking-widest">Disconnected</p>
                      <p className="text-slate-300 font-mono">{selectedSession.display_disconnected_at ? new Date(selectedSession.display_disconnected_at).toLocaleTimeString() : '---'}</p>
                    </div>
                  </div>
                </div>

                {/* Controller Node */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedSession.controller_connected_at && !selectedSession.controller_disconnected_at ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-800 text-slate-600'}`}>
                        <DevicePhoneMobileIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">Controller Node</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${selectedSession.controller_connected_at && !selectedSession.controller_disconnected_at ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div className="space-y-1">
                      <p className="text-slate-500 font-black uppercase tracking-widest">Connected</p>
                      <p className="text-slate-300 font-mono">{selectedSession.controller_connected_at ? new Date(selectedSession.controller_connected_at).toLocaleTimeString() : '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 font-black uppercase tracking-widest">Disconnected</p>
                      <p className="text-slate-300 font-mono">{selectedSession.controller_disconnected_at ? new Date(selectedSession.controller_disconnected_at).toLocaleTimeString() : '---'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client History */}
              <div className="space-y-4">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Client History ({connections.length})</h3>
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div key={conn.id} className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${conn.connection_type === 'display' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                          {conn.connection_type === 'display' ? <TvIcon className="w-4 h-4" /> : <DevicePhoneMobileIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{conn.connection_type}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{conn.ip_address || '0.0.0.0'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{conn.message_count || 0} MSG</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${conn.disconnected_at ? 'text-slate-600' : 'text-teal-500'}`}>
                          {conn.disconnected_at ? 'OFFLINE' : 'ONLINE'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <p className="text-center py-8 text-[10px] text-slate-600 font-black uppercase tracking-widest">No connection history</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminate Modal */}
      <AnimatePresence>
        {showTerminateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerminateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <StopCircleIcon className="w-8 h-8 text-rose-500" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Terminate Session?</h3>
                <p className="text-slate-400 text-sm">
                  This will immediately disconnect all clients from session <span className="font-mono text-teal-400 font-bold">{selectedSession?.session_code}</span>.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Reason for termination</p>
                <textarea
                  placeholder="E.G. SYSTEM MAINTENANCE, POLICY VIOLATION..."
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-700 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-rose-500/50 transition-all resize-none"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTerminateModal(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => terminateSession(selectedSession.id, terminateReason)}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-rose-500/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
