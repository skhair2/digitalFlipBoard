import { StarIcon } from '@heroicons/react/24/solid'

const stats = [
    { label: 'Active Displays', value: '5,000+' },
    { label: 'Messages Sent', value: '1M+' },
    { label: 'Uptime', value: '99.9%' },
]

const testimonials = [
    {
        quote: "We replaced our $10k lobby sign with a $300 TV and FlipDisplay. The reaction from visitors is priceless.",
        author: "Sarah Jenkins",
        role: "Office Manager, TechFlow",
        rating: 5
    },
    {
        quote: "Finally, a digital signage solution that doesn't require a PhD to set up. It just works.",
        author: "Mike Ross",
        role: "Event Director, Elevate Conf",
        rating: 5
    },
    {
        quote: "The retro aesthetic fits our coffee shop perfectly. Customers love sending messages to the board.",
        author: "Elena Rodriguez",
        role: "Owner, Bean & Brew",
        rating: 5
    }
]

export default function SocialProof() {
    return (
        <section className="py-20 bg-slate-900/50 border-y border-white/5">
            <div className="container mx-auto px-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-20 border-b border-white/5 pb-12">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-slate-400 font-medium uppercase tracking-widest text-sm">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Testimonials */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Trusted by Modern Teams</h2>
                    <p className="text-slate-400">Join thousands of businesses transforming their spaces.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((item, index) => (
                        <div
                            key={index}
                            className="bg-slate-800/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm"
                        >
                            <div className="flex gap-1 text-yellow-500 mb-4">
                                {[...Array(item.rating)].map((_, i) => (
                                    <StarIcon key={i} className="w-5 h-5" />
                                ))}
                            </div>
                            <p className="text-slate-300 mb-6 leading-relaxed">"{item.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {item.author.charAt(0)}
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-semibold text-sm">{item.author}</div>
                                    <div className="text-slate-500 text-xs">{item.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
