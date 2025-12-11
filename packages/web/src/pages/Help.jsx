import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function Help() {
    const [activeSection, setActiveSection] = useState('getting-started')

    const sections = {
        'getting-started': {
            title: 'Getting Started',
            icon: '🚀',
            content: [
                {
                    question: 'How do I create my first display?',
                    answer: (
                        <div className="space-y-3">
                            <p>Getting started with FlipDisplay.online is easy:</p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Open the <Link to="/display" className="text-teal-400 hover:text-teal-300">Display page</Link> on the device you want to use as your board</li>
                                <li>Note the 6-character session code displayed on screen</li>
                                <li>On your phone or computer, go to the <Link to="/control" className="text-teal-400 hover:text-teal-300">Controller page</Link></li>
                                <li>Enter the session code and click "Connect Device"</li>
                                <li>Start sending messages!</li>
                            </ol>
                            <p className="text-yellow-400 text-sm">💡 Tip: For the best experience, use fullscreen mode on your display device.</p>
                        </div>
                    )
                },
                {
                    question: 'Do I need to create an account?',
                    answer: 'No account is required to try FlipDisplay.online! You get one free session without signing in. To unlock unlimited messages, message scheduling, and multiple boards, create a free account.'
                },
                {
                    question: 'What devices are supported?',
                    answer: 'FlipDisplay.online works on any device with a modern web browser—smartphones, tablets, computers, smart TVs, and even Raspberry Pi displays. No app installation required!'
                }
            ]
        },
        'features': {
            title: 'Features & Controls',
            icon: '⚙️',
            content: [
                {
                    question: 'How do I send a message?',
                    answer: (
                        <div className="space-y-3">
                            <p>From the Controller page:</p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Type your message in the text input (up to 132 characters)</li>
                                <li>Choose an animation style (flip, slide, fade, etc.)</li>
                                <li>Select a color theme</li>
                                <li>Click "Send Message"</li>
                            </ol>
                            <p>Your message will appear on the connected display with the chosen animation!</p>
                        </div>
                    )
                },
                {
                    question: 'What is Clock Mode?',
                    answer: 'Clock Mode turns your display into a digital clock showing the current time. Toggle it on from the Controller, and your display will automatically update every minute. Perfect for always-on displays!'
                },
                {
                    question: 'How do I schedule messages?',
                    answer: (
                        <div className="space-y-3">
                            <p>Message scheduling is available on the Pro plan:</p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Create a board from your Dashboard</li>
                                <li>Go to the "Schedule" tab in the Controller</li>
                                <li>Set the message, time, and recurrence pattern</li>
                                <li>Save your schedule</li>
                            </ol>
                            <p>Scheduled messages will display automatically at the specified times.</p>
                        </div>
                    )
                },
                {
                    question: 'What animations are available?',
                    answer: 'We offer several animation styles: Flip (classic split-flap), Slide (smooth horizontal), Fade (gentle transition), Instant (no animation), and more. Each animation can be customized with different color themes.'
                },
                {
                    question: 'How do I use fullscreen mode?',
                    answer: 'On the Display page, click the fullscreen button in the top-right corner. This hides the browser UI for a clean, distraction-free display. Press ESC to exit fullscreen.'
                }
            ]
        },
        'account': {
            title: 'Account & Billing',
            icon: '👤',
            content: [
                {
                    question: 'What\'s included in the free plan?',
                    answer: (
                        <div className="space-y-2">
                            <p>The free plan includes:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Unlimited messages</li>
                                <li>All animation styles</li>
                                <li>All color themes</li>
                                <li>One display board</li>
                                <li>Clock mode</li>
                                <li>Mobile control</li>
                            </ul>
                        </div>
                    )
                },
                {
                    question: 'What does the Pro plan offer?',
                    answer: (
                        <div className="space-y-2">
                            <p>Pro ($4.99/month) adds:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Message scheduling</li>
                                <li>Unlimited display boards</li>
                                <li>Custom branding</li>
                                <li>API access</li>
                                <li>Priority support</li>
                            </ul>
                            <p className="mt-3">
                                <Link to="/pricing" className="text-teal-400 hover:text-teal-300">View full pricing details →</Link>
                            </p>
                        </div>
                    )
                },
                {
                    question: 'How do I upgrade to Pro?',
                    answer: 'Log in to your account, go to your Dashboard, and click "Upgrade to Pro". You can start with a 14-day free trial—no credit card required!'
                },
                {
                    question: 'Can I cancel my subscription?',
                    answer: 'Yes, you can cancel anytime from your account settings. Your Pro features will remain active until the end of your billing period. No cancellation fees or questions asked.'
                },
                {
                    question: 'How do I delete my account?',
                    answer: 'Go to Account Settings → Privacy & Security → Delete Account. Your data will be permanently deleted within 30 days. This action cannot be undone.'
                }
            ]
        },
        'troubleshooting': {
            title: 'Troubleshooting',
            icon: '🔧',
            content: [
                {
                    question: 'The display isn\'t updating',
                    answer: (
                        <div className="space-y-3">
                            <p>Try these steps:</p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Check that both devices are connected to the internet</li>
                                <li>Verify you entered the correct session code</li>
                                <li>Refresh both the Display and Controller pages</li>
                                <li>Check if the display shows "Connected" status</li>
                                <li>Try creating a new session with a new code</li>
                            </ol>
                            <p>If issues persist, <Link to="/contact" className="text-teal-400 hover:text-teal-300">contact support</Link>.</p>
                        </div>
                    )
                },
                {
                    question: 'Messages are cut off or not displaying correctly',
                    answer: 'FlipDisplay.online displays 6 rows of 22 characters (132 total). Messages longer than this will be truncated. Try shortening your message or using abbreviations.'
                },
                {
                    question: 'Animations are laggy or slow',
                    answer: 'Performance depends on your device and browser. Try: closing other tabs, using a modern browser (Chrome, Firefox, Safari, Edge), reducing animation complexity, or using a more powerful device for the display.'
                },
                {
                    question: 'I forgot my password',
                    answer: 'Click "Forgot Password" on the login page. We\'ll send a password reset link to your email. Check your spam folder if you don\'t see it within a few minutes.'
                },
                {
                    question: 'The session code isn\'t working',
                    answer: 'Session codes are case-sensitive and expire after 24 hours of inactivity. Make sure you\'re entering the exact code shown on the Display page. If it still doesn\'t work, refresh the Display page to generate a new code.'
                }
            ]
        },
        'advanced': {
            title: 'Advanced Usage',
            icon: '🎓',
            content: [
                {
                    question: 'Can I use multiple displays?',
                    answer: 'Yes! With a Pro account, you can create unlimited boards from your Dashboard. Each board has its own session code and can be controlled independently.'
                },
                {
                    question: 'Is there an API?',
                    answer: 'Pro users have access to our REST API for programmatic control. Use it to integrate FlipDisplay.online with your own applications, IoT devices, or automation workflows. API documentation is available in your Dashboard.'
                },
                {
                    question: 'Can I embed displays on my website?',
                    answer: 'Yes! You can embed the Display page in an iframe on your website. Make sure to use the fullscreen parameter for the best appearance. Example: <code className="bg-slate-700 px-2 py-1 rounded">?fullscreen=true</code>'
                },
                {
                    question: 'How do I use it with a Raspberry Pi?',
                    answer: (
                        <div className="space-y-3">
                            <p>FlipDisplay.online works great on Raspberry Pi:</p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Install Raspberry Pi OS with desktop</li>
                                <li>Open Chromium browser in kiosk mode</li>
                                <li>Navigate to the Display page</li>
                                <li>Set to fullscreen and auto-start on boot</li>
                            </ol>
                            <p className="text-sm text-gray-400">Perfect for dedicated display installations!</p>
                        </div>
                    )
                },
                {
                    question: 'Can I customize the colors and fonts?',
                    answer: 'We offer several built-in color themes. Custom themes and fonts are planned for a future update. Pro users will get early access to customization features.'
                }
            ]
        }
    }

    return (
        <>
            <Helmet>
                <title>Help Center | FlipDisplay.online - Split-Flap Display Support & FAQs</title>
                <meta name="description" content="Find answers to common questions and learn how to get the most out of FlipDisplay.online. Complete guide to our digital split-flap display platform." />
            </Helmet>

            <div className="min-h-screen bg-slate-900 py-12 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Help Center</h1>
                        <p className="text-xl text-gray-400">
                            Everything you need to know about FlipDisplay.online
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1">
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700 p-4 sticky top-4">
                                <h2 className="text-lg font-bold text-white mb-4">Topics</h2>
                                <nav className="space-y-2">
                                    {Object.entries(sections).map(([key, section]) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveSection(key)}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeSection === key
                                                ? 'bg-teal-500 text-white'
                                                : 'text-gray-300 hover:bg-slate-700'
                                                }`}
                                        >
                                            <span className="mr-2">{section.icon}</span>
                                            {section.title}
                                        </button>
                                    ))}
                                </nav>

                                {/* Quick Contact */}
                                <div className="mt-8 pt-6 border-t border-slate-700">
                                    <p className="text-sm text-gray-400 mb-3">Still need help?</p>
                                    <Link
                                        to="/contact"
                                        className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-center rounded-lg transition-colors"
                                    >
                                        Contact Support
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3">
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700 p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="text-4xl">{sections[activeSection].icon}</span>
                                    <h2 className="text-3xl font-bold text-white">
                                        {sections[activeSection].title}
                                    </h2>
                                </div>

                                <div className="space-y-8">
                                    {sections[activeSection].content.map((item, index) => (
                                        <div key={index} className="pb-8 border-b border-slate-700 last:border-0 last:pb-0">
                                            <h3 className="text-xl font-semibold text-white mb-4">
                                                {item.question}
                                            </h3>
                                            <div className="text-gray-300 leading-relaxed">
                                                {typeof item.answer === 'string' ? (
                                                    <p>{item.answer}</p>
                                                ) : (
                                                    item.answer
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Resources */}
                            <div className="mt-8 grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700 p-6">
                                    <h3 className="text-xl font-bold text-white mb-3">📚 Documentation</h3>
                                    <p className="text-gray-300 mb-4">
                                        Detailed guides and API references for developers and power users.
                                    </p>
                                    <a href="#" className="text-teal-400 hover:text-teal-300">
                                        View Documentation →
                                    </a>
                                </div>
                                <div className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700 p-6">
                                    <h3 className="text-xl font-bold text-white mb-3">🎥 Video Tutorials</h3>
                                    <p className="text-gray-300 mb-4">
                                        Watch step-by-step video guides to master FlipDisplay.online.
                                    </p>
                                    <a href="#" className="text-teal-400 hover:text-teal-300">
                                        Watch Tutorials →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
