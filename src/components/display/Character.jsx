import { motion, AnimatePresence } from 'framer-motion'
import { memo } from 'react'
import clsx from 'clsx'

import PropTypes from 'prop-types'

const Character = memo(({ char, color, colorTheme = 'monochrome', animationType = 'flip', delay = 0 }) => {
    // Map characters to colors based on theme if needed
    // For now, just use standard styling

    const variants = {
        initial: { rotateX: 0 },
        animate: { rotateX: -180 },
        exit: { rotateX: -180 }
    }

    return (
        <div className={clsx(
            "relative w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20 perspective-1000",
            "bg-[#111] rounded-sm overflow-hidden shadow-2xl ring-1 ring-white/10"
        )}>
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={`${char}-${color}`}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{
                        duration: 0.4,
                        delay: delay, // Stagger effect
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        mass: 1
                    }}
                    className="absolute inset-0 flex items-center justify-center font-mono text-4xl sm:text-5xl md:text-6xl font-bold pb-1"
                    style={{
                        backfaceVisibility: 'hidden',
                        backgroundColor: color || '#18181b', // Zinc-900
                        color: color ? 'transparent' : '#f8fafc', // Slate-50
                        backgroundImage: !color ? 'linear-gradient(to bottom, #27272a 0%, #18181b 100%)' : 'none'
                    }}
                >
                    {/* Top half highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    {char}
                </motion.div>
            </AnimatePresence>

            {/* Mechanical Split Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black z-20 shadow-[0_1px_2px_rgba(255,255,255,0.1)]" />

            {/* Side shadows for depth */}
            <div className="absolute inset-y-0 left-0 w-[1px] bg-black/50 z-20" />
            <div className="absolute inset-y-0 right-0 w-[1px] bg-black/50 z-20" />
        </div>
    )
})

Character.displayName = 'Character'

Character.propTypes = {
    char: PropTypes.string,
    color: PropTypes.string,
    colorTheme: PropTypes.string,
    animationType: PropTypes.string
}

export default Character
