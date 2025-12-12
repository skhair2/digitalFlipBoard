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

        const t = ctx.currentTime + Math.max(delayMs, 0) / 1000

        // 1. The "Click" (Sharp impact transient)
        // A rapid sine sweep creates the sharp "tick" of the flap hitting the stopper
        const osc = ctx.createOscillator()
        const oscGain = ctx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(2000, t) 
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.015) // Extremely fast drop
        
        oscGain.gain.setValueAtTime(0.25, t)
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.015)
        
        osc.connect(oscGain)
        oscGain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.02)

        // 2. The "Clack" (Plastic body resonance)
        // Short burst of filtered noise for the physical texture
        const bufferSize = ctx.sampleRate * 0.05 // 50ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1
        }

        const noise = ctx.createBufferSource()
        noise.buffer = buffer
        
        const noiseFilter = ctx.createBiquadFilter()
        noiseFilter.type = 'lowpass'
        noiseFilter.frequency.value = 800 // Muffled plastic sound

        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.15, t)
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04)

        noise.connect(noiseFilter)
        noiseFilter.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        noise.start(t)
    }, [isEnabled])

    return scheduleFlipSound
}

export default useFlipSound
