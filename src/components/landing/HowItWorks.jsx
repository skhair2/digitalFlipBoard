import { motion } from 'framer-motion'

const steps = [
    {
        number: '01',
        title: 'Open Display',
        description: 'Launch the display page on your TV or laptop in fullscreen mode',
    },
    {
        number: '02',
        title: 'Get Your Code',
        description: 'A unique 6-digit session code will appear on your display',
    },
    {
        number: '03',
        title: 'Connect Phone',
        description: 'Open the controller on your mobile and enter the session code',
    },
    {
        number: '04',
        title: 'Start Messaging',
        description: 'Type your message, choose animation and colors, then send!',
    },
]

export default function HowItWorks() {
    return (
        <section className="py-32 bg-slate-900 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl lg:text-5xl font-bold text-white mb-6"
                    >
                        How It Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400"
                    >
                        Get started in under 60 seconds
                    </motion.p>
                </div>

                <div className="max-w-6xl mx-auto">
                    {steps.map((step, index) => (
                        <div key={step.number} className="relative">
                            {/* Connecting Line */}
                            {index !== steps.length - 1 && (
                                <div className="hidden lg:block absolute left-1/2 top-full h-24 w-px bg-gradient-to-b from-teal-500/50 to-transparent -translate-x-1/2 z-0" />
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className={`grid lg:grid-cols-2 gap-12 items-center mb-24 last:mb-0 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                                    }`}
                            >
                                <div className={`relative z-10 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300 opacity-50">
                                            {step.number}
                                        </span>
                                        <h3 className="text-3xl font-bold text-white">
                                            {step.title}
                                        </h3>
                                    </div>
                                    <p className="text-lg text-gray-400 leading-relaxed max-w-md">
                                        {step.description}
                                    </p>
                                </div>

                                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 aspect-video bg-slate-950 flex items-center justify-center group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <span className="text-5xl text-gray-700 group-hover:text-teal-400 transition-colors duration-300">
                                            {index === 0 ? '📺' : index === 1 ? '🔢' : index === 2 ? '📱' : '✨'}
                                        </span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
