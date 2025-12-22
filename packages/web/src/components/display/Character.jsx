import { memo, useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import { useFlipSound } from '../../hooks/useFlipSound'

const FLAP_SEQUENCE = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?/"

const Character = memo(({ char: targetChar, color, delay = 0, fontSize = null, isFullscreen = false, animationType = 'flip' }) => {
    const [visibleChar, setVisibleChar] = useState(targetChar)
    const [nextChar, setNextChar] = useState(targetChar)
    const [isFlipping, setIsFlipping] = useState(false)
    
    const playSound = useFlipSound(true)
    const timeoutRef = useRef(null)
    const isScrollingRef = useRef(false)

    const charDimensions = isFullscreen && fontSize
        ? {
            style: {
                width: `${fontSize * 0.65}px`,
                height: `${fontSize * 1.3}px`,
                fontSize: `${fontSize}px`,
            }
        }
        : {}

    useEffect(() => {
        if (visibleChar === targetChar && !isFlipping) {
            isScrollingRef.current = false
            return
        }
        if (isFlipping) return

        const startDelay = isScrollingRef.current ? 0 : delay * 1000
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        timeoutRef.current = setTimeout(() => {
            isScrollingRef.current = true
            
            if (animationType === 'flip') {
                const currentIdx = FLAP_SEQUENCE.indexOf(visibleChar.toUpperCase())
                const targetIdx = FLAP_SEQUENCE.indexOf(targetChar.toUpperCase())

                let next
                if (currentIdx === -1 || targetIdx === -1) {
                    next = targetChar
                } else {
                    const nextIdx = (currentIdx + 1) % FLAP_SEQUENCE.length
                    next = FLAP_SEQUENCE[nextIdx]
                }

                setNextChar(next)
                setIsFlipping(true)
                playSound()
            } else {
                setNextChar(targetChar)
                setIsFlipping(true)
            }
        }, startDelay)

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [targetChar, visibleChar, isFlipping, delay, playSound, animationType])

    const handleAnimationComplete = () => {
        setVisibleChar(nextChar)
        setIsFlipping(false)
    }

    const variants = {
        flip: {
            rotateX: [0, -90, -180],
            transition: { duration: 0.12, ease: "easeInOut" }
        },
        fade: {
            opacity: [0, 1],
            transition: { duration: 0.4, ease: "easeOut" }
        },
        slide: {
            y: [15, 0],
            opacity: [0, 1],
            transition: { duration: 0.3, ease: "backOut" }
        }
    }

    return (
        <div 
            className={clsx(
                "relative flex items-center justify-center overflow-hidden rounded-lg select-none",
                "bg-[#111] border border-white/5 shadow-inner"
            )}
            {...charDimensions}
        >
            {/* Mechanical Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/60 z-20" />
            
            <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
                <motion.div
                    key={nextChar + isFlipping}
                    initial={animationType === 'flip' ? { rotateX: 0 } : { opacity: 0 }}
                    animate={variants[animationType] || variants.flip}
                    className="w-full h-full flex items-center justify-center font-mono font-black tracking-tighter"
                    style={{ color: color || '#2dd4bf' }}
                >
                    {nextChar}
                </motion.div>
            </AnimatePresence>

            {/* Subtle Gloss */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-30" />
        </div>
    )
})

Character.displayName = 'Character'

Character.propTypes = {
    char: PropTypes.string.isRequired,
    color: PropTypes.string,
    delay: PropTypes.number,
    fontSize: PropTypes.number,
    isFullscreen: PropTypes.bool,
    animationType: PropTypes.string
}

export default Character
