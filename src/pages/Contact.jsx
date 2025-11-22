import { useState } from 'react'
import SEOHead from '../components/SEOHead'
import { Button, Input, Card } from '../components/ui/Components'

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [status, setStatus] = useState({ type: '', message: '' })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus({ type: 'loading', message: 'Sending...' })

        // Simulate form submission
        setTimeout(() => {
            setStatus({
                type: 'success',
                message: 'Thank you for contacting us! We\'ll get back to you within 24 hours.'
            })
            setFormData({ name: '', email: '', subject: '', message: '' })
        }, 1000)
    }

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    return (
        <>
            <SEOHead page="contact" />

            <div className="min-h-screen bg-slate-900 py-12 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h1>
                        <p className="text-xl text-gray-400">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <Card className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                                Name *
                                            </label>
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                                Email *
                                            </label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                                            Subject *
                                        </label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows="6"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Tell us more about your question or feedback..."
                                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                    </div>

                                    {status.message && (
                                        <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-500/20 text-green-400' :
                                            status.type === 'error' ? 'bg-red-500/20 text-red-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {status.message}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={status.type === 'loading'}
                                    >
                                        {status.type === 'loading' ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </form>
                            </Card>
                        </div>

                        {/* Contact Info & FAQ */}
                        <div className="space-y-6">
                            {/* Contact Information */}
                            <Card className="p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                                <div className="space-y-4 text-gray-300">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-teal-400">📧</span>
                                            <span className="font-semibold text-white">Email</span>
                                        </div>
                                        <a href="mailto:support@flipdisplay.online" className="text-teal-400 hover:text-teal-300">
                                            support@flipdisplay.online
                                        </a>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-teal-400">⏰</span>
                                            <span className="font-semibold text-white">Response Time</span>
                                        </div>
                                        <p className="text-sm">Usually within 24 hours</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-teal-400">💬</span>
                                            <span className="font-semibold text-white">Support Hours</span>
                                        </div>
                                        <p className="text-sm">Monday - Friday, 9AM - 6PM EST</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Quick Links */}
                            <Card className="p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
                                <div className="space-y-3">
                                    <a href="/help" className="block text-teal-400 hover:text-teal-300">
                                        📚 Help Center & Documentation
                                    </a>
                                    <a href="/pricing" className="block text-teal-400 hover:text-teal-300">
                                        💰 Pricing & Plans
                                    </a>
                                    <a href="/privacy" className="block text-teal-400 hover:text-teal-300">
                                        🔒 Privacy Policy
                                    </a>
                                    <a href="/terms" className="block text-teal-400 hover:text-teal-300">
                                        📄 Terms of Service
                                    </a>
                                </div>
                            </Card>

                            {/* FAQ Preview */}
                            <Card className="p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Common Questions</h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-white mb-1">Is there a free plan?</p>
                                        <p className="text-gray-300">Yes! We offer a free plan with unlimited messages and basic features.</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">Can I use it on any device?</p>
                                        <p className="text-gray-300">Absolutely! Works on any device with a modern web browser.</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">How do I cancel my subscription?</p>
                                        <p className="text-gray-300">You can cancel anytime from your account settings. No questions asked.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
