import { useCallback, useRef } from 'react'

/**
 * Lightweight mechanical flip sound synthesized via Web Audio.
 * We avoid shippping binary assets while keeping the vintage feel.
 */
export function useFlipSound(isEnabled) {
    const audioCtxRef = useRef(null)

    const ensureContext = () => {
        if (typeof window === 'undefined') return null
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext
        if (!AudioContextCtor) {
            console.warn('Web Audio API not supported in this browser')
            return null
        }
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContextCtor()
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {
                /* Some browsers require a user interaction before resuming */
            })
        }
        return audioCtxRef.current
    }

    const scheduleFlipSound = useCallback((delayMs = 0) => {
        if (!isEnabled) return
        const ctx = ensureContext()
        if (!ctx) return

        const startTime = ctx.currentTime + Math.max(delayMs, 0) / 1000

        // Two short hits stacked together to mimic mechanical flaps snapping
        for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const hitDelay = startTime + i * 0.04

            osc.type = 'triangle'
            osc.frequency.setValueAtTime(180, hitDelay)
            osc.frequency.exponentialRampToValueAtTime(90, hitDelay + 0.08)

            gain.gain.setValueAtTime(0.0001, hitDelay)
            gain.gain.linearRampToValueAtTime(0.25, hitDelay + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.0001, hitDelay + 0.12)

            osc.connect(gain).connect(ctx.destination)
            osc.start(hitDelay)
            osc.stop(hitDelay + 0.15)
        }
    }, [isEnabled])

    return scheduleFlipSound
}

export default useFlipSound
