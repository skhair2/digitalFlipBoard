import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import mixpanel from '../services/mixpanelService'
import { useAuthStore } from '../store/authStore'

export const useMixpanel = () => {
    const location = useLocation()
    const { user } = useAuthStore()

    // Track page views
    useEffect(() => {
        try {
            mixpanel.trackPageView(location.pathname, {
                path: location.pathname,
                search: location.search,
                hash: location.hash,
            })
        } catch (error) {
            console.warn('Failed to track page view:', error)
        }
    }, [location])

    // Track user sessions
    useEffect(() => {
        if (user?.id) {
            try {
                mixpanel.identify(user.id)
                // Small delay to prevent mutex contention
                setTimeout(() => {
                    try {
                        mixpanel.people.set({
                            $email: user.email,
                            $last_login: new Date().toISOString(),
                        })
                    } catch (error) {
                        console.warn('Failed to set user properties:', error)
                    }
                }, 100)
            } catch (error) {
                console.warn('Failed to identify user:', error)
            }
        }
    }, [user?.id, user?.email])

    return mixpanel
}
