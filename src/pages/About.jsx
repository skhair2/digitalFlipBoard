import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'

export default function About() {
    return (
        <>
            <SEOHead page="about" />

            <div className="min-h-screen bg-slate-900">
                {/* Hero Section */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 py-20 px-4">
                    <div className="container mx-auto max-w-4xl text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            Bringing Nostalgia to the Digital Age
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                            FlipDisplay.online transforms any screen into a stunning split-flap message board,
                            combining retro aesthetics with modern technology.
                        </p>
                    </div>
                </div>

                {/* Mission Section */}
                <div className="py-16 px-4">
                    <div className="container mx-auto max-w-4xl">
                        <div className="bg-slate-800/30 backdrop-blur rounded-2xl p-8 md:p-12 border border-slate-700">
                            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                            <p className="text-lg text-gray-300 leading-relaxed mb-4">
                                We believe that communication should be both functional and beautiful. In an age of
                                endless notifications and digital noise, FlipDisplay.online offers a refreshing
                                alternative—a display that commands attention through elegance and simplicity.
                            </p>
                            <p className="text-lg text-gray-300 leading-relaxed">
                                Our mission is to make the iconic split-flap aesthetic accessible to everyone,
                                whether you're displaying messages at home, enhancing your office environment,
                                or creating engaging public displays.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Story Section */}
                <div className="py-16 px-4 bg-slate-800/20">
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Story</h2>
                        <div className="space-y-6 text-gray-300">
                            <p className="text-lg leading-relaxed">
                                FlipDisplay.online was born from a simple observation: the mesmerizing flip of
                                airport departure boards and train station displays captivated people in a way
                                that modern digital screens rarely do. There's something magical about watching
                                characters flip into place, one by one.
                            </p>
                            <p className="text-lg leading-relaxed">
                                We set out to recreate that magic in a web application that anyone could use.
                                What started as a passion project quickly evolved into a full-featured platform
                                that combines nostalgic aesthetics with modern capabilities like remote control,
                                message scheduling, and customizable animations.
                            </p>
                            <p className="text-lg leading-relaxed">
                                Today, FlipDisplay.online is used by thousands of people worldwide—from families
                                sharing daily messages at home, to businesses creating engaging office displays,
                                to artists exploring new forms of digital expression.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-16 px-4">
                    <div className="container mx-auto max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center">What Makes Us Different</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-6 border border-slate-700">
                                <div className="text-4xl mb-4">🎨</div>
                                <h3 className="text-xl font-bold text-white mb-3">Authentic Aesthetics</h3>
                                <p className="text-gray-300">
                                    Meticulously crafted animations that capture the mechanical beauty of
                                    classic split-flap displays, with smooth transitions and realistic physics.
                                </p>
                            </div>
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-6 border border-slate-700">
                                <div className="text-4xl mb-4">⚡</div>
                                <h3 className="text-xl font-bold text-white mb-3">Zero Setup Required</h3>
                                <p className="text-gray-300">
                                    No downloads, no installations, no hardware. Works instantly in any modern
                                    web browser on any device—from smartphones to 4K displays.
                                </p>
                            </div>
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-6 border border-slate-700">
                                <div className="text-4xl mb-4">🚀</div>
                                <h3 className="text-xl font-bold text-white mb-3">Modern Features</h3>
                                <p className="text-gray-300">
                                    Remote control, message scheduling, custom themes, multiple boards, and
                                    API access—all the power you need in a beautifully simple interface.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technology Section */}
                <div className="py-16 px-4 bg-slate-800/20">
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8 text-center">Built with Modern Technology</h2>
                        <div className="bg-slate-800/30 backdrop-blur rounded-2xl p-8 md:p-12 border border-slate-700">
                            <p className="text-lg text-gray-300 leading-relaxed mb-6">
                                FlipDisplay.online is built on a foundation of cutting-edge web technologies
                                to ensure reliability, performance, and security:
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-white font-semibold mb-2">Frontend</h4>
                                    <ul className="text-gray-300 space-y-1">
                                        <li>• React for responsive UI</li>
                                        <li>• Framer Motion for smooth animations</li>
                                        <li>• Tailwind CSS for modern styling</li>
                                        <li>• Vite for lightning-fast builds</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-2">Backend & Infrastructure</h4>
                                    <ul className="text-gray-300 space-y-1">
                                        <li>• Supabase for authentication & database</li>
                                        <li>• WebSocket for real-time updates</li>
                                        <li>• Edge computing for global performance</li>
                                        <li>• Enterprise-grade security</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Use Cases Section */}
                <div className="py-16 px-4">
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center">How People Use FlipDisplay.online</h2>
                        <div className="space-y-6">
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-2">🏠 Home & Family</h3>
                                <p className="text-gray-300">
                                    Daily messages, family calendars, motivational quotes, weather updates,
                                    and special occasion greetings that bring warmth to any living space.
                                </p>
                            </div>
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-2">💼 Business & Office</h3>
                                <p className="text-gray-300">
                                    Team announcements, meeting room schedules, KPI dashboards, visitor
                                    welcomes, and company updates that enhance workplace communication.
                                </p>
                            </div>
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-2">🎭 Events & Venues</h3>
                                <p className="text-gray-300">
                                    Event schedules, wayfinding, queue management, promotional messages,
                                    and interactive displays for cafes, galleries, and public spaces.
                                </p>
                            </div>
                            <div className="bg-slate-800/30 backdrop-blur rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-2">🎨 Creative Projects</h3>
                                <p className="text-gray-300">
                                    Art installations, live social media feeds, generative art, interactive
                                    experiences, and experimental digital displays.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Values Section */}
                <div className="py-16 px-4 bg-slate-800/20">
                    <div className="container mx-auto max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Values</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">Simplicity First</h3>
                                <p className="text-gray-300">
                                    We believe powerful tools should be easy to use. No manuals required,
                                    no complex setup—just beautiful displays in seconds.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">Privacy Matters</h3>
                                <p className="text-gray-300">
                                    Your data is yours. We collect only what's necessary, never sell your
                                    information, and give you full control over your content.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">Continuous Innovation</h3>
                                <p className="text-gray-300">
                                    We're constantly improving and adding features based on user feedback,
                                    while staying true to our core mission of beautiful simplicity.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">Accessible to All</h3>
                                <p className="text-gray-300">
                                    Everyone should experience the joy of split-flap displays. That's why
                                    we offer a generous free tier and affordable pricing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="py-20 px-4">
                    <div className="container mx-auto max-w-3xl text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to Create Your Display?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Join thousands of users bringing the magic of split-flap displays to their screens.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/control"
                                className="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/pricing"
                                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                            >
                                View Pricing
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
