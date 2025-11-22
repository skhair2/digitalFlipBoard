import mixpanel from './mixpanelService'

/**
 * Web Vitals Service
 * Tracks Core Web Vitals metrics and sends to Mixpanel
 * 
 * Metrics:
 * - LCP (Largest Contentful Paint) - time to largest visible element
 * - FID (First Input Delay) - responsiveness to user input
 * - CLS (Cumulative Layout Shift) - visual stability
 * - FCP (First Contentful Paint) - time to first content
 * - TTFB (Time to First Byte) - server response time
 */

class WebVitalsService {
    constructor() {
        this.vitals = {
            LCP: null,
            FID: null,
            CLS: null,
            FCP: null,
            TTFB: null
        }
        this.initialized = false
    }

    /**
     * Initialize Web Vitals tracking
     * Uses PerformanceObserver API to track metrics
     */
    init() {
        if (this.initialized || typeof window === 'undefined') {
            return
        }

        this.initialized = true

        // Track Largest Contentful Paint (LCP)
        this.trackLCP()

        // Track First Input Delay (FID) / Interaction to Next Paint (INP)
        this.trackFID()

        // Track Cumulative Layout Shift (CLS)
        this.trackCLS()

        // Track First Contentful Paint (FCP)
        this.trackFCP()

        // Track Time to First Byte (TTFB)
        this.trackTTFB()

        // Send vitals to Mixpanel when page unloads
        window.addEventListener('beforeunload', () => {
            this.sendVitals()
        })

        // Also send after 10 seconds (for pages that don't unload immediately)
        setTimeout(() => {
            this.sendVitals()
        }, 10000)
    }

    /**
     * Track Largest Contentful Paint (LCP)
     * Indicates when the largest visible element is rendered
     */
    trackLCP() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                const lastEntry = entries[entries.length - 1]
                this.vitals.LCP = Math.round(lastEntry.renderTime || lastEntry.loadTime)
            })

            observer.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (error) {
            console.warn('LCP tracking not supported:', error)
        }
    }

    /**
     * Track First Input Delay (FID)
     * Measures delay between user input and response
     */
    trackFID() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                const firstEntry = entries[0]
                if (firstEntry) {
                    this.vitals.FID = Math.round(firstEntry.processingStart - firstEntry.startTime)
                }
            })

            observer.observe({ entryTypes: ['first-input'] })
        } catch (error) {
            console.warn('FID tracking not supported:', error)
        }
    }

    /**
     * Track Cumulative Layout Shift (CLS)
     * Measures unexpected layout shifts
     */
    trackCLS() {
        try {
            let clsValue = 0
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value
                        this.vitals.CLS = Math.round(clsValue * 1000) / 1000
                    }
                }
            })

            observer.observe({ entryTypes: ['layout-shift'] })
        } catch (error) {
            console.warn('CLS tracking not supported:', error)
        }
    }

    /**
     * Track First Contentful Paint (FCP)
     * Measures time when first content is rendered
     */
    trackFCP() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
                if (fcpEntry) {
                    this.vitals.FCP = Math.round(fcpEntry.startTime)
                }
            })

            observer.observe({ entryTypes: ['paint'] })
        } catch (error) {
            console.warn('FCP tracking not supported:', error)
        }
    }

    /**
     * Track Time to First Byte (TTFB)
     * Measures server response time
     */
    trackTTFB() {
        try {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing
                const ttfb = timing.responseStart - timing.navigationStart
                this.vitals.TTFB = Math.round(ttfb)
            }
        } catch (error) {
            console.warn('TTFB tracking not supported:', error)
        }
    }

    /**
     * Send all collected vitals to Mixpanel
     */
    sendVitals() {
        try {
            // Only send if we have at least one metric
            const hasMetrics = Object.values(this.vitals).some(value => value !== null)
            if (!hasMetrics) {
                return
            }

            // Build vitals object with only tracked metrics
            const vitalsToSend = {}
            for (const [key, value] of Object.entries(this.vitals)) {
                if (value !== null) {
                    vitalsToSend[`core_web_vitals_${key.toLowerCase()}`] = value
                }
            }

            // Track as event
            mixpanel.track('Core Web Vitals', vitalsToSend)

            // Also update user properties
            mixpanel.people.set(vitalsToSend)
        } catch (error) {
            console.error('Failed to send Web Vitals:', error)
        }
    }

    /**
     * Get current vitals data
     */
    getVitals() {
        return { ...this.vitals }
    }

    /**
     * Get vitals as formatted string (for debugging)
     */
    formatVitals() {
        const formatted = []
        for (const [key, value] of Object.entries(this.vitals)) {
            if (value !== null) {
                formatted.push(`${key}: ${value}ms`)
            }
        }
        return formatted.join(', ')
    }
}

// Export singleton instance
const webVitalsService = new WebVitalsService()
export default webVitalsService
