import { motion, AnimatePresence } from 'framer-motion'
import { memo } from 'react'
import clsx from 'clsx'

import PropTypes from 'prop-types'

const Character = memo(({ char, color, colorTheme = 'monochrome', animationType = 'flip' }) => {
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
            "bg-slate-900 rounded-sm overflow-hidden border border-slate-800/50"
        )}>
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={`${char}-${color}`}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{
                        duration: 0.6,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                    }}
                    className="absolute inset-0 flex items-center justify-center font-mono text-2xl sm:text-3xl md:text-4xl font-bold shadow-inner"
                    style={{
                        backfaceVisibility: 'hidden',
                        backgroundColor: color || '#1e293b', // Default slate-800
                        color: color ? 'transparent' : 'white' // Hide text if color block
                    }}
                >
                    {char}
                </motion.div>
            </AnimatePresence>

            {/* Split line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-black/30 z-10" />
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
