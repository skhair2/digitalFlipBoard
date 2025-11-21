import { motion } from 'framer-motion'

export default function Logo({ className = "w-8 h-8", animated = false }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Background */}
                <rect x="5" y="5" width="90" height="90" rx="20" className="fill-slate-900 stroke-slate-700" strokeWidth="4" />

                {/* Top Flap */}
                <path d="M15 25 H85 V50 H15 V25 Z" className="fill-slate-800" />

                {/* Bottom Flap */}
                <path d="M15 52 H85 V75 H15 V52 Z" className="fill-slate-800" />

                {/* Split Line */}
                <line x1="10" y1="51" x2="90" y2="51" className="stroke-slate-950" strokeWidth="2" />

                {/* Letter F */}
                <path d="M35 35 H65 M35 35 V65 M35 50 H55" className="stroke-teal-400" strokeWidth="8" strokeLinecap="round" />
            </svg>

            {/* Animated Glare (Optional) */}
            {animated && (
                <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '100%', opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                />
            )}
        </div>
    )
}
