import { useState } from 'react'
import PropTypes from 'prop-types'
import { useSessionStore } from '../../store/sessionStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import QRCodeDisplay from './QRCodeDisplay'

export default function SessionCode({ fullScreenMode = false }) {
    const { sessionCode, isConnected } = useSessionStore()
    const [inputCode, setInputCode] = useState('')

    // Use the hook to connect (but only when isCodeConfirmed is true and sessionCode exists)
    useWebSocket()

    const _handleCodeSubmit = (e) => {
        e.preventDefault()
        const code = inputCode.trim().toUpperCase()
        
        if (!code) {
            return
        }
        
        if (!sessionCode) {
            return
        }
        
        // Check if entered code matches the generated code
        if (code !== sessionCode) {
            return
        }
        
        // Code is correct - trigger connection
        setInputCode('')
        console.log('[SessionCode] Code confirmed, triggering connection')
    }

    if (isConnected) return null

    // If no session code yet, we shouldn't render (but this shouldn't happen as Display generates it)
    if (!sessionCode) return null

    // Display always shows the code - waiting for controller to join
    // No confirmation needed - controller will initiate the connection
    if (fullScreenMode) {
        return (
            <div className="flex flex-col items-center justify-center gap-8 animate-fade-in">
                <div className="text-center max-w-md">
                    <h2 className="text-3xl font-bold text-white mb-2">Display Waiting for Controller</h2>
                    
                    {/* Show the generated code */}
                    <div className="mb-8 p-6 bg-slate-800/50 border-2 border-primary-500/50 rounded-lg">
                        <p className="text-white/60 text-sm mb-2">Display Code:</p>
                        <div className="text-6xl font-mono font-bold text-primary-400 tracking-widest mb-2">
                            {sessionCode}
                        </div>
                        <p className="text-white/60 text-sm">
                            Share this code with controller
                        </p>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-green-400 text-sm font-semibold">✓ Code generated and waiting...</p>
                        <p className="text-gray-400 text-xs">Controller will enter this code from another device/window</p>
                    </div>
                </div>
            </div>
        )
    }

    // Normal mode: show code in bottom-right corner
    return (
        <div className="fixed bottom-8 right-8 bg-slate-800/90 backdrop-blur p-6 rounded-xl shadow-2xl border border-slate-700 z-50 w-80 animate-fade-in">
            <p className="text-gray-400 text-sm mb-3 uppercase tracking-wider font-semibold">Display Code (Waiting)</p>
            
            {/* Show the generated code */}
            <div className="mb-4 p-3 bg-slate-700/50 border border-primary-500/30 rounded">
                <div className="text-4xl font-mono font-bold text-primary-400 tracking-widest text-center">
                    {sessionCode}
                </div>
            </div>
            
            <div className="space-y-2">
                <p className="text-green-400 text-xs font-semibold text-center">✓ Ready</p>
                <p className="text-gray-400 text-xs text-center">
                    Share this code with controller
                </p>
            </div>
            
            <p className="text-gray-500 text-xs mt-3 text-center">
                Share this code with controller
            </p>
        </div>
    )
}

SessionCode.propTypes = {
    fullScreenMode: PropTypes.bool,
}
