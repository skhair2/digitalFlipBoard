import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'
import mixpanel from '../../services/mixpanelService'
import { Tab } from '@headlessui/react'
import { clsx } from 'clsx'
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
} from '@heroicons/react/24/outline'

export default function SessionStats() {
  const { isAdmin } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [error, setError] = useState(null)
  
  // Advanced filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [showOnlyActive] = useState(false)
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

  // Calculate filtered sessions
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (filterStatus !== 'all' && session.status !== filterStatus) return false
    
    // Active only filter
    if (showOnlyActive && !session.is_active) return false
    
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
      active: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Active', icon: CheckCircleIcon },
      disconnected: { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Disconnected', icon: XMarkIcon },
      expired: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Expired', icon: ClockIcon },
      terminated: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Terminated', icon: StopCircleIcon },
    }
    const config = configs[status] || configs.disconnected
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3.5 h-3.5" />
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
      excellent: { bg: 'bg-green-500', label: 'Excellent' },
      good: { bg: 'bg-blue-500', label: 'Good' },
      fair: { bg: 'bg-yellow-500', label: 'Fair' },
      poor: { bg: 'bg-red-500', label: 'Poor' },
    }
    const c = config[health]

    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${c.bg}`} />
        <span className="text-xs font-medium text-gray-300">{c.label}</span>
      </div>
    )
  }

  const StatsGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total Sessions</p>
        <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
      </div>
      <div className="bg-gradient-to-br from-green-900/30 to-slate-900 border border-green-700/50 rounded-lg p-4">
        <p className="text-xs text-green-300 uppercase tracking-wide mb-2">Active</p>
        <p className="text-2xl font-bold text-green-300">{stats.activeSessions}</p>
      </div>
      <div className="bg-gradient-to-br from-blue-900/30 to-slate-900 border border-blue-700/50 rounded-lg p-4">
        <p className="text-xs text-blue-300 uppercase tracking-wide mb-2">Displays On</p>
        <p className="text-2xl font-bold text-blue-300">{stats.displayConnected}</p>
      </div>
      <div className="bg-gradient-to-br from-purple-900/30 to-slate-900 border border-purple-700/50 rounded-lg p-4">
        <p className="text-xs text-purple-300 uppercase tracking-wide mb-2">Controllers On</p>
        <p className="text-2xl font-bold text-purple-300">{stats.controllerConnected}</p>
      </div>
      <div className="bg-gradient-to-br from-amber-900/30 to-slate-900 border border-amber-700/50 rounded-lg p-4">
        <p className="text-xs text-amber-300 uppercase tracking-wide mb-2">Total Messages</p>
        <p className="text-2xl font-bold text-amber-300">{stats.totalMessages}</p>
      </div>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Avg Messages</p>
        <p className="text-2xl font-bold text-white">{stats.avgMessages}</p>
      </div>
    </div>
  )

  const SessionsGrid = () => (
    <div className="space-y-4">
      <StatsGrid />

      {/* Controls - Compact Version */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Row 1: Refresh & Auto-refresh */}
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors flex-shrink-0">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 accent-teal-500"
            />
            <span className="text-sm text-gray-300">Auto-refresh</span>
          </label>

          <button
            onClick={exportSessions}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-gray-300 rounded-lg font-medium transition-colors flex-shrink-0"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
              showFilters
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Row 2: Filters (Collapsible) */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search session code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="disconnected">Disconnected</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="messages">Most Messages</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-start gap-3 mb-6">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error loading sessions</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-400 mb-4">
        Showing {filteredSessions.length} of {sessions.length} sessions
      </div>

      {/* Sessions Table */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
          <p className="text-lg">No sessions found</p>
          <p className="text-sm mt-1">Try adjusting your filters or refreshing</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Session Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Health</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Messages</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-teal-300">{session.session_code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-4 py-3">
                    <HealthIndicator session={session} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{session.total_messages_sent || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {session.ended_at
                      ? `${Math.round((new Date(session.ended_at) - new Date(session.created_at)) / 1000 / 60)}m`
                      : Math.round((Date.now() - new Date(session.created_at).getTime()) / 1000 / 60) + 'm'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSession(session)
                        setSelectedTabIndex(1)
                      }}
                      className="text-teal-400 hover:text-teal-300 text-sm font-semibold"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const SessionDetails = () => {
    if (!selectedSession) {
      return (
        <div className="p-12 text-center text-gray-400 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
          <p className="text-lg">Select a session from the table to view details</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div>
              <h3 className="text-2xl font-bold font-mono text-teal-300 mb-2">
                {selectedSession.session_code}
              </h3>
              <p className="text-sm text-gray-400">
                Created {new Date(selectedSession.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={selectedSession.status} />
              <HealthIndicator session={selectedSession} />
              {selectedSession.status !== 'terminated' && (
                <button
                  onClick={() => setShowTerminateModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <StopCircleIcon className="w-4 h-4" />
                  Terminate
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Messages</p>
              <p className="text-2xl font-bold text-white">{selectedSession.total_messages_sent || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Duration</p>
              <p className="text-2xl font-bold text-white">
                {selectedSession.ended_at
                  ? `${Math.round((new Date(selectedSession.ended_at) - new Date(selectedSession.created_at)) / 1000 / 60)}m`
                  : Math.round((Date.now() - new Date(selectedSession.created_at).getTime()) / 1000 / 60) + 'm'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Activity</p>
              <p className="text-xs text-gray-300 font-mono">
                {selectedSession.last_activity_at ? new Date(selectedSession.last_activity_at).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Disconnect Reason</p>
              <p className="text-xs text-gray-300 capitalize">{selectedSession.disconnect_reason || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Terminate Modal */}
        {showTerminateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-white mb-4">Terminate Session?</h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to terminate session <span className="font-mono text-teal-300">{selectedSession.session_code}</span>? This action cannot be undone.
              </p>
              <textarea
                placeholder="Optional reason for termination..."
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 text-sm mb-4 focus:outline-none focus:border-teal-500 resize-none"
                rows="3"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTerminateModal(false)
                    setTerminateReason('')
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-gray-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => terminateSession(selectedSession.id, terminateReason)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Terminate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connection Timeline */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-teal-400" />
            Connection Timeline
          </h3>
          <div className="space-y-4">
            {/* Display Connection */}
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h4 className="font-semibold text-white">Display Device</h4>
                {selectedSession.display_connected_at && !selectedSession.display_disconnected_at && (
                  <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Connected</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Connected At</p>
                  <p className="text-gray-300 font-mono text-xs">
                    {selectedSession.display_connected_at
                      ? new Date(selectedSession.display_connected_at).toLocaleString()
                      : 'Not connected'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Disconnected At</p>
                  <p className="text-gray-300 font-mono text-xs">
                    {selectedSession.display_disconnected_at
                      ? new Date(selectedSession.display_disconnected_at).toLocaleString()
                      : 'Still connected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Controller Connection */}
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <h4 className="font-semibold text-white">Controller Device</h4>
                {selectedSession.controller_connected_at && !selectedSession.controller_disconnected_at && (
                  <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Connected</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Connected At</p>
                  <p className="text-gray-300 font-mono text-xs">
                    {selectedSession.controller_connected_at
                      ? new Date(selectedSession.controller_connected_at).toLocaleString()
                      : 'Not connected'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Disconnected At</p>
                  <p className="text-gray-300 font-mono text-xs">
                    {selectedSession.controller_disconnected_at
                      ? new Date(selectedSession.controller_disconnected_at).toLocaleString()
                      : 'Still connected'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <SignalIcon className="w-5 h-5 text-teal-400" />
            Connected Clients ({connections.length})
          </h3>

          {connections.length === 0 ? (
            <p className="text-gray-400">No client connections recorded for this session</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-white">
                        {connection.connection_type === 'display' ? '📺 Display' : '📱 Controller'}
                      </p>
                      {connection.email && <p className="text-xs text-gray-400">{connection.email}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${connection.disconnected_at ? 'bg-gray-500/20 text-gray-300' : 'bg-green-500/20 text-green-300'}`}>
                      {connection.disconnected_at ? 'Disconnected' : 'Connected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400">
                    <div>
                      <p className="text-gray-500 mb-1">IP Address</p>
                      <p className="text-gray-300 font-mono break-all">{connection.ip_address || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Duration</p>
                      <p className="text-gray-300">
                        {connection.duration_seconds
                          ? Math.round(connection.duration_seconds / 60) + ' min'
                          : 'Active'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Messages</p>
                      <p className="text-gray-300 font-semibold">{connection.message_count || 0}</p>
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <p className="text-gray-500 mb-1">Device Info</p>
                      <p className="text-gray-300 text-xs break-all">
                        {connection.device_info?.platform || 'Unknown'} • {connection.device_info?.browser || 'Unknown'} • {connection.device_info?.os || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const tabs = [
    { name: 'All Sessions', icon: ListBulletIcon, component: <SessionsGrid /> },
    { name: 'Session Details', icon: ChartBarIcon, component: <SessionDetails /> },
  ]

  if (!isAdmin) {
    return (
      <div className="p-8 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 flex items-center gap-3">
        <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" />
        <div>
          <p className="font-semibold">Access Denied</p>
          <p className="text-sm mt-1">You must be an admin to access session statistics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ChartBarIcon className="w-8 h-8 text-teal-400" />
          <h1 className="text-3xl font-bold text-white">Display Session Statistics</h1>
        </div>
        <p className="text-gray-400">
          Monitor active display connections, controller pairing, message throughput, and client health
        </p>
      </div>

      <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-slate-800/50 p-1 mb-8 border border-slate-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  clsx(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all whitespace-nowrap',
                    'ring-white/60 ring-offset-2 ring-offset-slate-900 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-teal-500 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </Tab>
            )
          })}
        </Tab.List>

        <Tab.Panels>
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx} className={clsx('focus:outline-none')}>
              {tab.component}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
