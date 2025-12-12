import { memo, useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { useFlipSound } from '../../hooks/useFlipSound'

// Standard split-flap sequence: Space -> Numbers -> Letters -> Symbols
const FLAP_SEQUENCE = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?/"

const Character = memo(({ char: targetChar, color, delay = 0, fontSize = null, isFullscreen = false }) => {
    // visibleChar: The character currently fully shown (static background)
    // nextChar: The character we are flipping TO (on the flap)
    const [visibleChar, setVisibleChar] = useState(targetChar)
    const [nextChar, setNextChar] = useState(targetChar)
    const [isFlipping, setIsFlipping] = useState(false)
    
    const playSound = useFlipSound(true)
    const timeoutRef = useRef(null)
    const isScrollingRef = useRef(false)

    // Determine character dimensions
    const charDimensions = isFullscreen && fontSize
        ? {
            style: {
                width: `${fontSize * 0.65}px`,
                height: `${fontSize * 1.3}px`,
                fontSize: `${fontSize}px`,
            }
        }
        : {}

    // Main Animation Loop
    useEffect(() => {
        // If we are already at the target, stop.
        if (visibleChar === targetChar && !isFlipping) {
            isScrollingRef.current = false
            return
        }

        // If we are currently flipping, wait for it to finish (handled by onAnimationComplete)
        if (isFlipping) return

        // Calculate start delay only if we haven't started scrolling yet
        const startDelay = isScrollingRef.current ? 0 : delay * 1000
        
        // Clear any pending scheduled flips
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        timeoutRef.current = setTimeout(() => {
            isScrollingRef.current = true
            
            // Determine the next character in the sequence
            const currentIdx = FLAP_SEQUENCE.indexOf(visibleChar.toUpperCase())
            const targetIdx = FLAP_SEQUENCE.indexOf(targetChar.toUpperCase())

            let next
            // If current or target is not in sequence, or if we are somehow stuck, just jump to target
            // This handles unknown characters gracefully
            if (currentIdx === -1 || targetIdx === -1) {
                next = targetChar
            } else {
                // Move one step forward in the sequence
                const nextIdx = (currentIdx + 1) % FLAP_SEQUENCE.length
                next = FLAP_SEQUENCE[nextIdx]
            }

            // Trigger the flip
            setNextChar(next)
            setIsFlipping(true)
            playSound()

        }, startDelay)

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [targetChar, visibleChar, isFlipping, delay, playSound])

    const handleAnimationComplete = () => {
        // The flip is done. The 'nextChar' is now the 'visibleChar'.
        setVisibleChar(nextChar)
        setIsFlipping(false)
        // The useEffect will trigger again because visibleChar changed, continuing the loop if needed.
    }

    // Common styles for the character text
    const textStyle = {
        backgroundColor: color || '#18181b',
        color: color ? 'transparent' : '#f8fafc',
        backgroundImage: !color ? 'linear-gradient(to bottom, #27272a 0%, #18181b 100%)' : 'none',
        ...(isFullscreen && fontSize && { fontSize: `${fontSize}px` })
    }

    // Rich HD Texture Overlay
    const textureOverlay = (
        <div className="absolute inset-0 opacity-20 pointer-events-none z-20"
             style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                 mixBlendMode: 'overlay'
             }}
        />
    )

    // Inner content renderer
    const renderContent = (c, isTop) => (
        <div className={clsx(
            "absolute inset-0 flex justify-center font-mono font-bold",
            !isFullscreen && "text-4xl sm:text-5xl md:text-6xl",
            isTop ? "items-end" : "items-start"
        )}
        style={{
            ...textStyle,
            height: '200%', // Double height to hold full char
            top: isTop ? '0' : '-100%' // Shift for bottom half
        }}>
            <span className="flex items-center justify-center w-full h-full pt-1">
                {c}
            </span>
            {textureOverlay}
            {/* Lighting gradients */}
            {isTop ? (
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
            )}
        </div>
    )

    return (
        <div className={clsx(
            !isFullscreen && "w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20",
            "relative perspective-1000 bg-[#111] rounded-sm shadow-2xl ring-1 ring-white/10"
        )}
        {...(isFullscreen && fontSize ? { style: charDimensions.style } : {})}
        >
            {/* 1. Static Background Layer */}
            {/* Top Half: New Char (Revealed when flap falls) */}
            <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden z-0">
                {renderContent(nextChar, true)}
            </div>
            {/* Bottom Half: Old Char (Covered when flap falls) */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden z-0">
                {renderContent(visibleChar, false)}
            </div>

            {/* 2. The Flap (Animated) */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-1/2 z-10 preserve-3d origin-bottom"
                initial={{ rotateX: 0 }}
                animate={{ rotateX: isFlipping ? -180 : 0 }}
                transition={{ 
                    duration: 0.14, // 140ms - Tuned for Solari board speed
                    ease: "easeIn", // Gravity acceleration
                    type: "tween"
                }}
                onAnimationComplete={() => {
                    if (isFlipping) handleAnimationComplete()
                }}
            >
                {/* Front Face: Old Char Top */}
                <div className="absolute inset-0 backface-hidden overflow-hidden"
                     style={{ backfaceVisibility: 'hidden' }}>
                    {renderContent(visibleChar, true)}
                </div>

                {/* Back Face: New Char Bottom */}
                <div className="absolute inset-0 backface-hidden overflow-hidden"
                     style={{ 
                         backfaceVisibility: 'hidden', 
                         transform: 'rotateX(180deg)' 
                     }}>
                    {renderContent(nextChar, false)}
                </div>
            </motion.div>

            {/* Mechanical Split Line (Middle) */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/80 z-30 shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
            
            {/* Side Hinges/Depth */}
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
