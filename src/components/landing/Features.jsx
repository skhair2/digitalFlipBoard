import { useRef } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import {
    SparklesIcon,
    DevicePhoneMobileIcon,
    CloudIcon,
    PaintBrushIcon,
    BoltIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const features = [
    {
        icon: SparklesIcon,
        title: 'Nostalgic Aesthetic',
        description: 'Captivate your audience with authentic split-flap animations and satisfying mechanical sounds.',
        color: 'from-yellow-500 to-orange-500',
        className: 'md:col-span-2'
    },
    {
        icon: DevicePhoneMobileIcon,
        title: 'Instant Mobile Control',
        description: 'Update your board instantly from any phone. No apps to install, just scan and type.',
        color: 'from-teal-500 to-cyan-500',
        className: 'md:col-span-1'
    },
    {
        icon: CloudIcon,
        title: 'Zero Hardware Cost',
        description: 'Why pay $3,000+ for a physical board? Use the TV or monitor you already own.',
        color: 'from-purple-500 to-pink-500',
        className: 'md:col-span-1'
    },
    {
        icon: PaintBrushIcon,
        title: 'Customizable Themes',
        description: 'Match your brand or mood with unlimited color combinations and layouts.',
        color: 'from-rose-500 to-red-500',
        className: 'md:col-span-2'
    },
    {
        icon: BoltIcon,
        title: 'Real-Time Sync',
        description: 'Messages update across all screens in milliseconds. Perfect for live events and offices.',
        color: 'from-blue-500 to-indigo-500',
        className: 'md:col-span-1'
    },
    {
        icon: ShieldCheckIcon,
        title: 'Secure & Private',
        description: 'Enterprise-grade encryption ensures your messages are only seen by your audience.',
        color: 'from-green-500 to-emerald-500',
        className: 'md:col-span-2'
    }
]

function FeatureCard({ feature, index }) {
    const ref = useRef(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onMouseMove={handleMouseMove}
            className={clsx(
                "group relative rounded-3xl border border-slate-800 bg-slate-900/50 p-8 overflow-hidden",
                feature.className
            )}
        >
            {/* Spotlight Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(45, 212, 191, 0.15),
                            transparent 80%
                        )
                    `
                }}
            />

            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-2.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-full h-full text-white" />
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
            </h3>

            <p className="text-gray-400 leading-relaxed">
                {feature.description}
            </p>
        </motion.div>
    )
}

export default function Features() {
    return (
        <section className="py-32 bg-slate-950 relative">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl lg:text-5xl font-bold text-white mb-6"
                    >
                        Everything You Need
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        Powerful features wrapped in a simple, beautiful interface
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <FeatureCard key={feature.title} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    )
}
