import mixpanel from 'mixpanel-browser'

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN

class MixpanelService {
    constructor() {
        this.initialized = false
    }

    init() {
        if (this.initialized) return

        try {
            mixpanel.init(MIXPANEL_TOKEN, {
                debug: import.meta.env.DEV,
                track_pageview: false,
                ignore_dnt: false, // Respect browser "Do Not Track" settings
                batch_requests: true,
                batch_size: 50,
                batch_flush_interval_ms: 5000,
            })

            this.initialized = true
            console.log('Mixpanel initialized')
        } catch (error) {
            console.warn('Mixpanel initialization failed:', error)
            this.initialized = true
        }
    }

    // Identify user
    identify(userId) {
        if (!this.initialized) this.init()
        try {
            mixpanel.identify(userId)
        } catch (error) {
            console.warn('Mixpanel identify failed:', error)
        }
    }

    // Set user properties
    people = {
        set: (properties) => {
            if (!this.initialized) this.init()
            try {
                mixpanel.people.set(properties)
            } catch (error) {
                console.warn('Mixpanel people.set failed:', error)
            }
        },
        increment: (property, value = 1) => {
            if (!this.initialized) this.init()
            try {
                mixpanel.people.increment(property, value)
            } catch (error) {
                console.warn('Mixpanel people.increment failed:', error)
            }
        },
    }

    // Track events
    track(eventName, properties = {}) {
        if (!this.initialized) this.init()

        try {
            const enrichedProperties = {
                ...properties,
                timestamp: new Date().toISOString(),
                platform: 'web',
                user_agent: navigator.userAgent,
                screen_width: window.screen.width,
                screen_height: window.screen.height,
            }

            mixpanel.track(eventName, enrichedProperties)
        } catch (error) {
            console.warn('Mixpanel track failed:', error)
        }
    }

    // Track page views
    trackPageView(pageName, properties = {}) {
        this.track('Page View', {
            page: pageName,
            url: window.location.href,
            ...properties,
        })
    }

    // Reset (on logout)
    reset() {
        if (!this.initialized) return
        mixpanel.reset()
    }

    // Time events (for tracking duration)
    time(eventName) {
        if (!this.initialized) this.init()
        mixpanel.time_event(eventName)
    }
}

export default new MixpanelService()
