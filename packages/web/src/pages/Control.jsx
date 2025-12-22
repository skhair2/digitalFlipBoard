import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SessionPairing from '../components/control/SessionPairing'
import MessageInput from '../components/control/MessageInput'
import PreloadedMessages from '../components/control/PreloadedMessages'
import AnimationPicker from '../components/control/AnimationPicker'
import ColorThemePicker from '../components/control/ColorThemePicker'
import Scheduler from '../components/control/Scheduler'
import ChannelManager from '../components/control/ChannelManager'
import EmailVerificationBanner from '../components/auth/EmailVerificationBanner'
import { useSessionStore } from '../store/sessionStore'
import { useAuthStore } from '../store/authStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useWebRTC } from '../hooks/useWebRTC'
import { useMessageBroker } from '../hooks/useMessageBroker'
import { useActivityTracking } from '../hooks/useActivityTracking'
import mixpanel from '../services/mixpanelService'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import EnhancedGridEditor from '../components/designer/EnhancedGridEditor'
import DesignList from '../components/designer/DesignList'
import Collections from '../components/designer/Collections'
import VersionHistory from '../components/designer/VersionHistory'
import PremiumGate from '../components/common/PremiumGate'
import SharingPanel from '../components/control/SharingPanel'
import LibraryManager from '../components/control/LibraryManager'
import RoleManagement from '../components/control/RoleManagement'
import SessionManagement from '../components/admin/SessionManagement'
import SessionStats from '../components/admin/SessionStats'
import { 
    CommandLineIcon, 
    PencilSquareIcon, 
    CalendarIcon, 
    ShareIcon, 
    ShieldCheckIcon,
    LinkIcon,
    BookOpenIcon,
    Squares2X2Icon,
    SignalIcon,
    CpuChipIcon,
    PlusIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    SparklesIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { Transition, Dialog } from '@headlessui/react'
import { Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Control() {
    const { sessionCode, isConnected, setSessionCode, setConnected, setBoardId, isClockMode, setClockMode, controllerHasPaired } = useSessionStore()
    const { isPremium } = useAuthStore()
    const [searchParams] = useSearchParams()
    const [message, setMessage] = useState('')
    const [selectedTabIndex, setSelectedTabIndex] = useState(0)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const boardIdFromQuery = useMemo(() => {
        const boardId = searchParams.get('boardId')
        return boardId ? boardId.toUpperCase() : null
    }, [searchParams])

    // Use message broker (reserved for future message routing features)
    useMessageBroker()

    // Call useWebSocket hook - it handles null sessionCode internally
    useWebSocket()

    // Initialize WebRTC for P2P communication
    const { initiateConnection, isP2P } = useWebRTC(sessionCode, 'controller')

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
                sessionStorage.removeItem(`controller_active_${sessionCode}`)
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
            const tabIndex = tabs.findIndex(t => t.name.toLowerCase() === tab.toLowerCase())
            if (tabIndex >= 0) {
                setSelectedTabIndex(tabIndex)
            }
        }
    }, [searchParams, setBoardId, tabs])

    useEffect(() => {
        mixpanel.track('Control Page Viewed')
    }, [])

    const isPaired = controllerHasPaired && sessionCode
    const shouldShowPairing = !isPaired && !isPremium

    if (shouldShowPairing) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <SessionPairing suggestedCode={boardIdFromQuery || undefined} />
            </div>
        )
    }

    const tabs = [
        {
            name: isPaired ? 'Connection' : 'Pairing',
            icon: LinkIcon,
            component: (
                <div className="space-y-8">
                    <SessionPairing suggestedCode={boardIdFromQuery || undefined} />
                </div>
            )
        },
        {
            name: 'Control',
            icon: CommandLineIcon,
            component: (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white tracking-tight uppercase">Board Configuration</h2>
                                <div className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded text-[10px] font-bold text-teal-500 uppercase">Live Sync</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-teal-500/10 transition-colors">
                                            <Squares2X2Icon className="w-5 h-5 text-slate-400 group-hover:text-teal-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grid Size</span>
                                    </div>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer"
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

                                <div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-teal-500/10 transition-colors">
                                            <ClockIcon className="w-5 h-5 text-slate-400 group-hover:text-teal-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clock Mode</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400">Display current time</span>
                                        <button
                                            onClick={() => setClockMode(!isClockMode)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${isClockMode ? 'bg-teal-500 shadow-lg shadow-teal-500/20' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isClockMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Visual Style</h2>
                            <div className="space-y-6">
                                <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                    <AnimationPicker />
                                </div>
                                <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                    <ColorThemePicker />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Quick Actions</h2>
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 space-y-6">
                                <PreloadedMessages onSelect={setMessage} />
                                <div className="pt-6 border-t border-slate-800">
                                    <MessageInput message={message} setMessage={setMessage} />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )
        },
        {
            name: 'Designer',
            icon: PencilSquareIcon,
            component: (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                        <PremiumGate>
                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-white tracking-tight uppercase">Board Editor</h2>
                                        <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-500 uppercase">Pro Feature</div>
                                    </div>
                                    <div className="bg-slate-900/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-800 overflow-hidden">
                                        <EnhancedGridEditor />
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section className="space-y-4">
                                        <h2 className="text-lg font-bold text-white tracking-tight uppercase">Saved Designs</h2>
                                        <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                            <DesignList />
                                        </div>
                                    </section>
                                    <section className="space-y-4">
                                        <h2 className="text-lg font-bold text-white tracking-tight uppercase">Collections</h2>
                                        <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                            <Collections />
                                        </div>
                                    </section>
                                </div>

                                <section className="space-y-4">
                                    <h2 className="text-lg font-bold text-white tracking-tight uppercase">Version History</h2>
                                    <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                        <VersionHistory />
                                    </div>
                                </section>
                            </div>
                        </PremiumGate>
                    </div>
                </div>
            )
        },
        {
            name: 'Library',
            icon: BookOpenIcon,
            component: (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white tracking-tight uppercase">Personal Library</h2>
                                <div className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded text-[10px] font-bold text-teal-500 uppercase">Cloud Storage</div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                <LibraryManager />
                            </div>
                        </section>
                    </div>
                </div>
            )
        },
        {
            name: 'Sharing',
            icon: ShareIcon,
            component: (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white tracking-tight uppercase">Board Collaboration</h2>
                                <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-500 uppercase">Pro Feature</div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                <SharingPanel />
                            </div>
                        </section>
                    </div>
                    <div className="lg:col-span-4">
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Access Control</h2>
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                <RoleManagement />
                            </div>
                        </section>
                    </div>
                </div>
            )
        },
        { 
            name: 'Schedule', 
            icon: CalendarIcon, 
            component: (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Automation Scheduler</h2>
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                <Scheduler boardId={searchParams.get('boardId')} />
                            </div>
                        </section>
                    </div>
                </div>
            )
        },
        { 
            name: 'Channels', 
            icon: Squares2X2Icon, 
            component: (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Channel Manager</h2>
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                <ChannelManager boardId={searchParams.get('boardId')} />
                            </div>
                        </section>
                    </div>
                </div>
            )
        },
        {
            name: 'Admin',
            icon: ShieldCheckIcon,
            component: (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12 space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-white tracking-tight uppercase">System Statistics</h2>
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                <SessionStats />
                            </div>
                        </section>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold text-white tracking-tight uppercase">Session Monitoring</h2>
                                <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                    <SessionManagement />
                                </div>
                            </section>
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold text-white tracking-tight uppercase">Role Management</h2>
                                <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800">
                                    <RoleManagement />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-teal-500/30">
            <EmailVerificationBanner />
            
            {/* Global Header */}
            <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white active:scale-95"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-teal-500/10 rounded-lg">
                            <CpuChipIcon className="w-6 h-6 text-teal-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white leading-none tracking-tight">FLIPBOARD</span>
                            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Controller</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isPremium && (
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Premium</span>
                        </div>
                    )}
                    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">
                            {isConnected ? (isP2P ? 'Direct P2P' : 'Cloud Relay') : 'Offline'}
                        </span>
                        {isPaired && (
                            <>
                                <div className="w-px h-3 bg-slate-700" />
                                <span className="text-[10px] font-mono text-teal-400">{sessionCode}</span>
                            </>
                        )}
                    </div>
                    
                    <button
                        onClick={() => {
                            if (sessionCode) sessionStorage.removeItem(`controller_active_${sessionCode}`)
                            setConnected(false)
                            setSessionCode(null, { markControllerPaired: false })
                        }}
                        className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all active:scale-95"
                        title="New Display"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
                {/* Sidebar Drawer */}
                <Transition.Root show={isSidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50" onClose={setIsSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-in-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in-out duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-hidden">
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="transform transition ease-in-out duration-300"
                                        enterFrom="-translate-x-full"
                                        enterTo="translate-x-0"
                                        leave="transform transition ease-in-out duration-300"
                                        leaveFrom="translate-x-0"
                                        leaveTo="-translate-x-full"
                                    >
                                        <Dialog.Panel className="pointer-events-auto w-72 max-w-md">
                                            <div className="flex h-full flex-col overflow-y-auto bg-slate-900 border-r border-slate-800 shadow-2xl">
                                                <div className="p-6 flex items-center justify-between">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white">Menu</h2>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Digital FlipBoard</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsSidebarOpen(false)}
                                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                                    >
                                                        <XMarkIcon className="w-6 h-6" />
                                                    </button>
                                                </div>

                                                <nav className="flex-1 px-3 space-y-1">
                                                    <Tab.List className="flex flex-col space-y-1">
                                                        {tabs.map((tab, idx) => (
                                                            <Tab
                                                                key={tab.name}
                                                                onClick={() => setIsSidebarOpen(false)}
                                                                className={({ selected }) =>
                                                                    clsx(
                                                                        'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all outline-none',
                                                                        selected
                                                                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                                    )
                                                                }
                                                            >
                                                                <tab.icon className="w-5 h-5" />
                                                                {tab.name}
                                                            </Tab>
                                                        ))}
                                                    </Tab.List>
                                                </nav>

                                                <div className="p-6 border-t border-slate-800">
                                                    <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                <span className="text-[10px] text-slate-300 font-mono">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                                                            </div>
                                                        </div>
                                                        {isPaired && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Session</span>
                                                                <span className="text-[10px] text-teal-400 font-mono">{sessionCode}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
                        <AnimatePresence mode="wait">
                            <Tab.Panels as={Fragment}>
                                {tabs.map((tab, idx) => (
                                    <Tab.Panel
                                        key={idx}
                                        static
                                        as={motion.div}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={selectedTabIndex === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className={clsx(
                                            "focus:outline-none",
                                            selectedTabIndex !== idx && "hidden"
                                        )}
                                    >
                                        <div className="mb-8">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="p-2 bg-teal-500/10 rounded-lg">
                                                    <tab.icon className="w-5 h-5 text-teal-400" />
                                                </div>
                                                <h2 className="text-3xl font-bold text-white tracking-tight">{tab.name.toUpperCase()}</h2>
                                            </div>
                                            <p className="text-slate-500 ml-11">Professional control suite for your {tab.name.toLowerCase()} workspace.</p>
                                        </div>
                                        {tab.component}
                                    </Tab.Panel>
                                ))}
                            </Tab.Panels>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Mobile Bottom Navigation (Optional, keeping for quick access) */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 px-2 pb-safe pt-2 z-40">
                    <Tab.List className="flex items-center justify-around">
                        {tabs.slice(0, 4).map((tab) => (
                            <Tab
                                key={tab.name}
                                className={({ selected }) =>
                                    clsx(
                                        'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all outline-none',
                                        selected ? 'text-teal-400' : 'text-slate-500'
                                    )
                                }
                            >
                                <tab.icon className="w-6 h-6" />
                                <span className="text-[10px] font-medium">{tab.name}</span>
                            </Tab>
                        ))}
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-slate-500"
                        >
                            <Bars3Icon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Menu</span>
                        </button>
                    </Tab.List>
                </nav>
            </Tab.Group>
        </div>
    )
}
