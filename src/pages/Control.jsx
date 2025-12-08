import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SessionPairing from '../components/control/SessionPairing'
import MessageInput from '../components/control/MessageInput'
import PreloadedMessages from '../components/control/PreloadedMessages'
import AnimationPicker from '../components/control/AnimationPicker'
import ColorThemePicker from '../components/control/ColorThemePicker'
import Scheduler from '../components/control/Scheduler'
import EmailVerificationBanner from '../components/auth/EmailVerificationBanner'
import { useSessionStore } from '../store/sessionStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useMessageBroker } from '../hooks/useMessageBroker'
import { useActivityTracking } from '../hooks/useActivityTracking'
import mixpanel from '../services/mixpanelService'
import { Tab } from '@headlessui/react'
import { clsx } from 'clsx'
import GridEditor from '../components/designer/GridEditor'
import DesignList from '../components/designer/DesignList'
import Collections from '../components/designer/Collections'
import VersionHistory from '../components/designer/VersionHistory'
import PremiumGate from '../components/common/PremiumGate'
import SharingPanel from '../components/control/SharingPanel'
import RoleManagement from '../components/control/RoleManagement'
import SessionManagement from '../components/admin/SessionManagement'

export default function Control() {
    const { sessionCode, isConnected, setSessionCode, setConnected, setBoardId, isClockMode, setClockMode, controllerHasPaired } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [message, setMessage] = useState('')
    const [selectedTabIndex, setSelectedTabIndex] = useState(0)
    const boardIdFromQuery = useMemo(() => {
        const boardId = searchParams.get('boardId')
        return boardId ? boardId.toUpperCase() : null
    }, [searchParams])

    // Use message broker for Redis Pub/Sub message routing
    const { sendMessage: sendViaRedis, updateConfig: updateConfigViaRedis, isLoading: isBrokerLoading } = useMessageBroker()

    // Call useWebSocket hook - it handles null sessionCode internally
    useEffect(() => {
        const role = window.location.pathname.includes('control') ? 'controller' : 'display';
        console.log('[Control] Attempting WebSocket connection with role:', role);
        if (role !== 'controller') {
            console.warn('[Control] WARNING: Role is not controller! Pairing may fail.');
        }
    }, []);
    useWebSocket()

    // Track user activity to prevent session timeout
    useActivityTracking(sessionCode, 'controller')

    // On first mount, clear any stale sessionCode from localStorage
    // Sessions should only exist for the current browser session
    useEffect(() => {
        if (sessionCode && !searchParams.get('boardId')) {
            // If we have a sessionCode but no boardId in URL and we just loaded,
            // this is likely a stale session code persisted from before the fix
            const connectionTime = useSessionStore.getState().connectionStartTime
            if (!connectionTime || Date.now() - connectionTime > 15 * 60 * 1000) {
                // Session is expired or connection time is missing - clear it
                setConnected(false)
                setSessionCode(null, { markControllerPaired: false })
            }
        }
    }, [sessionCode, searchParams, setConnected, setSessionCode])

    // Check for boardId in URL
    useEffect(() => {
        const boardId = searchParams.get('boardId')
        const tab = searchParams.get('tab')
        
        if (boardId) {
            setBoardId(boardId)
        }

        // Set active tab if specified in URL
        if (tab) {
            const tabIndex = ['Control', 'Input', 'Designer', 'Scheduler', 'Sharing', 'Admin'].findIndex(t => t.toLowerCase() === tab.toLowerCase())
            if (tabIndex >= 0) {
                setSelectedTabIndex(tabIndex)
            }
        }
    }, [searchParams, setBoardId])

    useEffect(() => {
        mixpanel.track('Control Page Viewed')
    }, [])

    const shouldShowPairing = !controllerHasPaired || !sessionCode

    if (shouldShowPairing) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <SessionPairing suggestedCode={boardIdFromQuery || undefined} />
            </div>
        )
    }

    // ... existing imports

    const tabs = [
        {
            name: 'Control', component: (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-white">Board Settings</h2>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Grid Size</span>
                                <select
                                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-teal-500"
                                    onChange={(e) => {
                                        const [rows, cols] = e.target.value.split('x').map(Number)
                                        useSessionStore.getState().setGridConfig({ rows, cols })
                                    }}
                                    defaultValue="6x22"
                                >
                                    <option value="6x22">Standard (22x6)</option>
                                    <option value="4x10">Compact (10x4)</option>
                                    <option value="10x30">Ultrawide (30x10)</option>
                                    <option value="12x24">Large (24x12)</option>
                                </select>
                            </div>
                        </div>
                    </section>

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
        {
            name: 'Designer',
            component: (
                <div className="space-y-8">
                    <PremiumGate>
                        <div className="space-y-8">
                            <section>
                                <h2 className="text-lg font-semibold text-white mb-4">Board Editor</h2>
                                <GridEditor />
                            </section>
                            <section>
                                <h2 className="text-lg font-semibold text-white mb-4">Saved Designs</h2>
                                <DesignList />
                            </section>
                            <section>
                                <h2 className="text-lg font-semibold text-white mb-4">Collections</h2>
                                <Collections />
                            </section>
                            <section>
                                <h2 className="text-lg font-semibold text-white mb-4">Version History</h2>
                                <VersionHistory />
                            </section>
                        </div>
                    </PremiumGate>
                </div>
            )
        },
        {
            name: 'Sharing',
            component: (
                <div className="space-y-8">
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4">Board Collaboration</h2>
                        <SharingPanel />
                    </section>
                </div>
            )
        },
        { name: 'Schedule', component: <Scheduler boardId={searchParams.get('boardId')} /> },
        {
            name: 'Admin',
            component: (
                <div className="space-y-8">
                    <section>
                        <SessionManagement />
                    </section>
                    <hr className="border-slate-700 my-8" />
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4">Role Management</h2>
                        <RoleManagement />
                    </section>
                </div>
            )
        }
    ]

    return (
        <div className="container mx-auto px-4 py-6 pb-32 max-w-2xl">
            <EmailVerificationBanner />
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
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    {isConnected && (
                        <button
                            onClick={() => {
                                setConnected(false)
                                setSessionCode(null, { markControllerPaired: false })
                            }}
                            className="px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            title="Disconnect and connect to a new display"
                        >
                            ➕ New Display
                        </button>
                    )}
                </div>
            </header>

            <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
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
