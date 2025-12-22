import { useState, useRef } from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useMessageBroker } from '../../hooks/useMessageBroker'
import { Button, Input, Card } from '../ui/Components'
import { 
    PaperAirplaneIcon, 
    PhotoIcon, 
    AdjustmentsHorizontalIcon, 
    BookmarkIcon,
    Bars3BottomLeftIcon,
    Bars3Icon,
    Bars3BottomRightIcon,
    Squares2X2Icon,
    SparklesIcon,
    ArrowPathIcon
} from '@heroicons/react/24/solid'
import { useSessionStore } from '../../store/sessionStore'
import { useDesignStore } from '../../store/designStore'
import { useAuthStore } from '../../store/authStore'
import { createBoardState, ALIGNMENTS, PATTERNS } from '../../utils/textLayouts'
import { processImageToBoard } from '../../utils/imageProcessor'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export default function MessageInput({ message, setMessage }) {
    const { sendMessage } = useWebSocket()
    const { sendMessage: sendMessageViaRedis } = useMessageBroker()
    const { setBoardState, gridConfig, lastAnimationType, lastColorTheme, isConnected } = useSessionStore()
    const { saveDesign, setCurrentDesign } = useDesignStore()
    const { user } = useAuthStore()
    const [sending, setSending] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const [alignment, setAlignment] = useState(ALIGNMENTS.LEFT)
    const [pattern, setPattern] = useState(PATTERNS.NONE)
    const fileInputRef = useRef(null)

    const rows = gridConfig?.rows || 6
    const cols = gridConfig?.cols || 22
    const maxChars = rows * cols

    const handleSend = async (e) => {
        e.preventDefault()
        if (!message.trim()) return

        setSending(true)
        const boardState = createBoardState(message, alignment, pattern, rows, cols)
        setBoardState(boardState)

        try {
            await sendMessage(message, { 
                animationType: lastAnimationType, 
                colorTheme: lastColorTheme 
            })
            await sendMessageViaRedis(message, { 
                animation: lastAnimationType, 
                color: lastColorTheme 
            })
            setMessage('')
            toast.success('Message Transmitted', {
                icon: '',
                style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' }
            })
        } catch (err) {
            toast.error('Transmission Failed')
        } finally {
            setSending(false)
        }
    }

    const handleSaveToLibrary = async () => {
        if (!message.trim()) return
        if (!user) {
            toast.error('Authentication Required')
            return
        }

        setSaving(true)
        try {
            const boardState = createBoardState(message, alignment, pattern, rows, cols)
            setCurrentDesign(boardState)
            const result = await saveDesign(message.slice(0, 20) + (message.length > 20 ? '...' : ''))
            if (result.success) {
                toast.success('Stored in Library')
            } else {
                toast.error(result.error || 'Storage Failed')
            }
        } catch (error) {
            toast.error('Storage Error')
        } finally {
            setSaving(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setSending(true)
            const boardState = await processImageToBoard(file)
            setBoardState(boardState)
            toast.success('Image Processed')
        } catch (error) {
            toast.error('Image Processing Failed')
        } finally {
            setSending(false)
        }
    }

    const charPercentage = (message.length / maxChars) * 100

    return (
        <div className="space-y-6">
            <Card className="p-0 overflow-hidden border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
                {/* Control Strip */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
                    <div className="flex items-center gap-1">
                        {[
                            { id: ALIGNMENTS.LEFT, icon: Bars3BottomLeftIcon },
                            { id: ALIGNMENTS.CENTER, icon: Bars3Icon },
                            { id: ALIGNMENTS.RIGHT, icon: Bars3BottomRightIcon },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setAlignment(item.id)}
                                className={clsx(
                                    "p-2 rounded-lg transition-all",
                                    alignment === item.id 
                                        ? "bg-teal-500/20 text-teal-400 shadow-inner" 
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pattern</span>
                            <select
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 rounded-md px-2 py-1 focus:outline-none focus:border-teal-500 uppercase tracking-widest"
                            >
                                {Object.values(PATTERNS).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-px h-4 bg-slate-800" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-500 hover:text-teal-400 transition-colors"
                            title="Upload Image"
                        >
                            <PhotoIcon className="w-5 h-5" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 sm:p-6 space-y-4">
                    <form onSubmit={handleSend} className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value.toUpperCase())}
                            placeholder={`ENTER SYSTEM MESSAGE...`}
                            maxLength={maxChars}
                            rows={4}
                            className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-lg sm:text-2xl font-mono font-black text-white placeholder:text-slate-800 focus:outline-none focus:border-teal-500/50 transition-all uppercase tracking-widest resize-none shadow-inner"
                        />
                        
                        {/* Character Counter Overlay */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className={clsx(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    message.length >= maxChars ? "text-red-500" : "text-slate-600"
                                )}>
                                    {message.length} / {maxChars}
                                </span>
                                <div className="w-16 sm:w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${charPercentage}%` }}
                                        className={clsx(
                                            "h-full transition-colors",
                                            charPercentage > 90 ? "bg-red-500" : "bg-teal-500"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button
                            type="button"
                            onClick={handleSaveToLibrary}
                            disabled={!message.trim() || saving}
                            variant="outline"
                            className="flex-1 h-12 sm:h-14 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white font-black uppercase tracking-widest"
                        >
                            {saving ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <BookmarkIcon className="w-5 h-5" />
                                    <span>Archive</span>
                                </div>
                            )}
                        </Button>

                        <Button
                            onClick={handleSend}
                            disabled={!message.trim() || sending || !isConnected}
                            className={clsx(
                                "flex-[2] h-12 sm:h-14 font-black uppercase tracking-widest shadow-2xl transition-all",
                                !isConnected || !message.trim() 
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                                    : "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20"
                            )}
                        >
                            {sending ? (
                                <div className="flex items-center gap-2">
                                    <ArrowPathIcon className="w-6 h-6 animate-spin" />
                                    <span>Transmitting...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <PaperAirplaneIcon className="w-6 h-6" />
                                    <span>Transmit to Board</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="px-6 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className={clsx("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {isConnected ? "Link Active" : "Link Offline"}
                            </span>
                        </div>
                        <div className="w-px h-3 bg-slate-800" />
                        <div className="flex items-center gap-1.5">
                            <SparklesIcon className="w-3 h-3 text-teal-500/50" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {lastAnimationType} Mode
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Grid: {rows}x{cols}</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}
