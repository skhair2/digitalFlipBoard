import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import { useAuthStore } from '../../store/authStore'
import { useUsageStore } from '../../store/usageStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Button, Input, Card } from '../ui/Components'

export default function SessionPairing() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { setSessionCode } = useSessionStore()
    const { isConnected } = useWebSocket()
    const { user } = useAuthStore()
    const { freeSessionUsed, incrementSession } = useUsageStore()

    const handlePair = (e) => {
        e.preventDefault()
        if (code.length !== 6) {
            setError('Code must be 6 characters')
            return
        }

        // Check limits
        if (!user && freeSessionUsed) {
            setError('Free session limit reached. Please sign in to continue.')
            return
        }

        setSessionCode(code.toUpperCase())

        // Mark free session as used if not logged in
        if (!user) {
            incrementSession()
        }

        // navigate('/control/dashboard') // Removed incorrect navigation
    }

    // Success Animation State
    if (isConnected) {
        return (
            <Card className="max-w-md mx-auto w-full bg-teal-900/20 border-teal-500/50">
                <div className="text-center py-8">
                    <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-[0_0_20px_rgba(20,184,166,0.5)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Connected!</h2>
                    <p className="text-teal-200 mb-8">Your device is paired successfully.</p>

                    <Button
                        onClick={() => navigate('/control/dashboard')}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold"
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card className="max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Connect Display</h2>
            <p className="text-gray-400 text-center mb-8">Enter the 6-digit code shown on your display</p>

            <form onSubmit={handlePair} className="space-y-4">
                <div className="relative">
                    <Input
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase())
                            setError('')
                        }}
                        placeholder="A1B2C3"
                        maxLength={6}
                        className="text-center text-3xl tracking-[0.5em] font-mono uppercase"
                    />
                </div>

                {error && (
                    <div className="text-center">
                        <p className="text-red-400 text-sm mb-2">{error}</p>
                        {!user && freeSessionUsed && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/login')}
                                className="mt-2"
                            >
                                Sign In for Unlimited Access
                            </Button>
                        )}
                    </div>
                )}

                <Button type="submit" className="w-full" size="lg">
                    Connect Device
                </Button>

                {!user && !freeSessionUsed && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                        1 free session available without sign in
                    </p>
                )}
            </form>
        </Card>
    )
}
