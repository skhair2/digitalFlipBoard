import { motion } from 'framer-motion'

const steps = [
    {
        number: '01',
        title: 'Open Display',
        description: 'Launch the display page on your TV or laptop in fullscreen mode.',
    },
    {
        number: '02',
        title: 'Get Your Code',
        description: 'A unique 6-digit session code will appear on your display.',
    },
    {
        number: '03',
        title: 'Connect Phone',
        description: 'Open the controller on your mobile and enter the session code.',
    },
    {
        number: '04',
        title: 'Start Messaging',
        description: 'Type your message, choose animation and colors, then send!',
    },
]

export default function HowItWorks() {
    return (
        <section className="py-32 bg-[#0B0C10] relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-32">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl lg:text-7xl font-black text-white mb-8 tracking-tight"
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
                                <div className="hidden lg:block absolute left-1/2 top-full h-32 w-px bg-gradient-to-b from-teal-500/30 to-transparent -translate-x-1/2 z-0" />
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className={`grid lg:grid-cols-2 gap-16 items-center mb-32 last:mb-0 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                                    }`}
                            >
                                <div className={`relative z-10 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                                    <div className="flex items-center gap-6 mb-8">
                                        <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-500/20 to-purple-500/20">
                                            {step.number}
                                        </span>
                                        <h3 className="text-4xl font-bold text-white">
                                            {step.title}
                                        </h3>
                                    </div>
                                    <p className="text-xl text-gray-400 leading-relaxed max-w-md">
                                        {step.description}
                                    </p>
                                </div>

                                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                                    <motion.div
                                        whileHover={{ scale: 1.02, rotate: index % 2 === 0 ? 2 : -2 }}
                                        className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-[#15161A] aspect-video flex items-center justify-center group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <span className="text-7xl text-gray-700 group-hover:text-white transition-colors duration-500 transform group-hover:scale-110">
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
