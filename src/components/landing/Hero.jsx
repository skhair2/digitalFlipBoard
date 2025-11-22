import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion'
import { Button } from '../ui/Components'
import DigitalFlipBoardGrid from '../display/DigitalFlipBoardGrid'

// Lazy load Scene3D to improve initial page load performance
const Scene3D = lazy(() => import('./Scene3D'))

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
    const y2 = useTransform(scrollY, [0, 500], [0, -150])
    const [heroMessage, setHeroMessage] = useState("FLIPDISPLAY.ONLINE")

    useEffect(() => {
        const messages = [
            "FLIPDISPLAY.ONLINE",
            "ANY SCREEN. ANYWHERE",
            "CONTROL FROM PHONE",
            "NO HARDWARE NEEDED",
            "RETRO MAGIC. DIGITAL"
        ]
        let index = 0
        const interval = setInterval(() => {
            index = (index + 1) % messages.length
            setHeroMessage(messages[index])
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative overflow-hidden py-32 lg:py-48 min-h-screen flex items-center bg-[#0B0C10]">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            {/* 3D Scene Background */}
            <div className="absolute inset-0 opacity-60">
                <Suspense fallback={null}>
                    <Scene3D />
                </Suspense>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col items-center text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-4xl mx-auto"
                    >
                        <h1 className="text-6xl lg:text-8xl font-black text-white mb-8 tracking-tight leading-[1.1]">
                            The Virtual
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-purple-400 animate-gradient bg-[length:200%_auto]">
                                Split-Flap Display
                            </span>
                        </h1>

                        <p className="text-xl lg:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Transform any screen into a stunning retro message board.
                            <span className="block mt-2 text-white font-medium">No Hardware. No App. Just Magic.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <MagneticButton
                                size="lg"
                                variant="primary"
                                onClick={() => navigate('/display')}
                                className="text-lg px-10 py-5 rounded-full shadow-[0_0_40px_-10px_rgba(45,212,191,0.5)] hover:shadow-[0_0_60px_-10px_rgba(45,212,191,0.7)] transition-shadow"
                            >
                                Launch Display
                            </MagneticButton>
                            <MagneticButton
                                size="lg"
                                variant="outline"
                                onClick={() => navigate('/control')}
                                className="text-lg px-10 py-5 rounded-full border-white/20 hover:bg-white/5 backdrop-blur-sm"
                            >
                                Open Controller
                            </MagneticButton>
                        </div>
                    </motion.div>
                </div>

                {/* 3D Preview Stage - Simplified without emoji */}
                <motion.div
                    style={{ y: y2 }}
                    initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ duration: 1.2, delay: 0.2, type: "spring" }}
                    className="relative max-w-5xl mx-auto perspective-1000"
                >
                    <div className="relative rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] border border-white/10 bg-[#15161A] aspect-[16/9] group flex items-center justify-center">
                        {/* Screen Content with gradient */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1c23,transparent)]" />

                        <div className="relative z-10 scale-[0.6] md:scale-[0.8] lg:scale-100 transition-transform duration-500">
                            <DigitalFlipBoardGrid overrideMessage={heroMessage} />
                        </div>

                        {/* Glass Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />

                        {/* Floating UI Elements */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-12 right-12 glass-panel px-6 py-3 rounded-2xl text-teal-300 font-bold text-sm tracking-wide uppercase"
                        >
                            Live Sync
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute bottom-12 left-12 glass-panel px-6 py-3 rounded-2xl text-purple-300 font-bold text-sm tracking-wide uppercase"
                        >
                            Zero Latency
                        </motion.div>
                    </div>

                    {/* Floor Reflection */}
                    <div className="absolute -bottom-20 left-10 right-10 h-20 bg-gradient-to-b from-teal-500/20 to-transparent blur-3xl opacity-30" />
                </motion.div>
            </div>
        </section>
    )
}
