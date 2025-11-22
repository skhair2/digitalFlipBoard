import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSessionStore } from '../../store/sessionStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import QRCodeDisplay from './QRCodeDisplay'

export default function SessionCode({ fullScreenMode = false }) {
    const { sessionCode, setSessionCode, isConnected } = useSessionStore()

    useEffect(() => {
        if (!sessionCode) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase()
            setSessionCode(code)
        }
    }, [sessionCode, setSessionCode])

    // Use the hook to connect
    useWebSocket()

    if (isConnected) return null

    // Full-screen mode: centered with QR code
    if (fullScreenMode) {
        return (
            <div className="flex flex-col items-center justify-center gap-8 animate-fade-in">
                {/* Large Session Code */}
                <div className="text-center">
                    <p className="text-white/40 text-sm mb-3 uppercase tracking-wider font-semibold">
                        Pairing Code
                    </p>
                    <div className="text-7xl font-mono font-bold text-primary-400 tracking-widest mb-2 drop-shadow-[0_0_20px_rgba(33,128,141,0.5)]">
                        {sessionCode}
                    </div>
                    <p className="text-white/60 text-lg mt-4">
                        Enter this code on your phone
                    </p>
                </div>

                {/* QR Code */}
                <QRCodeDisplay sessionCode={sessionCode} />
            </div>
        )
    }

    // Normal mode: bottom-right corner
    return (
        <div className="fixed bottom-8 right-8 bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-2xl border border-slate-700 text-center z-50">
            <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-semibold">Pairing Code</p>
            <div className="text-5xl font-mono font-bold text-teal-400 tracking-widest">
                {sessionCode}
            </div>
            <p className="text-gray-500 text-xs mt-4">
                Go to <span className="text-white">flipdisplay.online/control</span>
            </p>
        </div>
    )
}

SessionCode.propTypes = {
    fullScreenMode: PropTypes.bool,
}
