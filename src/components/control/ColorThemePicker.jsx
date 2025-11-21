import { useSessionStore } from '../../store/sessionStore'
import clsx from 'clsx'

const THEMES = [
    { id: 'monochrome', label: 'Classic', colors: ['bg-slate-900', 'bg-white'] },
    { id: 'rainbow', label: 'Rainbow', colors: ['bg-red-500', 'bg-blue-500', 'bg-yellow-500'] },
    { id: 'neon', label: 'Neon', colors: ['bg-pink-500', 'bg-cyan-500'] },
    { id: 'corporate', label: 'Corporate', colors: ['bg-blue-800', 'bg-gray-200'] },
]

export default function ColorThemePicker() {
    const { lastColorTheme, setPreferences } = useSessionStore()

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Color Theme</h3>
            <div className="grid grid-cols-4 gap-3">
                {THEMES.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => setPreferences(null, theme.id)}
                        className={clsx(
                            "group relative aspect-square rounded-xl border-2 transition-all overflow-hidden",
                            lastColorTheme === theme.id
                                ? "border-teal-500 scale-105 shadow-lg shadow-teal-500/20"
                                : "border-slate-700 hover:border-slate-500"
                        )}
                    >
                        <div className="absolute inset-0 flex flex-col">
                            {theme.colors.map((color, i) => (
                                <div key={i} className={clsx("flex-1", color)} />
                            ))}
                        </div>
                        <span className="sr-only">{theme.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
