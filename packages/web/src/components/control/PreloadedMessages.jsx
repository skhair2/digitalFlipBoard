import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button, Card } from '../ui/Components'
import clsx from 'clsx'

const PRELOADED_MESSAGES = [
    { id: 1, text: 'WELCOME HOME', category: 'Greeting' },
    { id: 2, text: 'MEETING IN 5', category: 'Work' },
    { id: 3, text: 'LUNCH TIME', category: 'Work' },
    { id: 4, text: 'DO NOT DISTURB', category: 'Work' },
    { id: 5, text: 'HAPPY BIRTHDAY', category: 'Celebration' },
    { id: 6, text: 'COFFEE BREAK', category: 'Work' },
]

export default function PreloadedMessages({ onSelect }) {
    const { user } = useAuthStore()
    const [selectedId, setSelectedId] = useState(null)

    const handleSelect = (msg) => {
        setSelectedId(msg.id)
        onSelect(msg.text)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Quick Messages</h3>
                {!user && (
                    <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">
                        Sign in for custom
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {PRELOADED_MESSAGES.map((msg) => (
                    <button
                        key={msg.id}
                        onClick={() => handleSelect(msg)}
                        className={clsx(
                            "p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            selectedId === msg.id
                                ? "bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-500/20"
                                : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                        )}
                    >
                        {msg.text}
                    </button>
                ))}
            </div>
        </div>
    )
}
