import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useBoardStore } from '../store/boardStore'
import { useDesignStore } from '../store/designStore'
import { useFeatureGate } from '../hooks/useFeatureGate'
import { Card, Button, Input } from '../components/ui/Components'
import EmailVerificationBanner from '../components/auth/EmailVerificationBanner'
import UpgradeModal from '../components/ui/UpgradeModal'
import { PlusIcon, ComputerDesktopIcon, TrashIcon, SparklesIcon, CheckCircleIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function Dashboard() {
    const { user, isPremium } = useAuthStore()
    const { boards, fetchBoards, createBoard, deleteBoard, isLoading } = useBoardStore()
    const { savedDesigns, fetchDesigns } = useDesignStore()
    const { isLimitReached, currentUsage, maxLimits } = useFeatureGate()

    const [newBoardName, setNewBoardName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    const navigate = useNavigate()

    useEffect(() => {
        fetchBoards()
        fetchDesigns()
    }, [fetchBoards, fetchDesigns])

    const handleCreateClick = useCallback(() => {
        if (isLimitReached('boards')) {
            setShowUpgradeModal(true)
        } else {
            setIsCreating(!isCreating)
        }
    }, [isLimitReached, isCreating])

    const handleCreateBoard = async (e) => {
        e.preventDefault()
        if (!newBoardName.trim()) return

        try {
            await createBoard(newBoardName)
            setNewBoardName('')
            setIsCreating(false)
        } catch (error) {
            console.error('Failed to create board:', error)
        }
    }

    const journeySteps = useMemo(() => {
        if (isPremium) {
            return [
                {
                    id: 'managed-board',
                    title: 'Launch a managed display',
                    description: 'Create a board with a persistent code for always-on signage.',
                    done: (boards?.length || 0) > 0,
                    action: () => handleCreateClick(),
                    actionLabel: (boards?.length || 0) ? 'Manage displays' : 'Create display'
                },
                {
                    id: 'design',
                    title: 'Save a premium design',
                    description: 'Use Designer to craft layouts, collections, and templates.',
                    done: savedDesigns.length > 0,
                    action: () => navigate('/control?tab=designer'),
                    actionLabel: savedDesigns.length ? 'Open Designer' : 'Design now'
                },
                {
                    id: 'schedule',
                    title: 'Schedule your playlist',
                    description: 'Line up announcements or promos via the Scheduler tab.',
                    done: false,
                    action: () => navigate('/control?tab=schedule'),
                    actionLabel: 'Open Scheduler'
                },
                {
                    id: 'share',
                    title: 'Invite collaborators',
                    description: 'Share boards with teammates for editing or monitoring.',
                    done: false,
                    action: () => navigate('/control?tab=sharing'),
                    actionLabel: 'Manage sharing'
                }
            ]
        }

        return [
            {
                id: 'board',
                title: 'Create your first display',
                description: 'Generate a temporary board and see the split-flap magic in action.',
                done: (boards?.length || 0) > 0,
                action: () => handleCreateClick(),
                actionLabel: (boards?.length || 0) ? 'Manage displays' : 'Create display'
            },
            {
                id: 'pair',
                title: 'Pair controller + display',
                description: 'Open /control and /display in two tabs, then enter your session code.',
                done: (boards?.length || 0) > 0,
                action: () => navigate('/control'),
                actionLabel: 'Open Controller'
            },
            {
                id: 'design-free',
                title: 'Save a custom board (3 limit)',
                description: 'Capture your layout before the limit nudges you to upgrade.',
                done: savedDesigns.length > 0,
                action: () => navigate('/control?tab=designer'),
                actionLabel: savedDesigns.length ? 'View Designs' : 'Save design'
            },
            {
                id: 'scheduler-locked',
                title: 'Schedule messages (Pro)',
                description: 'Upgrade to unlock automations, playlists, and advanced sharing.',
                done: false,
                locked: true,
                action: () => setShowUpgradeModal(true),
                actionLabel: 'See Pro benefits'
            }
        ]
    }, [isPremium, boards?.length, savedDesigns.length, handleCreateClick, navigate])

    const renderStepIcon = (step) => {
        if (step.locked) {
            return <LockClosedIcon className="w-5 h-5 text-amber-400" />
        }
        if (step.done) {
            return <CheckCircleIcon className="w-5 h-5 text-teal-400" />
        }
        return <ArrowRightIcon className="w-5 h-5 text-cyan-300" />
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <EmailVerificationBanner />
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Boards"
            />

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <div className="flex items-center gap-3">
                    {!isPremium && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-400 border-amber-400/50 hover:bg-amber-400/10"
                            onClick={() => navigate('/pricing')}
                        >
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Upgrade to Pro
                        </Button>
                    )}
                    <div className="text-sm text-gray-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        {isPremium ? '✨ Premium Plan' : 'Free Plan'}
                    </div>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Journey Section */}
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900 border border-white/5">
                    <div className="flex flex-col gap-2 mb-6">
                        <p className="uppercase text-xs tracking-[0.4em] text-slate-500">Journey</p>
                        <h2 className="text-2xl font-bold text-white">{isPremium ? 'Pro workflow unlocked' : 'You are moments from your first live board'}</h2>
                        <p className="text-sm text-slate-400 max-w-3xl">
                            {isPremium
                                ? 'Use this checklist to make the most of unlimited boards, premium designs, scheduling, and collaboration.'
                                : 'Follow the checklist below to pair a display, save a design, and understand when Pro removes the limits.'}
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                                {journeySteps.map((step) => (
                            <div
                                key={step.id}
                                className={`rounded-2xl border px-4 py-4 flex flex-col gap-3 ${
                                    step.done
                                        ? 'border-teal-500/30 bg-teal-500/5'
                                        : step.locked
                                            ? 'border-amber-400/30 bg-amber-500/5'
                                                    : 'border-white/5 bg-white/5'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">{renderStepIcon(step)}</div>
                                    <div>
                                        <p className="text-sm uppercase tracking-wide text-slate-400">
                                            {step.locked ? 'Pro Feature' : step.done ? 'Completed' : 'Next step'}
                                        </p>
                                        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-300 flex-1">{step.description}</p>
                                <Button
                                    size="sm"
                                    variant={step.locked ? 'outline' : 'secondary'}
                                    onClick={step.action}
                                >
                                    {step.actionLabel}
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Profile Section */}
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-xl">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white font-medium">{user?.email}</p>
                            <p className="text-sm text-gray-500">Member since {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </Card>

                {/* Boards Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold text-white">Your Displays</h2>
                            <span className="text-xs text-gray-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                {currentUsage.boards} / {maxLimits.boards === Infinity ? '∞' : maxLimits.boards} Used
                            </span>
                        </div>
                        <Button onClick={handleCreateClick} size="sm">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            New Display
                        </Button>
                    </div>

                    {isCreating && (
                        <Card className="animate-in fade-in slide-in-from-top-4">
                            <form onSubmit={handleCreateBoard} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                                    <Input
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        placeholder="e.g. Office Lobby"
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create'}
                                </Button>
                            </form>
                        </Card>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        {(Array.isArray(boards) ? boards : []).map((board) => (
                            <Card key={board.id} className="group hover:border-teal-500/50 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-slate-800 text-teal-400">
                                            <ComputerDesktopIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{board.name}</h3>
                                            <p className="text-xs text-gray-500">ID: {board.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteBoard(board.id)}
                                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                        title="Delete Board"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => navigate(`/control?boardId=${board.id}`)}
                                    >
                                        Manage
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => window.open(`/display?boardId=${board.id}`, '_blank')}
                                    >
                                        Open Display
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {(Array.isArray(boards) ? boards.length : 0) === 0 && !isCreating && (
                            <div className="col-span-full p-8 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center text-gray-500">
                                <ComputerDesktopIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p>No displays yet.</p>
                                <p className="text-sm">Create one to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
