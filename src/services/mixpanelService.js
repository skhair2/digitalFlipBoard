import mixpanel from 'mixpanel-browser'

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN

class MixpanelService {
    constructor() {
        this.initialized = false
    }

    init() {
        if (this.initialized) return

        mixpanel.init(MIXPANEL_TOKEN, {
            debug: import.meta.env.DEV,
            track_pageview: true,
            persistence: 'localStorage',
            ignore_dnt: false,
            batch_requests: true,
            batch_size: 50,
            batch_flush_interval_ms: 5000,
        })

        this.initialized = true
        console.log('Mixpanel initialized')
    }

    // Identify user
    identify(userId) {
        if (!this.initialized) this.init()
        mixpanel.identify(userId)
    }

    // Set user properties
    people = {
        set: (properties) => {
            if (!this.initialized) this.init()
            mixpanel.people.set(properties)
        },
        increment: (property, value = 1) => {
            if (!this.initialized) this.init()
            mixpanel.people.increment(property, value)
        },
    }

    // Track events
    track(eventName, properties = {}) {
        if (!this.initialized) this.init()

        const enrichedProperties = {
            ...properties,
            timestamp: new Date().toISOString(),
            platform: 'web',
            user_agent: navigator.userAgent,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
        }

        mixpanel.track(eventName, enrichedProperties)
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
