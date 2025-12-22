import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as adminService from '../../services/adminService'
import Spinner from '../ui/Spinner'
import {
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  TrashIcon,
  FlagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

/**
 * Message Log (Content Moderation) - High-fidelity redesign
 * Professional interface for monitoring and moderating active board content.
 */

export default function MessageLog() {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBoard, setSelectedBoard] = useState(null)
  const [refreshCountdown, setRefreshCountdown] = useState(10)

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      const result = await adminService.fetchActiveBoardMessages()
      if (result.success) {
        setMessages(result.messages || [])
        setRefreshCountdown(10)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (!autoRefresh) return
    
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          loadMessages()
          return 10
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRefresh, loadMessages])

  const filteredBoards = useMemo(() => {
    return messages.filter(board => {
      const matchesSearch = !searchQuery || 
        board.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [messages, searchQuery])

  const handleModerate = async (boardId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this board?`)) return
    // Implementation for moderation actions would go here
    alert(`Action "${action}" triggered for board ${boardId}`)
  }

  if (loading && messages.length === 0) return <Spinner />

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
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-teal-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Content Moderation</h1>
              </div>
              <p className="text-slate-400 font-medium max-w-md">
                Monitor active board messages and enforce community guidelines.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auto Refresh</span>
                  <span className="text-[10px] font-mono text-teal-500">{autoRefresh ? `IN ${refreshCountdown}S` : 'OFF'}</span>
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-10 h-5 rounded-full transition-all relative ${autoRefresh ? 'bg-teal-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${autoRefresh ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <button
                onClick={loadMessages}
                disabled={loading}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 border border-slate-800/50 p-4 rounded-[2rem]">
            <div className="relative flex-1 w-full md:w-80">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="SEARCH BY BOARD NAME OR OWNER..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder-slate-600 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-teal-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Boards</span>
                <span className="text-lg font-black text-white">{messages.length}</span>
              </div>
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

          {/* Boards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBoards.map((board) => (
                <motion.div
                  key={board.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedBoard(board)}
                  className={`group cursor-pointer bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 transition-all hover:border-teal-500/30 hover:bg-slate-800/30 ${selectedBoard?.id === board.id ? 'border-teal-500/50 bg-teal-500/5' : ''}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white group-hover:text-teal-400 transition-colors truncate max-w-[200px]">
                        {board.name || 'Untitled Board'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-mono">{board.profiles?.email || 'Unknown Owner'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Last Activity</span>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <ClockIcon className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{new Date(board.updated_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Preview Placeholder */}
                  <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 mb-6 font-mono text-[11px] text-teal-500/70 line-clamp-3 min-h-[80px]">
                    {/* In a real app, we'd show the actual message content here */}
                    [SYSTEM] Monitoring active board stream...
                    <br />
                    [METADATA] Board ID: {board.id.split('-')[0]}...
                    <br />
                    [STATUS] Connection stable.
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleModerate(board.id, 'flag'); }}
                        className="p-2 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all"
                      >
                        <FlagIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleModerate(board.id, 'delete'); }}
                        className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-teal-500 transition-colors">
                      View Details
                      <ChevronRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredBoards.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No active boards found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedBoard && (
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
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Board Context</p>
                <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-[280px]">
                  {selectedBoard.name || 'Untitled'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBoard(null)}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Owner Info */}
              <div className="space-y-4">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Owner Details</h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-500 font-black">
                    {selectedBoard.profiles?.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white">{selectedBoard.profiles?.full_name || 'Anonymous'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{selectedBoard.profiles?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Board Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Created</p>
                  <p className="text-xs font-bold text-white">{new Date(selectedBoard.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Visibility</p>
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-3 h-3 text-teal-500" />
                    <p className="text-xs font-bold text-white uppercase">Public</p>
                  </div>
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="space-y-4">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Moderation Controls</h3>
                <div className="space-y-3">
                  <button className="w-full py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    <EyeSlashIcon className="w-4 h-4" />
                    Hide from Discovery
                  </button>
                  <button className="w-full py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    <FlagIcon className="w-4 h-4" />
                    Flag for Review
                  </button>
                  <button className="w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    <TrashIcon className="w-4 h-4" />
                    Delete Board
                  </button>
                </div>
              </div>

              {/* Security Context */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-teal-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Security Context</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 uppercase font-black">Board ID</span>
                    <span className="text-slate-300 font-mono">{selectedBoard.id.split('-')[0]}...</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 uppercase font-black">Owner ID</span>
                    <span className="text-slate-300 font-mono">{selectedBoard.user_id?.split('-')[0]}...</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
