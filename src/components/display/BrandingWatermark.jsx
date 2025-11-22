import { motion } from 'framer-motion'
import Logo from '../ui/Logo'

export default function BrandingWatermark({ className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`fixed bottom-6 left-6 flex items-center gap-3 z-50 group/watermark ${className}`}
        >
            {/* Logo with pulse animation */}
            <motion.div
                animate={{
                    opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 5,
                    ease: 'easeInOut',
                }}
                className="group-hover/watermark:opacity-40 transition-opacity duration-300"
            >
                <Logo className="w-8 h-8" />
            </motion.div>

            {/* Wordmark */}
            <motion.span
                className="text-white text-sm font-medium opacity-20 group-hover/watermark:opacity-50 transition-opacity duration-300"
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                FlipDisplay.online
            </motion.span>

            {/* Optional tooltip on click */}
            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800/90 backdrop-blur-sm rounded-lg text-xs text-white opacity-0 group-hover/watermark:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Powered by FlipDisplay.online
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/90" />
            </div>
        </motion.div>
    )
}
