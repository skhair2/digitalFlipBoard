import { useSessionStore } from '../../store/sessionStore'
import clsx from 'clsx'

const ANIMATIONS = [
    { id: 'flip', label: 'Classic Flip', icon: '🔄' },
    { id: 'fade', label: 'Soft Fade', icon: '✨' },
    { id: 'slide', label: 'Slide Up', icon: '⬆️' },
    { id: 'typewriter', label: 'Typewriter', icon: '⌨️' },
]

export default function AnimationPicker() {
    const { lastAnimationType, setPreferences } = useSessionStore()

    return (
        <div className="grid grid-cols-2 gap-3">
            {ANIMATIONS.map((anim) => (
                <button
                    key={anim.id}
                    onClick={() => setPreferences(anim.id, null)}
                    className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        lastAnimationType === anim.id
                            ? "bg-teal-500/20 border-teal-500 text-white"
                            : "bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700"
                    )}
                >
                    <span className="text-xl">{anim.icon}</span>
                    <span className="font-medium">{anim.label}</span>
                </button>
            ))}
        </div>
    )
}
