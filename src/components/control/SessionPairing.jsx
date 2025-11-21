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
