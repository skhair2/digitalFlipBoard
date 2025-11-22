import { useEffect, useCallback } from 'react'

/**
 * useKeyboardShortcuts - Custom hook for handling keyboard shortcuts in fullscreen mode
 * 
 * @param {Object} handlers - Object containing callback functions for each shortcut
 * @param {Function} handlers.onToggleFullscreen - Called when 'F' is pressed
 * @param {Function} handlers.onExitFullscreen - Called when 'Esc' is pressed
 * @param {Function} handlers.onShowInfo - Called when 'I' is pressed
 * @param {Function} handlers.onShowHelp - Called when '?' is pressed
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(handlers = {}, enabled = true) {
    const {
        onToggleFullscreen,
        onExitFullscreen,
        onShowInfo,
        onShowHelp,
    } = handlers

    const handleKeyDown = useCallback((event) => {
        if (!enabled) return

        // Don't trigger shortcuts if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return
        }

        switch (event.key.toLowerCase()) {
            case 'f':
                event.preventDefault()
                if (onToggleFullscreen) {
                    onToggleFullscreen()
                }
                break

            case 'escape':
                if (document.fullscreenElement && onExitFullscreen) {
                    event.preventDefault()
                    onExitFullscreen()
                }
                break

            case 'i':
                event.preventDefault()
                if (onShowInfo) {
                    onShowInfo()
                }
                break

            case '?':
                event.preventDefault()
                if (onShowHelp) {
                    onShowHelp()
                }
                break

            default:
                break
        }
    }, [enabled, onToggleFullscreen, onExitFullscreen, onShowInfo, onShowHelp])

    useEffect(() => {
        if (!enabled) return

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [handleKeyDown, enabled])
}

/**
 * Helper function to check if fullscreen is supported
 */
export function isFullscreenSupported() {
    return !!(
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled
    )
}

/**
 * Helper function to toggle fullscreen
 */
export async function toggleFullscreen() {
    if (!document.fullscreenElement) {
        try {
            await document.documentElement.requestFullscreen()
            return true
        } catch (err) {
            console.error('Error entering fullscreen:', err)
            return false
        }
    } else {
        try {
            await document.exitFullscreen()
            return false
        } catch (err) {
            console.error('Error exiting fullscreen:', err)
            return true
        }
    }
}
