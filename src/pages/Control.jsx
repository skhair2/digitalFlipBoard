import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SessionPairing from '../components/control/SessionPairing'
import MessageInput from '../components/control/MessageInput'
import PreloadedMessages from '../components/control/PreloadedMessages'
import AnimationPicker from '../components/control/AnimationPicker'
import ColorThemePicker from '../components/control/ColorThemePicker'
import Scheduler from '../components/control/Scheduler'
import { useSessionStore } from '../store/sessionStore'
import mixpanel from '../services/mixpanelService'
import { Tab } from '@headlessui/react'
import { clsx } from 'clsx'

export default function Control() {
    const { sessionCode, isConnected, setSessionCode, setConnected, setBoardId, isClockMode, setClockMode } = useSessionStore()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [message, setMessage] = useState('')

    // Check for boardId in URL
    useEffect(() => {
        const boardId = searchParams.get('boardId')
        if (boardId) {
            setBoardId(boardId)
            setSessionCode(boardId) // Use boardId as session code for now
            setConnected(true) // Assume connected for managed boards
        }
    }, [searchParams, setBoardId, setSessionCode, setConnected])

    useEffect(() => {
        mixpanel.track('Control Page Viewed')
    }, [])

    if (!sessionCode && !searchParams.get('boardId')) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <SessionPairing />
            </div>
        )
    }

    const tabs = [
        {
            name: 'Control', component: (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-white">Animation Style</h2>
                        <AnimationPicker />
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🕰️</span>
                                <div>
                                    <h3 className="font-semibold text-white">Clock Mode</h3>
                                    <p className="text-xs text-gray-400">Display current time</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setClockMode(!isClockMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isClockMode ? 'bg-teal-500' : 'bg-slate-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isClockMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <ColorThemePicker />
                    </section>

                    <section className="space-y-4">
                        <PreloadedMessages onSelect={setMessage} />
                    </section>

                    <MessageInput message={message} setMessage={setMessage} />
                </div>
            )
        },
        { name: 'Schedule', component: <Scheduler boardId={searchParams.get('boardId')} /> }
    ]

    return (
        <div className="container mx-auto px-4 py-6 pb-32 max-w-2xl">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Controller</h1>
                    <p className="text-sm text-gray-400">
                        {searchParams.get('boardId') ? 'Managed Display' : 'Temporary Session'}
                        <span className="font-mono text-teal-400 ml-2">
                            {searchParams.get('boardId') ? '' : sessionCode}
                        </span>
                    </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </header>

            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-slate-800/50 p-1 mb-8">
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.name}
                            className={({ selected }) =>
                                clsx(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                    'ring-white/60 ring-offset-2 ring-offset-slate-900 focus:outline-none focus:ring-2',
                                    selected
                                        ? 'bg-teal-500 text-white shadow'
                                        : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
                                )
                            }
                        >
                            {tab.name}
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels>
                    {tabs.map((tab, idx) => (
                        <Tab.Panel
                            key={idx}
                            className={clsx(
                                'rounded-xl focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-900 ring-white/60'
                            )}
                        >
                            {tab.component}
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        </div>
    )
}
