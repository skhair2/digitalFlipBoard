import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Components'
import { useAuthStore } from '../store/authStore'

export function Pricing() {
    const { user, isPremium } = useAuthStore()

    return (
        <div className="min-h-screen bg-slate-900 py-20 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-gray-400">Start for free, upgrade for power.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-white mb-2">Personal</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-gray-400">/forever</span>
                            </div>
                            <p className="text-gray-400 mt-4">Perfect for home use and testing.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['Unlimited Messages', 'Basic Color Themes', 'Standard Animations', '1 Display Board', 'Mobile Control'].map((feature) => (
                                <li key={feature} className="flex items-center gap-3 text-gray-300">
                                    <span className="text-teal-400">✓</span> {feature}
                                </li>
                            ))}
                        </ul>
                        <Button
                            variant="outline"
                            className="w-full py-3"
                            disabled={user && !isPremium}
                        >
                            {user && !isPremium ? 'Current Plan' : 'Get Started Free'}
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 border border-teal-500/30 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$4.99</span>
                                <span className="text-gray-400">/month</span>
                            </div>
                            <p className="text-gray-400 mt-4">For offices, cafes, and power users.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['Everything in Personal', 'Scheduled Messages', 'Custom Branding', 'Unlimited Displays', 'API Access', 'Priority Support'].map((feature) => (
                                <li key={feature} className="flex items-center gap-3 text-white">
                                    <span className="text-teal-400">✓</span> {feature}
                                </li>
                            ))}
                        </ul>
                        <Button
                            variant="primary"
                            className="w-full py-3"
                            disabled={isPremium}
                        >
                            {isPremium ? 'Current Plan' : 'Start 14-Day Trial'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Blog() {
    return (
        <div className="container mx-auto px-4 py-20 text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-gray-400">Latest news and updates coming soon.</p>
        </div>
    )
}

export function BlogPost() {
    return (
        <div className="container mx-auto px-4 py-20 text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Blog Post</h1>
        </div>
    )
}





export function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
            <h1 className="text-6xl font-bold mb-4 text-teal-500">404</h1>
            <h2 className="text-2xl font-bold mb-8">Page Not Found</h2>
            <p className="text-gray-400 mb-8 text-center max-w-md">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
            <Link to="/" className="px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-bold transition-colors">
                Go Home
            </Link>
        </div>
    )
}
