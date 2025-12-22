import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import mixpanel from '../../services/mixpanelService'
import Spinner from '../ui/Spinner'
import {
  SignalIcon,
  UsersIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CommandLineIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

/**
 * SessionManagement - High-fidelity redesign
 * Real-time monitoring of active Socket.io rooms and client connections.
 */

export default function SessionManagement() {
  const { isAdmin } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [selectedSessionCode, setSelectedSessionCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshInterval = 5000
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('clients')
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshCountdown, setRefreshCountdown] = useState(5)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const API_URL = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${API_URL}/api/debug/sessions`)
      if (!response.ok) throw new Error('Failed to fetch sessions')
      const data = await response.json()
      setSessions(data.sessions || [])
      setRefreshCountdown(5)
      mixpanel.track('Sessions Fetched', { count: data.sessions?.length || 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    fetchSessions()
    const interval = setInterval(fetchSessions, refreshInterval)
    const countdown = setInterval(() => {
      setRefreshCountdown(prev => (prev > 0 ? prev - 1 : 5))
    }, 1000)
    return () => {
      clearInterval(interval)
      clearInterval(countdown)
    }
  }, [autoRefresh, fetchSessions])

  const processedSessions = useMemo(() => {
    return sessions
      .map(session => {
        const createdTime = session.createdAt ? new Date(session.createdAt).getTime() : Date.now()
        const ageMinutes = (Date.now() - createdTime) / 60000
        let status = 'active'
        if (session.clientCount === 0) status = 'dead'
        else if (ageMinutes > 30) status = 'idle'
        return { ...session, status, ageMinutes }
      })
      .filter(session => {
        if (searchQuery && !session.sessionCode.toLowerCase().includes(searchQuery.toLowerCase())) return false
        if (filterStatus === 'all') return true
        return session.status === filterStatus
      })
      .sort((a, b) => {
        if (sortBy === 'clients') return b.clientCount - a.clientCount
        if (sortBy === 'joined') return new Date(b.createdAt) - new Date(a.createdAt)
        if (sortBy === 'activity') return a.ageMinutes - b.ageMinutes
        return 0
      })
  }, [sessions, searchQuery, filterStatus, sortBy])

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => (s.clientCount ?? 0) > 0).length,
    clients: sessions.reduce((sum, s) => sum + (s.clientCount ?? 0), 0),
    dead: sessions.filter(s => (s.clientCount ?? 0) === 0).length
  }

  const selectedSession = selectedSessionCode
    ? sessions.find(s => s.sessionCode === selectedSessionCode)
    : null

  const exportSessions = () => {
    const headers = ['Session Code', 'Clients', 'Status', 'Age (min)', 'Created']
    const rows = processedSessions.map(s => [
      s.sessionCode,
      s.clientCount ?? 0,
      s.status,
      Math.round(s.ageMinutes),
      new Date(s.createdAt).toLocaleString()
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="flex h-full overflow-hidden bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="p-8 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <SignalIcon className="w-6 h-6 text-teal-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Session Monitor</h1>
              </div>
              <p className="text-slate-400 font-medium">Real-time Socket.io room telemetry and connection health.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Refreshing in {refreshCountdown}s
                </span>
              </div>
              <button
                onClick={fetchSessions}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
              <button
                onClick={exportSessions}
                className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white hover:border-slate-700 transition-all uppercase tracking-widest"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Rooms', value: stats.total, icon: GlobeAltIcon, color: 'text-slate-400', bg: 'bg-slate-400/10' },
              { label: 'Active Connections', value: stats.clients, icon: UsersIcon, color: 'text-teal-500', bg: 'bg-teal-500/10' },
              { label: 'Live Sessions', value: stats.active, icon: BoltIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Dead Rooms', value: stats.dead, icon: NoSymbolIcon, color: 'text-rose-500', bg: 'bg-rose-500/10' }
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search session codes..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'idle', 'dead'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterStatus === status
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {processedSessions.map((session) => (
              <motion.div
                key={session.sessionCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedSessionCode(session.sessionCode)}
                className={`group relative p-6 rounded-[2.5rem] border transition-all cursor-pointer ${
                  selectedSessionCode === session.sessionCode
                    ? 'bg-slate-900 border-teal-500/50 shadow-lg shadow-teal-500/5'
                    : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl transition-colors ${
                      session.status === 'active' ? 'bg-teal-500/20 text-teal-500' :
                      session.status === 'idle' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-rose-500/20 text-rose-500'
                    }`}>
                      <CpuChipIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{session.sessionCode}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          session.status === 'active' ? 'bg-teal-500/10 text-teal-500' :
                          session.status === 'idle' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <UsersIcon className="w-3.5 h-3.5" />
                          {session.clientCount || 0} Clients
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {Math.round(session.ageMinutes)}m Old
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon className={`w-5 h-5 transition-all ${selectedSessionCode === session.sessionCode ? 'text-teal-500 translate-x-1' : 'text-slate-700 group-hover:text-slate-500'}`} />
                </div>
              </motion.div>
            ))}

            {processedSessions.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                <div className="p-4 bg-slate-900 rounded-2xl w-fit mx-auto mb-4">
                  <SignalIcon className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-white font-black uppercase tracking-tight">No Sessions Found</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">The platform is currently quiet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedSession && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[450px] border-l border-slate-900 bg-slate-950/80 backdrop-blur-2xl p-8 overflow-y-auto custom-scrollbar z-20"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Session Telemetry</h2>
              <button
                onClick={() => setSelectedSessionCode(null)}
                className="p-2 hover:bg-slate-900 rounded-xl text-slate-500 hover:text-white transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Health Card */}
              <div className={`p-8 rounded-[2.5rem] border ${
                selectedSession.status === 'active' ? 'bg-teal-500/10 border-teal-500/20 text-teal-500' :
                selectedSession.status === 'idle' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                'bg-rose-500/10 border-rose-500/20 text-rose-500'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Health: {selectedSession.status === 'active' ? 'Optimal' : 'Degraded'}</span>
                </div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tight mb-2">{selectedSession.sessionCode}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Socket.io Room Identifier</p>
              </div>

              {/* Connection Details */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Connection Metrics</h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UsersIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connected Clients</span>
                    </div>
                    <span className="text-sm font-black text-white">{selectedSession.clientCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Age</span>
                    </div>
                    <span className="text-sm font-black text-white">{Math.round(selectedSession.ageMinutes)} Minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</span>
                    </div>
                    <span className="text-sm font-black text-white">{new Date(selectedSession.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Raw Data */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Raw Telemetry</h3>
                <div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6">
                  <div className="flex items-center gap-2 mb-4 text-slate-500">
                    <CommandLineIcon className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">JSON Payload</span>
                  </div>
                  <pre className="text-[10px] font-mono text-teal-500/80 overflow-x-auto custom-scrollbar">
                    {JSON.stringify(selectedSession, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-[2rem] flex items-start gap-4">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <InformationCircleIcon className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Dead sessions are automatically purged by the worker process every 24 hours to maintain database performance.
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
