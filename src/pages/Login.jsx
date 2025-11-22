import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import { Input, Button } from '../components/ui/Components'
import Logo from '../components/ui/Logo'

export default function Login() {
    const navigate = useNavigate()
    const { signInWithPassword, signUpWithPassword, signUpWithGoogle, signUpWithMagicLink } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    // Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')

    const handleAuth = async (mode) => {
        setError(null)
        setSuccessMessage(null)
        setIsLoading(true)

        let result
        try {
            if (mode === 'signin') {
                result = await signInWithPassword(email, password)
            } else if (mode === 'signup') {
                result = await signUpWithPassword(email, password, fullName)
            } else if (mode === 'magiclink') {
                result = await signUpWithMagicLink(email)
            }

            if (result.success) {
                if (mode === 'magiclink') {
                    setSuccessMessage('Check your email for the magic link!')
                } else {
                    navigate('/dashboard')
                }
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError('An unexpected error occurred.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setError(null)
        const result = await signUpWithGoogle()
        if (!result.success) {
            setError(result.error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-teal-500/10 blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse delay-1000" />
                <div className="absolute -bottom-[40%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="w-full max-w-md z-10 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8 pb-0 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block mb-4"
                        >
                            <Logo className="w-12 h-12 mx-auto" animated />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Digital FlipBoard</h2>
                        <p className="text-slate-400 text-sm">Sign in to control your board</p>
                    </div>

                    <Tab.Group>
                        <Tab.List className="flex p-1 space-x-1 bg-slate-950/50 rounded-xl mx-8 mt-6 border border-white/5">
                            {['Sign In', 'Sign Up', 'Magic Link'].map((category) => (
                                <Tab
                                    key={category}
                                    className={({ selected }) =>
                                        clsx(
                                            'w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 outline-none',
                                            selected
                                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                                : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                                        )
                                    }
                                >
                                    {category}
                                </Tab>
                            ))}
                        </Tab.List>

                        <Tab.Panels className="p-8 pt-6">
                            <AnimatePresence mode="wait">
                                {/* Sign In Panel */}
                                <Tab.Panel
                                    as={motion.div}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 focus:outline-none"
                                >
                                    <div className="space-y-4">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email address"
                                            className="bg-slate-950/50 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20"
                                        />
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="bg-slate-950/50 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20"
                                        />
                                        <Button
                                            onClick={() => handleAuth('signin')}
                                            disabled={isLoading || !email || !password}
                                            className="w-full bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-white shadow-lg shadow-teal-500/25 border-none"
                                        >
                                            {isLoading ? 'Signing In...' : 'Sign In'}
                                        </Button>
                                    </div>
                                </Tab.Panel>

                                {/* Sign Up Panel */}
                                <Tab.Panel
                                    as={motion.div}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 focus:outline-none"
                                >
                                    <div className="space-y-4">
                                        <Input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Full Name"
                                            className="bg-slate-950/50 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20"
                                        />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email address"
                                            className="bg-slate-950/50 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20"
                                        />
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="bg-slate-950/50 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20"
                                        />
                                        <Button
                                            onClick={() => handleAuth('signup')}
                                            disabled={isLoading || !email || !password || !fullName}
                                            className="w-full bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-white shadow-lg shadow-teal-500/25 border-none"
                                        >
                                            {isLoading ? 'Create Account' : 'Sign Up'}
                                        </Button>
                                    </div>
                                </Tab.Panel>

                                {/* Magic Link Panel */}
                                <Tab.Panel
                                    as={motion.div}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 focus:outline-none"
                                >
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-400 text-center mb-4">
                                            We'll send a magic link to your email. No password required.
                                        </p>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email address"
                                            className="bg-slate-950/50 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20"
                                        />
                                        <Button
                                            onClick={() => handleAuth('magiclink')}
                                            disabled={isLoading || !email}
                                            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-400 hover:to-indigo-300 text-white shadow-lg shadow-indigo-500/25 border-none"
                                        >
                                            {isLoading ? 'Sending...' : 'Send Magic Link'}
                                        </Button>
                                    </div>
                                </Tab.Panel>
                            </AnimatePresence>
                        </Tab.Panels>
                    </Tab.Group>

                    {/* Feedback Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-8 pb-4"
                            >
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-8 pb-4"
                            >
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
                                    {successMessage}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Divider */}
                    <div className="px-8 pb-6">
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                <span className="px-2 bg-transparent text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleAuth}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all duration-200 font-semibold text-sm group"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>
                    </div>
                </motion.div>

                <p className="text-center text-slate-500 text-xs mt-8">
                    By continuing, you agree to our <a href="/terms" className="text-slate-400 hover:text-white underline">Terms of Service</a> and <a href="/privacy" className="text-slate-400 hover:text-white underline">Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}
