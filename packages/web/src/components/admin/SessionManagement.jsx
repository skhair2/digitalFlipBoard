import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import mixpanel from '../../services/mixpanelService'
import { Tab } from '@headlessui/react'
import { clsx } from 'clsx'
import {
  ArrowPathIcon,
  XMarkIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

export default function SessionManagement() {
  const { isAdmin } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [selectedSessionCode, setSelectedSessionCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshInterval = 5000 // 5 seconds
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('clients')
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Fetch sessions from backend
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const API_URL = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${API_URL}/api/debug/sessions`)
      if (!response.ok) throw new Error('Failed to fetch sessions')
      const data = await response.json()
      setSessions(data.sessions || [])
      mixpanel.track('Sessions Fetched', { count: data.sessions?.length || 0 })
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    fetchSessions() // Initial fetch
    const interval = setInterval(fetchSessions, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchSessions])

  // Filter and sort sessions
  const filteredSessions = sessions
    .map(session => {
      const createdTime = session.createdAt ? new Date(session.createdAt).getTime() : Date.now()
      const now = Date.now()
      const ageMinutes = (now - createdTime) / 60000
      
      let status = 'active'
      if (session.clientCount === 0) status = 'dead'
      else if (ageMinutes > 30) status = 'idle'

      return { ...session, status, ageMinutes }
    })
    .filter(session => {
      // Apply search filter
      if (searchQuery && !session.sessionCode.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Apply status filter
      if (filterStatus === 'all') return true
      return session.status === filterStatus
    })
    .sort((a, b) => {
      if (sortBy === 'clients') return b.clientCount - a.clientCount
      if (sortBy === 'joined') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'activity') return a.ageMinutes - b.ageMinutes
      return 0
    })

  // Export sessions to CSV (moved after filteredSessions definition)
  const exportSessions = useCallback(() => {
    if (filteredSessions.length === 0) {
      alert('No sessions to export')
      return
    }

    const headers = ['Session Code', 'Clients', 'Status', 'Age (min)', 'Created', 'Health']
    const rows = filteredSessions.map(session => [
      session.sessionCode,
      session.clientCount ?? 0,
      session.status,
      Math.round(session.ageMinutes),
      new Date(session.createdAt).toLocaleString(),
      session.clientCount > 0 && session.ageMinutes < 30 ? 'Good' : session.clientCount > 0 ? 'Aging' : 'Poor'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sessions-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    mixpanel.track('Sessions Exported', { count: filteredSessions.length })
  }, [filteredSessions])

  // Get session details
  const selectedSession = selectedSessionCode
    ? sessions.find(s => s.sessionCode === selectedSessionCode)
    : null

  // Stats
  const stats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => (s.clientCount ?? 0) > 0).length,
    totalClients: sessions.reduce((sum, s) => sum + (s.clientCount ?? 0), 0),
    deadSessions: sessions.filter(s => (s.clientCount ?? 0) === 0).length,
    liveSessions: sessions.filter(s => {
      const createdTime = s.createdAt ? new Date(s.createdAt).getTime() : Date.now()
      const ageMinutes = (Date.now() - createdTime) / 60000
      return (s.clientCount ?? 0) > 0 && ageMinutes <= 30
    }).length,
  }

  const StatusBadge = ({ status }) => {
    const configs = {
      active: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Active', icon: CheckCircleIcon },
      idle: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Idle', icon: ClockIcon },
      dead: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Dead', icon: XMarkIcon },
    }
    const config = configs[status]
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    )
  }

  const SessionGrid = () => {
    const statCards = [
      { key: 'total', label: 'Total Sessions', value: stats.totalSessions, colors: 'from-slate-800 to-slate-900 border-slate-700', textColor: 'text-white', labelColor: 'text-gray-400', icon: '📊' },
      { key: 'live', label: 'Live Sessions', value: stats.liveSessions, colors: 'from-green-900/30 to-slate-900 border-green-700/50', textColor: 'text-green-300', labelColor: 'text-green-300', icon: '🔴' },
      { key: 'clients', label: 'Total Clients', value: stats.totalClients, colors: 'from-blue-900/30 to-slate-900 border-blue-700/50', textColor: 'text-blue-300', labelColor: 'text-blue-300', icon: '👥' },
      { key: 'dead', label: 'Dead Sessions', value: stats.deadSessions, colors: 'from-red-900/30 to-slate-900 border-red-700/50', textColor: 'text-red-300', labelColor: 'text-red-300', icon: '⚠️' },
    ]

    return (
      <div className="space-y-6">
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.key} className={`bg-gradient-to-br ${card.colors} rounded-lg p-5 border relative overflow-hidden group hover:shadow-lg hover:shadow-teal-500/20 transition-all`}>
              {/* Accent gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm ${card.labelColor} uppercase tracking-widest font-semibold opacity-75`}>{card.label}</p>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <p className={`text-4xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Controls Section */}
        <div className="space-y-4 bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by session code... (e.g., ABC123)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={exportSessions}
              disabled={filteredSessions.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 hover:border-teal-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <span className="text-sm text-gray-300">Auto-refresh</span>
            </label>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 transition-all"
            >
              <option value="all">All Sessions</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="dead">Dead</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500 transition-all"
            >
              <option value="clients">Sort: Clients</option>
              <option value="joined">Sort: Joined</option>
              <option value="activity">Sort: Activity</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error loading sessions</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No sessions found</p>
            <p className="text-sm mt-1">{searchQuery ? 'Try a different search term' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-sm text-gray-400">Found {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'grid' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'}`}
                >
                  List
                </button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session) => {
                  const clientCount = session.clientCount ?? 0
                  const isLive = clientCount > 0
                  return (
                    <div
                      key={session.sessionCode || `session-${Math.random()}`}
                      onClick={() => {
                        setSelectedSessionCode(session.sessionCode)
                        setShowDetailModal(true)
                      }}
                      className={clsx(
                        'rounded-lg border-2 transition-all cursor-pointer group relative overflow-hidden',
                        'bg-gradient-to-br from-slate-800/80 to-slate-900/80',
                        isLive
                          ? 'border-teal-500/40 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/30'
                          : 'border-slate-700 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-500/20'
                      )}
                    >
                      {/* Accent bar */}
                      <div className={clsx(
                        'absolute top-0 left-0 right-0 h-1',
                        isLive ? 'bg-gradient-to-r from-green-500 to-teal-500' : 'bg-gradient-to-r from-slate-600 to-slate-500'
                      )} />

                      {/* Card Content */}
                      <div className="p-5 pt-4">
                        {/* Header with Session Code */}
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono font-bold text-teal-300 text-xl leading-tight break-all">
                                {session.sessionCode || 'No Code'}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Created {session.createdAt ? new Date(session.createdAt).toLocaleTimeString() : 'Unknown'}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <EyeIcon className="w-5 h-5 text-gray-500 group-hover:text-teal-400 transition-colors" />
                            </div>
                          </div>
                          <StatusBadge status={session.status} />
                        </div>

                        {/* Live Indicator */}
                        {isLive && (
                          <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-sm text-green-300 font-semibold">Live Session</span>
                          </div>
                        )}

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Clients</p>
                            <p className="text-2xl font-bold text-white">{clientCount}</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age</p>
                            <p className="text-2xl font-bold text-white">
                              {isNaN(session.ageMinutes)
                                ? '—'
                                : session.ageMinutes < 1
                                ? `${Math.round(session.ageMinutes * 60)}s`
                                : `${Math.round(session.ageMinutes)}m`}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Health</p>
                            <p className={`text-sm font-bold ${isLive && session.ageMinutes < 30 ? 'text-green-400' : isLive ? 'text-yellow-400' : 'text-red-400'}`}>
                              {isLive && session.ageMinutes < 30 ? '✓ Good' : isLive ? '⚠ Aging' : '✕ Poor'}
                            </p>
                          </div>
                        </div>

                        {/* Status Summary */}
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Status</p>
                          <p className="text-sm text-gray-300">
                            {isLive ? (
                              <span className="text-green-300">🟢 {clientCount} connected client{clientCount !== 1 ? 's' : ''}</span>
                            ) : (
                              <span className="text-red-300">🔴 No active connections</span>
                            )}
                          </p>
                        </div>

                        {/* Click Hint */}
                        <div className="mt-3 pt-3 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-teal-400 font-medium">Click to view details →</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
                {filteredSessions.map((session) => (
                  <div
                    key={session.sessionCode}
                    onClick={() => {
                      setSelectedSessionCode(session.sessionCode)
                      setShowDetailModal(true)
                    }}
                    className={clsx(
                      'p-4 rounded-lg border transition-all cursor-pointer group',
                      session.clientCount > 0
                        ? 'bg-teal-900/20 border-teal-700/50 hover:border-teal-500 hover:bg-teal-900/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Session Code & Status */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="font-mono font-bold text-teal-300 text-lg">
                            {session.sessionCode || 'No Code'}
                          </div>
                          <StatusBadge status={session.status} />
                          {(session.clientCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                              <SignalIcon className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-300 font-medium">Live</span>
                            </div>
                          )}
                        </div>

                        {/* Session Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Clients</p>
                            <p className="text-lg font-semibold text-white">{session.clientCount ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</p>
                            <p className="text-sm text-gray-300">
                              {session.createdAt ? new Date(session.createdAt).toLocaleTimeString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age</p>
                            <p className="text-sm text-gray-300">
                              {isNaN(session.ageMinutes)
                                ? '—'
                                : session.ageMinutes < 1
                                ? `${Math.round(session.ageMinutes * 60)}s`
                                : `${Math.round(session.ageMinutes)}m`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                            <p className="text-sm text-gray-300 capitalize">
                              {session.status === 'active' ? 'Connected' : session.status}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* View Details Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <EyeIcon className="w-5 h-5 text-gray-500 group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const SessionDetails = () => {
    if (!selectedSession) {
      return (
        <div className="p-12 text-center text-gray-400 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
          <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a session to view details</p>
          <p className="text-sm mt-1">Click on any session to see detailed logs and client info</p>
        </div>
      )
    }

    const clientCount = selectedSession.clientCount ?? 0
    const isLive = clientCount > 0
    const createdDate = new Date(selectedSession.createdAt)
    const sessionAge = selectedSession.ageMinutes

    return (
      <div className="space-y-6">
        {/* Session Header Card */}
        <div className="bg-gradient-to-r from-teal-900/30 to-slate-900 border border-teal-700/50 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-3xl font-bold font-mono text-teal-300">
                  {selectedSession.sessionCode}
                </h3>
                <StatusBadge status={selectedSession.status} />
                {isLive && (
                  <div className="animate-pulse flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-green-300 font-semibold">Live</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Created {createdDate.toLocaleString()} • Age: {isNaN(sessionAge) ? '—' : sessionAge < 1 ? `${Math.round(sessionAge * 60)}s` : `${Math.round(sessionAge)}m`}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Clients</p>
              <p className="text-2xl font-bold text-white">{clientCount}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <p className={`text-sm font-semibold ${isLive ? 'text-green-400' : 'text-red-400'}`}>
                {isLive ? 'Connected' : 'Offline'}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
              <p className="text-sm font-semibold text-blue-300">Session</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Health</p>
              <p className={`text-sm font-semibold ${isLive && sessionAge < 30 ? 'text-green-400' : isLive ? 'text-yellow-400' : 'text-red-400'}`}>
                {isLive && sessionAge < 30 ? 'Good' : isLive ? 'Aging' : 'Poor'}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Uptime</p>
              <p className="text-sm font-semibold text-gray-300">{isNaN(sessionAge) ? '—' : sessionAge < 1 ? `${Math.round(sessionAge * 60)}s` : `${Math.round(sessionAge)}m`}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mode</p>
              <p className="text-sm font-semibold text-purple-300">Real-time</p>
            </div>
          </div>
        </div>

        {/* Connection Status & Activity Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Client Connections */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <SignalIcon className="w-5 h-5 text-teal-400" />
              Connected Clients ({clientCount})
            </h4>

            {clientCount === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No clients currently connected</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedSession.clients && selectedSession.clients.map((client, idx) => (
                  <div key={client.socketId || idx} className="bg-slate-900/50 border border-slate-700 rounded p-3 hover:border-teal-500/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-mono text-sm text-teal-300 font-semibold break-all">{client.socketId}</div>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded-full flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span className="text-xs text-green-300 font-medium">Active</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="text-gray-300 truncate">{client.userEmail || 'Anonymous'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">IP Address</p>
                        <p className="text-gray-300 font-mono">{client.clientIp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Session Activity Log */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-teal-400" />
              Activity Log
            </h4>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {/* Session Created */}
              <div className="flex gap-3 py-2 border-b border-slate-700/50 last:border-b-0">
                <div className="flex-shrink-0 w-2 h-2 bg-teal-400 rounded-full mt-2" />
                <div className="flex-1 text-sm">
                  <p className="text-gray-300 font-medium">Session Created</p>
                  <p className="text-gray-500 text-xs">{createdDate.toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Client Connection Status */}
              <div className="flex gap-3 py-2 border-b border-slate-700/50 last:border-b-0">
                <div className={`flex-shrink-0 w-2 h-2 ${isLive ? 'bg-green-400' : 'bg-red-400'} rounded-full mt-2`} />
                <div className="flex-1 text-sm">
                  <p className="text-gray-300 font-medium">{isLive ? `${clientCount} Client${clientCount !== 1 ? 's' : ''} Connected` : 'All Clients Disconnected'}</p>
                  <p className="text-gray-500 text-xs">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Display Connection Status */}
              <div className="flex gap-3 py-2 border-b border-slate-700/50 last:border-b-0">
                <div className={`flex-shrink-0 w-2 h-2 ${isLive ? 'bg-green-400' : 'bg-gray-600'} rounded-full mt-2`} />
                <div className="flex-1 text-sm">
                  <p className="text-gray-300 font-medium">Display Connected</p>
                  <p className="text-gray-500 text-xs">{isLive ? 'Now' : 'Offline'}</p>
                </div>
              </div>

              {/* Controller Connection Status */}
              <div className="flex gap-3 py-2 border-b border-slate-700/50 last:border-b-0">
                <div className={`flex-shrink-0 w-2 h-2 ${isLive ? 'bg-green-400' : 'bg-gray-600'} rounded-full mt-2`} />
                <div className="flex-1 text-sm">
                  <p className="text-gray-300 font-medium">Controller Connected</p>
                  <p className="text-gray-500 text-xs">{isLive ? 'Now' : 'Offline'}</p>
                </div>
              </div>

              {/* Session Health */}
              <div className="flex gap-3 py-2 border-b border-slate-700/50 last:border-b-0">
                <div className={`flex-shrink-0 w-2 h-2 ${isLive && sessionAge < 30 ? 'bg-green-400' : isLive ? 'bg-yellow-400' : 'bg-red-400'} rounded-full mt-2`} />
                <div className="flex-1 text-sm">
                  <p className="text-gray-300 font-medium">
                    Session Status: <span className={isLive && sessionAge < 30 ? 'text-green-400' : isLive ? 'text-yellow-400' : 'text-red-400'}>
                      {isLive && sessionAge < 30 ? 'Healthy' : isLive ? 'Aging' : 'Inactive'}
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs">{sessionAge < 1 ? `${Math.round(sessionAge * 60)}s old` : `${Math.round(sessionAge)}m old`}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-gray-500">
            <strong>Session ID:</strong> <code className="text-gray-400">{selectedSession.sessionCode}</code> | <strong>Status:</strong> <span className={isLive ? 'text-green-400' : 'text-red-400'}>{isLive ? 'ACTIVE' : 'INACTIVE'}</span>
          </p>
        </div>
      </div>
    )
  }

  // Premium Modal Component for Drill-Down View
  const SessionDetailModal = () => {
    if (!showDetailModal || !selectedSession) return null

    const clientCount = selectedSession.clientCount ?? 0
    const isLive = clientCount > 0
    const createdDate = new Date(selectedSession.createdAt)
    const sessionAge = selectedSession.ageMinutes

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          onClick={() => setShowDetailModal(false)}
        />

        {/* Modal */}
        <div className="relative bg-slate-900 rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-teal-900/30 to-slate-900 border-b border-slate-700 px-6 py-4 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold font-mono text-teal-300 mb-2">
                {selectedSession.sessionCode}
              </h2>
              <p className="text-sm text-gray-400">
                Created {createdDate.toLocaleString()} • Age: {isNaN(sessionAge) ? '—' : sessionAge < 1 ? `${Math.round(sessionAge * 60)}s` : `${Math.round(sessionAge)}m`}
              </p>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="flex-shrink-0 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={selectedSession.status} />
              {isLive && (
                <div className="animate-pulse flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-green-300 font-semibold">Live</span>
                </div>
              )}
              <div className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-semibold border',
                isLive && sessionAge < 30
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : isLive
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
              )}>
                {isLive && sessionAge < 30 ? 'Good Health' : isLive ? 'Aging' : 'Inactive'}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Clients</p>
                <p className="text-3xl font-bold text-white">{clientCount}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Status</p>
                <p className={`text-sm font-semibold ${isLive ? 'text-green-400' : 'text-red-400'}`}>
                  {isLive ? 'Connected' : 'Offline'}
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Type</p>
                <p className="text-sm font-semibold text-blue-300">Session</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Health</p>
                <p className={`text-sm font-semibold ${isLive && sessionAge < 30 ? 'text-green-400' : isLive ? 'text-yellow-400' : 'text-red-400'}`}>
                  {isLive && sessionAge < 30 ? 'Good' : isLive ? 'Aging' : 'Poor'}
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Uptime</p>
                <p className="text-sm font-semibold text-gray-300">{isNaN(sessionAge) ? '—' : sessionAge < 1 ? `${Math.round(sessionAge * 60)}s` : `${Math.round(sessionAge)}m`}</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Mode</p>
                <p className="text-sm font-semibold text-purple-300">Real-time</p>
              </div>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clients */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <SignalIcon className="w-5 h-5 text-teal-400" />
                  Connected Clients ({clientCount})
                </h4>

                {clientCount === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">No clients currently connected</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedSession.clients && selectedSession.clients.map((client, idx) => (
                      <div key={client.socketId || idx} className="bg-slate-900/50 border border-slate-700 rounded p-4 hover:border-teal-500/50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="font-mono text-sm text-teal-300 font-semibold break-all">{client.socketId}</div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            <span className="text-xs text-green-300 font-medium">Active</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="text-gray-300 truncate">{client.userEmail || 'Anonymous'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">IP Address</p>
                            <p className="text-gray-300 font-mono">{client.clientIp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-teal-400" />
                  Activity Log
                </h4>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* Session Created */}
                  <div className="flex gap-3 py-3 border-b border-slate-700/50 last:border-b-0">
                    <div className="flex-shrink-0 w-2 h-2 bg-teal-400 rounded-full mt-1.5" />
                    <div className="flex-1 text-sm">
                      <p className="text-gray-300 font-medium">Session Created</p>
                      <p className="text-gray-500 text-xs">{createdDate.toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {/* Client Connection Status */}
                  <div className="flex gap-3 py-3 border-b border-slate-700/50 last:border-b-0">
                    <div className={`flex-shrink-0 w-2 h-2 ${isLive ? 'bg-green-400' : 'bg-red-400'} rounded-full mt-1.5`} />
                    <div className="flex-1 text-sm">
                      <p className="text-gray-300 font-medium">{isLive ? `${clientCount} Client${clientCount !== 1 ? 's' : ''} Connected` : 'All Clients Disconnected'}</p>
                      <p className="text-gray-500 text-xs">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {/* Display Connection Status */}
                  <div className="flex gap-3 py-3 border-b border-slate-700/50 last:border-b-0">
                    <div className={`flex-shrink-0 w-2 h-2 ${isLive ? 'bg-green-400' : 'bg-gray-600'} rounded-full mt-1.5`} />
                    <div className="flex-1 text-sm">
                      <p className="text-gray-300 font-medium">Display Connected</p>
                      <p className="text-gray-500 text-xs">{isLive ? 'Now' : 'Offline'}</p>
                    </div>
                  </div>

                  {/* Controller Connection Status */}
                  <div className="flex gap-3 py-3 border-b border-slate-700/50 last:border-b-0">
                    <div className={`flex-shrink-0 w-2 h-2 ${isLive ? 'bg-green-400' : 'bg-gray-600'} rounded-full mt-1.5`} />
                    <div className="flex-1 text-sm">
                      <p className="text-gray-300 font-medium">Controller Connected</p>
                      <p className="text-gray-500 text-xs">{isLive ? 'Now' : 'Offline'}</p>
                    </div>
                  </div>

                  {/* Session Health */}
                  <div className="flex gap-3 py-3 border-b border-slate-700/50 last:border-b-0">
                    <div className={`flex-shrink-0 w-2 h-2 ${isLive && sessionAge < 30 ? 'bg-green-400' : isLive ? 'bg-yellow-400' : 'bg-red-400'} rounded-full mt-1.5`} />
                    <div className="flex-1 text-sm">
                      <p className="text-gray-300 font-medium">
                        Session Status: <span className={isLive && sessionAge < 30 ? 'text-green-400' : isLive ? 'text-yellow-400' : 'text-red-400'}>
                          {isLive && sessionAge < 30 ? 'Healthy' : isLive ? 'Aging' : 'Inactive'}
                        </span>
                      </p>
                      <p className="text-gray-500 text-xs">{sessionAge < 1 ? `${Math.round(sessionAge * 60)}s old` : `${Math.round(sessionAge)}m old`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500">
                <strong>Session ID:</strong> <code className="text-gray-400 font-mono">{selectedSession.sessionCode}</code> | <strong>Status:</strong> <span className={isLive ? 'text-green-400' : 'text-red-400'}>{isLive ? 'ACTIVE' : 'INACTIVE'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'sessions', name: 'Sessions' },
    { id: 'details', name: 'Details' },
  ]

  if (!isAdmin) {
    return (
      <div className="p-8 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200">
        <p className="font-semibold">Access Denied</p>
        <p className="text-sm mt-1">You must be an admin to access session management.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Session Management</h1>
        <p className="text-gray-400">
          Monitor active sessions, connected clients, and real-time connection data
        </p>
      </div>

      <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-slate-800/50 p-1 mb-8 border border-slate-700">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                clsx(
                  'px-4 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all',
                  'ring-white/60 ring-offset-2 ring-offset-slate-900 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {tabs.map((tab, tabIdx) => (
            <Tab.Panel key={tab.id} className="focus:outline-none">
              {tabIdx === 0 ? <SessionGrid /> : <SessionDetails />}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>

      {/* Detail Modal */}
      <SessionDetailModal />
    </div>
  )
}
