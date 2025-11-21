import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button, Card } from '../ui/Components'
import { useSessionStore } from '../../store/sessionStore'

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
        <Card className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Quick Messages</h3>
                {!user && (
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                        Sign in to save custom
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {PRELOADED_MESSAGES.map((msg) => (
                    <button
                        key={msg.id}
                        onClick={() => handleSelect(msg)}
                        className={`
                            p-3 rounded-lg text-sm font-medium transition-all
                            ${selectedId === msg.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }
                        `}
                    >
                        {msg.text}
                    </button>
                ))}
            </div>
        </Card>
    )
}
