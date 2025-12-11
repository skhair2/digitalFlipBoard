import { useState, useEffect } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Components'

export default function EmailVerificationBanner() {
    const { user } = useAuthStore()
    const [isVerified, setIsVerified] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [cooldownSeconds, setCooldownSeconds] = useState(0)
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('info') // 'info', 'success', 'error'

    // Check if email is verified
    useEffect(() => {
        if (user?.email_confirmed_at) {
            setIsVerified(true)
        } else {
            setIsVerified(false)
        }
    }, [user])

    // Handle cooldown timer
    useEffect(() => {
        let interval
        if (cooldownSeconds > 0) {
            interval = setInterval(() => {
                setCooldownSeconds((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [cooldownSeconds])

    const handleResendVerificationEmail = async () => {
        if (!user?.email || cooldownSeconds > 0 || isLoading) return

        setIsLoading(true)
        setMessage(null)

        try {
            const { error } = await useAuthStore.getState().resendVerificationEmail(user.email)

            if (error) {
                setMessageType('error')
                setMessage(error)
            } else {
                setMessageType('success')
                setMessage('Verification email sent! Check your inbox.')
                setCooldownSeconds(60)
            }
        } catch (err) {
            setMessageType('error')
            setMessage('Failed to resend email. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Don't show banner if email is verified or user is not logged in
    if (isVerified || !user) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                key="email-verification-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/30 backdrop-blur-sm"
            >
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-amber-100">
                                    Please verify your email to access all features
                                </p>
                                <p className="text-xs text-amber-200 mt-1">
                                    We sent a verification link to <span className="font-semibold">{user.email}</span>
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleResendVerificationEmail}
                            disabled={cooldownSeconds > 0 || isLoading}
                            className="bg-amber-500 hover:bg-amber-600 text-white border-none flex-shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <span className="inline-block animate-spin mr-2">⟳</span>
                                    Sending...
                                </>
                            ) : cooldownSeconds > 0 ? (
                                <>
                                    <span className="inline-block mr-2">⏱️</span>
                                    Resend in {cooldownSeconds}s
                                </>
                            ) : (
                                'Resend Verification Email'
                            )}
                        </Button>
                    </div>

                    {/* Message feedback */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                key={`message-${messageType}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3"
                            >
                                <div
                                    className={`p-2 rounded-lg text-sm flex items-center gap-2 ${
                                        messageType === 'success'
                                            ? 'bg-green-500/10 border border-green-500/30 text-green-200'
                                            : messageType === 'error'
                                            ? 'bg-red-500/10 border border-red-500/30 text-red-200'
                                            : 'bg-blue-500/10 border border-blue-500/30 text-blue-200'
                                    }`}
                                >
                                    {messageType === 'success' && (
                                        <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    {message}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Spacer to prevent content overlap */}
            <div className="h-20 md:h-16" />
        </AnimatePresence>
    )
}
