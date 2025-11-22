import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useAutoHide - Custom hook for auto-hiding UI elements based on mouse inactivity
 * 
 * @param {number} timeout - Time in milliseconds before hiding (default: 3000ms)
 * @param {boolean} enabled - Whether auto-hide is enabled (default: true)
 * @returns {Object} { isVisible, show, hide, toggle }
 */
export function useAutoHide(timeout = 3000, enabled = true) {
    const [isVisible, setIsVisible] = useState(true)
    const timeoutRef = useRef(null)

    const show = useCallback(() => {
        setIsVisible(true)
    }, [])

    const hide = useCallback(() => {
        setIsVisible(false)
    }, [])

    const toggle = useCallback(() => {
        setIsVisible(prev => !prev)
    }, [])

    const resetTimer = useCallback(() => {
        if (!enabled) return

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Show element
        setIsVisible(true)

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false)
        }, timeout)
    }, [timeout, enabled])

    useEffect(() => {
        if (!enabled) {
            setIsVisible(true)
            return
        }

        // Track mouse movement
        const handleMouseMove = () => {
            resetTimer()
        }

        // Track mouse enter (for touch devices)
        const handleMouseEnter = () => {
            resetTimer()
        }

        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseenter', handleMouseEnter)

        // Initial timer
        resetTimer()

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseenter', handleMouseEnter)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [resetTimer, enabled])

    return {
        isVisible,
        show,
        hide,
        toggle,
    }
}
