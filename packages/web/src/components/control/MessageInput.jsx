import { useState, useRef } from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useMessageBroker } from '../../hooks/useMessageBroker'
import { Button, Input, Card } from '../ui/Components'
import { PaperAirplaneIcon, PhotoIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid'
import { useSessionStore } from '../../store/sessionStore'
import { createBoardState, ALIGNMENTS, PATTERNS } from '../../utils/textLayouts'
import { processImageToBoard } from '../../utils/imageProcessor'

export default function MessageInput({ message, setMessage }) {
    const { sendMessage } = useWebSocket()
    const { sendMessage: sendMessageViaRedis } = useMessageBroker()
    const { setBoardState, gridConfig, lastAnimationType, lastColorTheme } = useSessionStore()
    const [sending, setSending] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const [alignment, setAlignment] = useState(ALIGNMENTS.LEFT)
    const [pattern, setPattern] = useState(PATTERNS.NONE)
    const fileInputRef = useRef(null)

    // Calculate max chars based on current grid
    const rows = gridConfig?.rows || 6
    const cols = gridConfig?.cols || 22
    const maxChars = rows * cols

    const handleSend = async (e) => {
        e.preventDefault()
        if (!message.trim()) return

        setSending(true)

        // Generate rich board state
        const boardState = createBoardState(message, alignment, pattern, rows, cols)
        setBoardState(boardState)

        // Send via both WebSocket (primary) and Redis Pub/Sub (fallback)
        // Use current preferences from store
        await sendMessage(message, { 
            animationType: lastAnimationType, 
            colorTheme: lastColorTheme 
        })
        await sendMessageViaRedis(message, { 
            animation: lastAnimationType, 
            color: lastColorTheme 
        })

        setSending(false)
        setMessage('')
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setSending(true)
            const boardState = await processImageToBoard(file)
            setBoardState(boardState)
            setSending(false)
        } catch (error) {
            console.error('Image processing failed:', error)
            setSending(false)
            alert('Failed to process image')
        }
    }

    return (
        <Card className="fixed bottom-0 left-0 right-0 rounded-b-none border-b-0 pb-8 pt-4 px-4 bg-slate-900/90 border-t border-slate-800 z-50">
            <div className="max-w-2xl mx-auto space-y-4">

                {/* Advanced Options Toggle */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowOptions(!showOptions)}
                        className="text-xs text-slate-400 flex items-center gap-1 hover:text-white"
                    >
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        {showOptions ? 'Hide Options' : 'Show Options'}
                    </button>
                </div>

                {/* Advanced Options Panel */}
                {showOptions && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Alignment</label>
                            <div className="flex gap-1">
                                {Object.values(ALIGNMENTS).map(align => (
                                    <button
                                        key={align}
                                        type="button"
                                        onClick={() => setAlignment(align)}
                                        className={`px-2 py-1 text-xs rounded capitalize ${alignment === align ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                                    >
                                        {align}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Pattern</label>
                            <select
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                className="w-full bg-slate-700 text-white text-xs rounded px-2 py-1 border-none"
                            >
                                {Object.values(PATTERNS).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex gap-3">
                    <div className="relative flex-1">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Type your message (max ${maxChars} chars)...`}
                            maxLength={maxChars}
                            className="w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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

                    <Button
                        type="submit"
                        disabled={!message.trim() || sending}
                        className="aspect-square px-0 w-14"
                    >
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </Button>
                </form>

                <div className="text-right text-xs text-gray-500">
                    {message.length}/{maxChars}
                </div>
            </div>
        </Card>
    )
}
