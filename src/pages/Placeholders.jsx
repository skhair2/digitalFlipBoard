import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Components'

export function Pricing() {
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
                        <Button variant="outline" className="w-full py-3">Get Started Free</Button>
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
                        <Button variant="primary" className="w-full py-3">Start 14-Day Trial</Button>
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

export function Privacy() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-3xl text-gray-300">
            <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
            <div className="space-y-6">
                <p>Last updated: November 20, 2025</p>
                <p>At Digital Flipboard, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our application.</p>
                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Information We Collect</h2>
                <p>We collect information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.</p>
                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Use of Your Information</h2>
                <p>We use the information we collect or receive to communicate with you, provide you with services, and improve our application.</p>
            </div>
        </div>
    )
}

export function Terms() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-3xl text-gray-300">
            <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
            <div className="space-y-6">
                <p>Last updated: November 20, 2025</p>
                <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Digital Flipboard website and application operated by us.</p>
                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Acceptance of Terms</h2>
                <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>
                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Accounts</h2>
                <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            </div>
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
