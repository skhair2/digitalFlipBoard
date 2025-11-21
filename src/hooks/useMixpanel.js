import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import mixpanel from '../services/mixpanelService'
import { useAuthStore } from '../store/authStore'

export const useMixpanel = () => {
    const location = useLocation()
    const { user } = useAuthStore()

    // Track page views
    useEffect(() => {
        mixpanel.trackPageView(location.pathname, {
            path: location.pathname,
            search: location.search,
            hash: location.hash,
        })
    }, [location])

    // Track user sessions
    useEffect(() => {
        if (user) {
            mixpanel.identify(user.id)
            mixpanel.people.set({
                $email: user.email,
                $last_login: new Date().toISOString(),
            })
        }
    }, [user])

    return mixpanel
}
