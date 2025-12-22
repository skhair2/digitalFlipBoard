import { useSessionStore } from '../../store/sessionStore'
import { motion } from 'framer-motion'
import { 
    ArrowPathIcon, 
    SparklesIcon, 
    ChevronDoubleUpIcon, 
    CommandLineIcon 
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const ANIMATIONS = [
    { id: 'flip', label: 'Classic Flip', icon: ArrowPathIcon, desc: 'Mechanical split-flap' },
    { id: 'fade', label: 'Soft Fade', icon: SparklesIcon, desc: 'Smooth pixel transition' },
    { id: 'slide', label: 'Slide Up', icon: ChevronDoubleUpIcon, desc: 'Vertical scrolling' },
    { id: 'typewriter', label: 'Typewriter', icon: CommandLineIcon, desc: 'Character by character' },
]

export default function AnimationPicker() {
    const { lastAnimationType, setPreferences } = useSessionStore()

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ANIMATIONS.map((anim) => (
                <button
                    key={anim.id}
                    onClick={() => setPreferences(anim.id, null)}
                    className={clsx(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                        lastAnimationType === anim.id
                            ? "bg-teal-500/10 border-teal-500 shadow-lg shadow-teal-500/10"
                            : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800"
                    )}
                >
                    {/* Active Indicator */}
                    {lastAnimationType === anim.id && (
                        <motion.div 
                            layoutId="active-anim"
                            className="absolute inset-0 bg-teal-500/5 pointer-events-none"
                        />
                    )}

                    <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        lastAnimationType === anim.id ? "bg-teal-500 text-white" : "bg-slate-800 text-slate-600 group-hover:text-slate-400"
                    )}>
                        <anim.icon className="w-6 h-6" />
                    </div>

                    <div>
                        <p className={clsx(
                            "text-xs font-black uppercase tracking-widest",
                            lastAnimationType === anim.id ? "text-white" : "text-slate-400"
                        )}>
                            {anim.label}
                        </p>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight mt-0.5">
                            {anim.desc}
                        </p>
                    </div>

                    {lastAnimationType === anim.id && (
                        <div className="ml-auto">
                            <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    )
}
