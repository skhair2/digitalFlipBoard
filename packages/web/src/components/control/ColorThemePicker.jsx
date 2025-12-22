import { useSessionStore } from '../../store/sessionStore'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const THEMES = [
    { id: 'monochrome', label: 'Classic', colors: ['bg-slate-950', 'bg-white'] },
    { id: 'teal', label: 'Cyber Teal', colors: ['bg-slate-950', 'bg-teal-500'] },
    { id: 'vintage', label: 'Vintage', colors: ['bg-amber-950', 'bg-amber-200'] },
    { id: 'neon', label: 'Neon Pulse', colors: ['bg-slate-950', 'bg-pink-500', 'bg-cyan-500'] },
    { id: 'matrix', label: 'Matrix', colors: ['bg-black', 'bg-green-500'] },
    { id: 'sunset', label: 'Sunset', colors: ['bg-orange-600', 'bg-purple-900'] },
]

export default function ColorThemePicker() {
    const { lastColorTheme, setPreferences } = useSessionStore()

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => setPreferences(null, theme.id)}
                    className={clsx(
                        "group relative aspect-square rounded-2xl border-2 transition-all overflow-hidden",
                        lastColorTheme === theme.id
                            ? "border-teal-500 scale-105 shadow-xl shadow-teal-500/20"
                            : "border-slate-800 hover:border-slate-600 bg-slate-900/50"
                    )}
                >
                    {/* Theme Preview */}
                    <div className="absolute inset-0 flex flex-col rotate-12 scale-150 opacity-40 group-hover:opacity-60 transition-opacity">
                        {theme.colors.map((color, i) => (
                            <div key={i} className={clsx("flex-1", color)} />
                        ))}
                    </div>

                    {/* Label Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent">
                        <span className={clsx(
                            "text-[9px] font-black uppercase tracking-widest text-center",
                            lastColorTheme === theme.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}>
                            {theme.label}
                        </span>
                    </div>

                    {/* Active Dot */}
                    {lastColorTheme === theme.id && (
                        <div className="absolute top-2 right-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    )
}
