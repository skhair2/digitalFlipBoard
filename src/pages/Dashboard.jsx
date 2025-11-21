import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useBoardStore } from '../store/boardStore'
import { Card, Button, Input } from '../components/ui/Components'
import { PlusIcon, ComputerDesktopIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Dashboard() {
    const { user, isPremium } = useAuthStore()
    const { boards, fetchBoards, createBoard, deleteBoard, isLoading } = useBoardStore()
    const [newBoardName, setNewBoardName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchBoards()
    }, [fetchBoards])

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

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <div className="text-sm text-gray-400">
                    {isPremium ? '✨ Premium Plan' : 'Free Plan'}
                </div>
            </div>

            <div className="grid gap-8">
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
                        <h2 className="text-xl font-semibold text-white">Your Displays</h2>
                        <Button onClick={() => setIsCreating(!isCreating)} size="sm">
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
                        {boards.map((board) => (
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

                        {boards.length === 0 && !isCreating && (
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
