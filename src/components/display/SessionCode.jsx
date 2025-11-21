import { useState, useEffect } from 'react'
import { useSessionStore } from '../../store/sessionStore'
import { useWebSocket } from '../../hooks/useWebSocket'

export default function SessionCode() {
    const { sessionCode, setSessionCode, isConnected } = useSessionStore()
    // In a real app, we would fetch this from the server via API or WebSocket
    // For now, we'll generate a random one if not set

    useEffect(() => {
        if (!sessionCode) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase()
            setSessionCode(code)
        }
    }, [sessionCode, setSessionCode])

    // Use the hook to connect
    useWebSocket()

    if (isConnected) return null

    return (
        <div className="fixed bottom-8 right-8 bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-2xl border border-slate-700 text-center z-50">
            <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-semibold">Pairing Code</p>
            <div className="text-5xl font-mono font-bold text-teal-400 tracking-widest">
                {sessionCode}
            </div>
            <p className="text-gray-500 text-xs mt-4">
                Go to <span className="text-white">digitalflipboard.com/control</span>
            </p>
        </div>
    )
}
