import PropTypes from 'prop-types'
import { useAuthStore } from '../../store/authStore'
import { motion } from 'framer-motion'

export default function PremiumGate({ children, fallback }) {
    const { isPremium } = useAuthStore()

    if (isPremium) {
        return children
    }

    return (
        <div className="relative">
            {/* Blurred content */}
            <div className="filter blur-sm pointer-events-none select-none opacity-50">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900/90 border border-teal-500/30 p-6 rounded-2xl shadow-2xl text-center max-w-sm mx-4 backdrop-blur-md"
                >
                    <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-teal-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Premium Feature</h3>
                    <p className="text-gray-400 mb-6">
                        Unlock the Board Designer to create, save, and cast custom pixel-perfect layouts.
                    </p>
                    <button
                        onClick={() => window.location.href = '/pricing'}
                        className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                    >
                        Upgrade to Pro
                    </button>
                </motion.div>
            </div>
        </div>
    )
}

PremiumGate.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.node,
}
