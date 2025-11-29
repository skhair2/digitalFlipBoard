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
} from '@heroicons/react/24/outline'

export default function SessionManagement() {
  const { isAdmin } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [selectedSessionCode, setSelectedSessionCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshInterval = 5000 // 5 seconds
  const [filterStatus, setFilterStatus] = useState('all') // all, active, idle, dead
  const [sortBy, setSortBy] = useState('clients') // clients, joined, activity
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [error, setError] = useState(null)

  // Fetch sessions from backend
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:3001/api/debug/sessions')
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
      const createdTime = new Date(session.createdAt).getTime()
      const now = Date.now()
      const ageMinutes = (now - createdTime) / 60000
      
      // Determine status
      let status = 'active'
      if (session.clientCount === 0) status = 'dead'
      else if (ageMinutes > 30) status = 'idle'

      return { ...session, status, ageMinutes }
    })
    .filter(session => {
      if (filterStatus === 'all') return true
      return session.status === filterStatus
    })
    .sort((a, b) => {
      if (sortBy === 'clients') return b.clientCount - a.clientCount
      if (sortBy === 'joined') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'activity') return a.ageMinutes - b.ageMinutes
      return 0
    })

  // Get session details
  const selectedSession = selectedSessionCode
    ? sessions.find(s => s.sessionCode === selectedSessionCode)
    : null

  // Stats
  const stats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.clientCount > 0).length,
    totalClients: sessions.reduce((sum, s) => sum + s.clientCount, 0),
    deadSessions: sessions.filter(s => s.clientCount === 0).length,
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

  const SessionGrid = () => (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total Sessions</p>
          <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 to-slate-900 border border-green-700/50 rounded-lg p-4">
          <p className="text-xs text-green-300 uppercase tracking-wide mb-2">Active</p>
          <p className="text-2xl font-bold text-green-300">{stats.activeSessions}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total Clients</p>
          <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
        </div>
        <div className="bg-gradient-to-br from-red-900/30 to-slate-900 border border-red-700/50 rounded-lg p-4">
          <p className="text-xs text-red-300 uppercase tracking-wide mb-2">Dead</p>
          <p className="text-2xl font-bold text-red-300">{stats.deadSessions}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap">
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 accent-teal-500"
          />
          <span className="text-sm text-gray-300">Auto-refresh every {refreshInterval / 1000}s</span>
        </label>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Sessions</option>
          <option value="active">Active Only</option>
          <option value="idle">Idle Only</option>
          <option value="dead">Dead Only</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="clients">Sort: Most Clients</option>
          <option value="joined">Sort: Recently Joined</option>
          <option value="activity">Sort: Least Active</option>
        </select>
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

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
          <p className="text-lg">No sessions found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredSessions.map((session) => (
            <div
              key={session.sessionCode}
              onClick={() => setSelectedSessionCode(session.sessionCode)}
              className={clsx(
                'p-4 rounded-lg border transition-all cursor-pointer group',
                selectedSessionCode === session.sessionCode
                  ? 'bg-teal-900/40 border-teal-500 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-mono font-bold text-teal-300 text-sm">
                      {session.sessionCode}
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                    <div>
                      <p className="text-xs text-gray-500">Clients</p>
                      <p className="font-semibold text-white">{session.clientCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-xs text-gray-300">
                        {new Date(session.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age</p>
                      <p className="text-xs text-gray-300">
                        {session.ageMinutes < 1
                          ? `${Math.round(session.ageMinutes * 60)}s`
                          : `${Math.round(session.ageMinutes)}m`}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-xs text-gray-300 capitalize">
                        {session.status === 'active' ? 'Connected' : session.status}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <EyeIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const SessionDetails = () => {
    if (!selectedSession) {
      return (
        <div className="p-12 text-center text-gray-400 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
          <p className="text-lg">Select a session to view details</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold font-mono text-teal-300 mb-2">
                {selectedSession.sessionCode}
              </h3>
              <p className="text-sm text-gray-400">
                Created {new Date(selectedSession.createdAt).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={selectedSession.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Connected Clients</p>
              <p className="text-2xl font-bold text-white">{selectedSession.clientCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Session Age</p>
              <p className="text-2xl font-bold text-white">
                {selectedSession.ageMinutes < 1
                  ? `${Math.round(selectedSession.ageMinutes * 60)}s`
                  : `${Math.round(selectedSession.ageMinutes)}m`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Auth Rate</p>
              <p className="text-2xl font-bold text-white">
                {selectedSession.clientCount > 0
                  ? `${Math.round(
                      (selectedSession.clients.filter(c => c.isAuthenticated).length /
                        selectedSession.clientCount) *
                        100
                    )}%`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Unique IPs</p>
              <p className="text-2xl font-bold text-white">
                {new Set(selectedSession.clients.map(c => c.clientIp)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
            Connected Clients ({selectedSession.clientCount})
          </h3>

          {selectedSession.clientCount === 0 ? (
            <p className="text-gray-400">No clients currently connected</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedSession.clients.map((client, idx) => (
                <div
                  key={`${client.socketId}-${idx}`}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm text-teal-300 font-bold">
                        Client #{idx + 1}
                      </p>
                      <p className="text-xs text-gray-400 font-mono break-all">
                        {client.socketId}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        client.isAuthenticated
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                      )}
                    >
                      {client.isAuthenticated ? 'Authenticated' : 'Anonymous'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-400">
                    {client.userEmail && (
                      <div>
                        <p className="text-gray-500">User</p>
                        <p className="text-gray-300 break-all">{client.userEmail}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">IP Address</p>
                      <p className="text-gray-300 font-mono">{client.clientIp}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Connected</p>
                      <p className="text-gray-300">
                        {new Date(client.joinedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">User-Agent</p>
                      <p className="text-gray-300 truncate">{client.userAgent?.substring(0, 60)}...</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            <strong>ℹ️ Info:</strong> This session monitor updates every 5 seconds. Anonymous users are
            users without authentication tokens.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { name: 'Sessions', component: <SessionGrid /> },
    { name: 'Details', component: <SessionDetails /> },
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
              key={tab.name}
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
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx} className="focus:outline-none">
              {tab.component}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
