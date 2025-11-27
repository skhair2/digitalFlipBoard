import { memo } from 'react'
import clsx from 'clsx'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'

const Character = memo(({ char, color, delay = 0, fontSize = null, isFullscreen = false }) => {
    // Character animation and rendering

    // Determine character dimensions
    const charDimensions = isFullscreen && fontSize
        ? {
            style: {
                width: `${fontSize * 0.65}px`, // Width based on font size (65%)
                height: `${fontSize * 1.3}px`, // Height based on font size (130%)
                fontSize: `${fontSize}px`,
            }
        }
        : {}

    return (
        <div className={clsx(
            !isFullscreen && "w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20",
            "relative perspective-1000",
            "bg-[#111] rounded-sm overflow-hidden shadow-2xl ring-1 ring-white/10"
        )}
        {...(isFullscreen && fontSize ? { style: charDimensions.style } : {})}
        >
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
                    className={clsx(
                        "absolute inset-0 flex items-center justify-center font-mono font-bold pb-1",
                        !isFullscreen && "text-4xl sm:text-5xl md:text-6xl"
                    )}
                    style={{
                        backfaceVisibility: 'hidden',
                        backgroundColor: color || '#18181b', // Zinc-900
                        color: color ? 'transparent' : '#f8fafc', // Slate-50
                        backgroundImage: !color ? 'linear-gradient(to bottom, #27272a 0%, #18181b 100%)' : 'none',
                        ...(isFullscreen && fontSize && { fontSize: `${fontSize}px` })
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
    animationType: PropTypes.string,
    delay: PropTypes.number,
    fontSize: PropTypes.number,
    isFullscreen: PropTypes.bool
}

export default Character
