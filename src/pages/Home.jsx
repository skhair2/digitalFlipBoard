import { useEffect } from 'react'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'
import HowItWorks from '../components/landing/HowItWorks'
import mixpanel from '../services/mixpanelService'

export default function Home() {
    useEffect(() => {
        mixpanel.track('Landing Page Viewed')
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <Hero />
            <Features />
            <HowItWorks />
        </div>
    )
}
