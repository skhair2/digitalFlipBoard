import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '../../store/sessionStore'
import { useAuthStore } from '../../store/authStore'
import { useUsageStore } from '../../store/usageStore'
import { Button, Input, Card } from '../ui/Components'
import { 
    ClockIcon, 
    ExclamationTriangleIcon, 
    DeviceTabletIcon,
    ArrowPathIcon,
    PlusIcon,
    ArrowLeftIcon,
    CheckIcon,
    SignalIcon,
    CpuChipIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'
import mixpanelService from '../../services/mixpanelService'
import { pairSession } from '../../services/sessionService'
import { getUserBoards } from '../../services/boardService'
import clsx from 'clsx'

const CONNECTION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export default function SessionPairing({ suggestedCode }) {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [showReconnect, setShowReconnect] = useState(false)
    const [remainingTime, setRemainingTime] = useState(null)
    const [isWarning, setIsWarning] = useState(false)
    const [showCodeForm, setShowCodeForm] = useState(false)
    const [showQuickReconnect, setShowQuickReconnect] = useState(false)
    const [boards, setBoards] = useState([])
    const [selectedBoardId, setSelectedBoardId] = useState(null)
    const [isLoadingBoards, setIsLoadingBoards] = useState(false)
    const [isPairing, setIsPairing] = useState(false)
    const navigate = useNavigate()
    
    const { 
        setSessionCode, 
        lastSessionCode, 
        isConnected, 
        connectionStartTime,
        lastActivityTime,
        isConnectionExpired,
        disconnectReason,
        recordActivity,
        setConnectionExpired,
        sessionCode,
    } = useSessionStore()
    const { user } = useAuthStore()
    const { freeSessionUsed, incrementSession } = useUsageStore()

    useEffect(() => {
        if (suggestedCode && !code) {
            setCode(suggestedCode.toUpperCase())
        }
    }, [suggestedCode, code])

    useEffect(() => {
        const fetchBoards = async () => {
            if (user?.id) {
                setIsLoadingBoards(true)
                try {
                    const userBoards = await getUserBoards(user.id)
                    setBoards(userBoards)
                    if (userBoards.length > 0) {
                        setSelectedBoardId(userBoards[0].id)
                    }
                } catch (err) {
                    console.error('Failed to fetch boards:', err)
                } finally {
                    setIsLoadingBoards(false)
                }
            }
        }
        fetchBoards()
    }, [user])

    useEffect(() => {
        if (lastSessionCode && !showCodeForm) {
            const lastSessionTime = localStorage.getItem('lastSessionTime')
            if (lastSessionTime) {
                const timeSinceLastSession = Date.now() - parseInt(lastSessionTime)
                const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
                
                if (timeSinceLastSession < TWENTY_FOUR_HOURS) {
                    setShowQuickReconnect(true)
                } else {
                    setShowCodeForm(true)
                    setShowQuickReconnect(false)
                }
            } else {
                setShowQuickReconnect(true)
            }
            setShowReconnect(false)
        }
    }, [lastSessionCode, showCodeForm])

    useEffect(() => {
        if (!isConnected || !connectionStartTime) return

        const checkTimeout = () => {
            const now = Date.now()
            const totalElapsed = now - connectionStartTime
            const inactiveElapsed = now - (lastActivityTime || connectionStartTime)
            const remaining = CONNECTION_TIMEOUT_MS - totalElapsed
            const inactivityExpired = inactiveElapsed >= INACTIVITY_TIMEOUT_MS

            if (inactivityExpired) {
                setConnectionExpired(true, 'inactivity')
                setShowReconnect(true)
                setRemainingTime(null)
            } else if (remaining <= 0) {
                setConnectionExpired(true, 'timeout')
                setShowReconnect(true)
                setRemainingTime(null)
            } else {
                const secondsRemaining = Math.ceil(remaining / 1000)
                setRemainingTime(secondsRemaining)
                if (secondsRemaining <= 120 && !isWarning) {
                    setIsWarning(true)
                }
            }
        }

        checkTimeout()
        const interval = setInterval(checkTimeout, 1000)
        return () => clearInterval(interval)
    }, [isConnected, connectionStartTime, lastActivityTime, isWarning, setConnectionExpired])

    const handlePair = async (e) => {
        e.preventDefault()
        const trimmedCode = code.trim().toUpperCase()

        if (!trimmedCode || trimmedCode.length !== 6) {
            setError('Please enter a valid 6-character code')
            return
        }

        setIsPairing(true)
        setError('')

        try {
            await pairSession(trimmedCode, user?.id, selectedBoardId)
            
            if (!user) {
                incrementSession()
            }

            setSessionCode(trimmedCode, { 
                isReconnecting: false, 
                markControllerPaired: true,
                boardId: selectedBoardId 
            })
            
            sessionStorage.setItem(`controller_active_${trimmedCode}`, 'true')
            localStorage.setItem('lastSessionTime', Date.now().toString())
            setShowReconnect(false)
            setShowQuickReconnect(false)
            setIsWarning(false)

            mixpanelService.track('connection_started', { 
                code: trimmedCode.substring(0, 2) + '****',
                is_authenticated: !!user
            })
        } catch (err) {
            setError(err.message || 'Unable to verify display code')
        } finally {
            setIsPairing(false)
        }
    }

    const handleContinueSession = async () => {
        if (!lastSessionCode) return
        setIsPairing(true)
        
        try {
            await pairSession(lastSessionCode, user?.id)
            setSessionCode(lastSessionCode, { isReconnecting: true, markControllerPaired: true })
            sessionStorage.setItem(`controller_active_${lastSessionCode}`, 'true')
            localStorage.setItem('lastSessionTime', Date.now().toString())
            setShowReconnect(false)
            setShowQuickReconnect(false)
            setError('')
            setIsWarning(false)
            recordActivity()
        } catch (err) {
            setError('Previous session expired. Please enter a new code.')
            setShowCodeForm(true)
        } finally {
            setIsPairing(false)
        }
    }

    const handleEnterNewCode = () => {
        setCode('')
        setShowCodeForm(true)
        setError('')
        setIsWarning(false)
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    }

    // --- CONNECTED STATE ---
    if (isConnected && !isConnectionExpired) {
        const minutes = Math.floor((remainingTime || 0) / 60)
        const seconds = (remainingTime || 0) % 60
        const activeCode = sessionCode || lastSessionCode || code

        return (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-md mx-auto"
            >
                <Card className={clsx(
                    "relative overflow-hidden border-2 transition-colors duration-500",
                    isWarning ? "border-amber-500/50 bg-amber-900/10" : "border-teal-500/50 bg-teal-900/10"
                )}>
                    {/* Background Glow */}
                    <div className={clsx(
                        "absolute -top-24 -right-24 w-48 h-48 blur-[100px] rounded-full opacity-20",
                        isWarning ? "bg-amber-500" : "bg-teal-500"
                    )} />

                    <div className="relative z-10 text-center py-8 px-4">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12 }}
                            className={clsx(
                                "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl",
                                isWarning ? "bg-amber-500" : "bg-teal-500"
                            )}
                        >
                            {isWarning ? (
                                <ExclamationTriangleIcon className="w-10 h-10 text-white" />
                            ) : (
                                <CheckIcon className="w-10 h-10 text-white" />
                            )}
                        </motion.div>

                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                            {isWarning ? 'SESSION EXPIRING' : 'SYSTEM PAIRED'}
                        </h2>
                        <p className={clsx(
                            "text-sm font-medium mb-8",
                            isWarning ? "text-amber-300" : "text-teal-300"
                        )}>
                            {isWarning 
                                ? 'Your connection will terminate shortly.' 
                                : 'Controller linked to display successfully.'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-left">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Code</p>
                                <p className="text-xl font-mono font-bold text-white tracking-widest">{activeCode}</p>
                            </div>
                            <div className={clsx(
                                "border rounded-xl p-4 text-left transition-colors",
                                isWarning ? "bg-amber-500/10 border-amber-500/30" : "bg-teal-500/10 border-teal-500/30"
                            )}>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time Remaining</p>
                                <div className="flex items-center gap-2">
                                    <ClockIcon className={clsx("w-4 h-4", isWarning ? "text-amber-400" : "text-teal-400")} />
                                    <p className={clsx("text-xl font-mono font-bold", isWarning ? "text-amber-400" : "text-teal-400")}>
                                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate('/control/dashboard')}
                            size="lg"
                            className={clsx(
                                "w-full font-black uppercase tracking-widest shadow-xl",
                                isWarning ? "bg-amber-500 hover:bg-amber-600" : "bg-teal-500 hover:bg-teal-600"
                            )}
                        >
                            Enter Dashboard
                        </Button>
                    </div>
                </Card>
            </motion.div>
        )
    }

    // --- EXPIRED STATE ---
    if (isConnectionExpired && showReconnect) {
        return (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-md mx-auto"
            >
                <Card className="border-red-500/50 bg-red-900/10 text-center py-10 px-6">
                    <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/20">
                        <SignalIcon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Link Severed</h2>
                    <p className="text-red-300 text-sm mb-8">
                        {disconnectReason === 'inactivity' 
                            ? 'Session terminated due to 5 minutes of inactivity.'
                            : 'The 15-minute session window has closed.'}
                    </p>

                    <div className="space-y-3">
                        {lastSessionCode && (
                            <Button
                                onClick={handleContinueSession}
                                disabled={isPairing}
                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black uppercase tracking-widest"
                            >
                                {isPairing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : `Reconnect to ${lastSessionCode}`}
                            </Button>
                        )}
                        <Button
                            onClick={handleEnterNewCode}
                            variant="outline"
                            className="w-full border-slate-700 text-slate-300 font-bold uppercase tracking-widest"
                        >
                            New Pairing Code
                        </Button>
                    </div>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {/* SCENARIO 1: Cold Start */}
                {!lastSessionCode && !showCodeForm && (
                    <motion.div
                        key="cold-start"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <Card className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Pair Device</h2>
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">System Initialization</p>
                                </div>
                                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center">
                                    <CpuChipIcon className="w-6 h-6 text-teal-400" />
                                </div>
                            </div>

                            <form onSubmit={handlePair} className="space-y-6">
                                <div className="relative">
                                    <Input
                                        value={code}
                                        onChange={(e) => {
                                            setCode(e.target.value.toUpperCase())
                                            setError('')
                                        }}
                                        placeholder="------"
                                        maxLength={6}
                                        className="text-center text-4xl tracking-[0.4em] font-mono font-black uppercase h-20 bg-slate-900/50 border-2 border-slate-700 focus:border-teal-500 transition-all"
                                        autoFocus
                                    />
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Display Code
                                    </div>
                                </div>

                                {error && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <Button 
                                    type="submit" 
                                    size="lg"
                                    disabled={code.length !== 6 || isPairing}
                                    className="w-full font-black uppercase tracking-widest shadow-xl shadow-teal-500/10"
                                >
                                    {isPairing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 'Establish Link'}
                                </Button>

                                <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <ClockIcon className="w-3.5 h-3.5" />
                                        15m Session
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        Free Tier
                                    </div>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}

                {/* SCENARIO 2: Quick Reconnect */}
                {lastSessionCode && !showCodeForm && showQuickReconnect && (
                    <motion.div
                        key="quick-reconnect"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <Card className="p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <div className="flex items-center gap-2 px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest">Cached</span>
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-white mb-1 tracking-tight uppercase">Welcome Back</h2>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-8">Resume previous session</p>

                            <div className="bg-slate-900/80 border-2 border-teal-500/30 rounded-2xl p-6 mb-8 text-center group hover:border-teal-500/50 transition-all">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Last Known Display</p>
                                <p className="text-5xl font-mono font-black text-teal-400 tracking-widest group-hover:scale-110 transition-transform duration-500">
                                    {lastSessionCode}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button 
                                    onClick={handleContinueSession}
                                    disabled={isPairing}
                                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black uppercase tracking-widest py-4 shadow-xl shadow-teal-500/20"
                                >
                                    {isPairing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 'Resume Connection'}
                                </Button>
                                <Button 
                                    onClick={handleEnterNewCode}
                                    variant="ghost"
                                    className="w-full text-slate-400 hover:text-white font-bold uppercase tracking-widest text-xs"
                                >
                                    Pair Different Display
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* SCENARIO 3: New Code Form */}
                {showCodeForm && (
                    <motion.div
                        key="new-code"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <Card className="p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <button 
                                    onClick={() => setShowCodeForm(false)}
                                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase text-left">New Pairing</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-left">Manual Override</p>
                                </div>
                            </div>

                            <form onSubmit={handlePair} className="space-y-6">
                                <div className="relative">
                                    <Input
                                        value={code}
                                        onChange={(e) => {
                                            setCode(e.target.value.toUpperCase())
                                            setError('')
                                        }}
                                        placeholder="------"
                                        maxLength={6}
                                        className="text-center text-4xl tracking-[0.4em] font-mono font-black uppercase h-20 bg-slate-900/50 border-2 border-slate-700 focus:border-teal-500 transition-all"
                                        autoFocus
                                    />
                                </div>

                                {user && boards.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                            Target Board
                                        </label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {boards.map((board) => (
                                                <button
                                                    key={board.id}
                                                    type="button"
                                                    onClick={() => setSelectedBoardId(board.id)}
                                                    className={clsx(
                                                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                                        selectedBoardId === board.id
                                                            ? "bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-500/5"
                                                            : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <DeviceTabletIcon className={clsx("w-5 h-5", selectedBoardId === board.id ? "text-teal-400" : "text-slate-600")} />
                                                        <span className="font-bold text-sm uppercase tracking-tight">{board.name}</span>
                                                    </div>
                                                    {selectedBoardId === board.id && (
                                                        <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                                        {error}
                                    </p>
                                )}

                                <Button 
                                    type="submit" 
                                    size="lg"
                                    disabled={code.length !== 6 || isPairing}
                                    className="w-full font-black uppercase tracking-widest shadow-xl"
                                >
                                    {isPairing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 'Establish Link'}
                                </Button>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

SessionPairing.propTypes = {
    suggestedCode: PropTypes.string,
}
