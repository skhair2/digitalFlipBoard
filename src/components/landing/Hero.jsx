import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useMotionTemplate, useMotionValue } from 'framer-motion'
import { Button } from '../ui/Components'
import mixpanel from '../../services/mixpanelService'

const MagneticButton = ({ children, ...props }) => {
    const ref = useRef(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e
        const { left, top, width, height } = ref.current.getBoundingClientRect()
        const center = { x: left + width / 2, y: top + height / 2 }
        x.set((clientX - center.x) * 0.35)
        y.set((clientY - center.y) * 0.35)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            <Button {...props}>{children}</Button>
        </motion.div>
    )
}

export default function Hero() {
    const navigate = useNavigate()
    const { scrollY } = useScroll()
    const y1 = useTransform(scrollY, [0, 500], [0, 200])
    const y2 = useTransform(scrollY, [0, 500], [0, -150])

    return (
        <section className="relative overflow-hidden py-20 lg:py-32 min-h-[90vh] flex items-center">
            {/* Aurora Background */}
            <div className="absolute inset-0 bg-slate-950">
                <div className="absolute inset-0 opacity-30 blur-3xl animate-aurora bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.15),transparent_50%),radial-gradient(circle_at_0%_0%,rgba(168,85,247,0.15),transparent_50%)] bg-[length:120%_120%]" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-20" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Copy */}
                    <motion.div style={{ y: y1 }}>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
                        >
                            The Virtual
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-400 bg-[length:200%_auto] animate-gradient">
                                Split-Flap Display
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="text-xl text-gray-300 mb-8 leading-relaxed max-w-lg"
                        >
                            Transform any screen into a stunning retro message board.
                            Control from your phone, display on your TV.
                            <span className="block mt-2 text-teal-400 font-semibold">No App Download Needed. No Hardware Required.</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            className="flex flex-col sm:flex-row gap-4 mb-8"
                        >
                            <MagneticButton
                                size="lg"
                                variant="primary"
                                onClick={() => navigate('/display')}
                                className="text-lg px-8 py-4 shadow-[0_0_30px_-5px_rgba(45,212,191,0.4)] hover:shadow-[0_0_40px_-5px_rgba(45,212,191,0.6)] transition-shadow"
                            >
                                Launch Display ✨
                            </MagneticButton>
                            <MagneticButton
                                size="lg"
                                variant="outline"
                                onClick={() => navigate('/control')}
                                className="text-lg px-8 py-4 backdrop-blur-sm"
                            >
                                Open Controller 📱
                            </MagneticButton>
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="flex items-center gap-6 text-sm text-gray-400"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">⭐⭐⭐⭐⭐</span>
                                <span>4.9/5 rating</span>
                            </div>
                            <div className="h-4 w-px bg-gray-600" />
                            <span>10,000+ displays created</span>
                        </motion.div>
                    </motion.div>

                    {/* Right: Animated Preview */}
                    <motion.div
                        style={{ y: y2 }}
                        initial={{ opacity: 0, scale: 0.8, rotateX: 20, rotateY: -20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
                        transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
                        className="relative perspective-1000"
                    >
                        <motion.div
                            whileHover={{ scale: 1.02, rotateX: 5, rotateY: -5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-700/50 bg-slate-900 aspect-video flex items-center justify-center group"
                        >
                            {/* Screen Glare */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-10" />

                            <span className="text-6xl group-hover:scale-110 transition-transform duration-500">📟</span>

                            {/* Reflection */}
                            <div className="absolute -bottom-full left-0 right-0 h-full bg-gradient-to-t from-teal-500/10 to-transparent opacity-20 blur-2xl" />
                        </motion.div>

                        {/* Floating Elements */}
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -right-6 bg-slate-800/90 backdrop-blur border border-slate-700 text-teal-400 px-6 py-3 rounded-xl font-semibold shadow-xl"
                        >
                            Free Forever
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-6 -left-6 bg-slate-800/90 backdrop-blur border border-slate-700 text-purple-400 px-6 py-3 rounded-xl font-semibold shadow-xl"
                        >
                            No Hardware
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
