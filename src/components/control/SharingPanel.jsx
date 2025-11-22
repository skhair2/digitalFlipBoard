import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useSessionStore } from '../../store/sessionStore'
import { inviteCollaborator, removeCollaborator, getCollaborators } from '../../services/sharingService'
import { EnvelopeIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function SharingPanel() {
    const { user } = useAuthStore()
    const { boardId } = useSessionStore()
    const [email, setEmail] = useState('')
    const [permission, setPermission] = useState('view')
    const [collaborators, setCollaborators] = useState([])
    const [isInviting, setIsInviting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    useEffect(() => {
        if (boardId) {
            loadCollaborators()
        }
    }, [boardId, loadCollaborators])

    const loadCollaborators = useCallback(async () => {
        const result = await getCollaborators(boardId)
        if (result.success) {
            setCollaborators(result.data)
        }
    }, [boardId])

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsInviting(true)
        setError(null)
        setSuccess(null)

        const result = await inviteCollaborator(boardId, email, permission)

        if (result.success) {
            setSuccess(`Invited ${email} successfully!`)
            setEmail('')
            loadCollaborators()
        } else {
            setError(result.error)
        }

        setIsInviting(false)
    }

    const handleRemove = async (userId) => {
        const result = await removeCollaborator(boardId, userId)
        if (result.success) {
            loadCollaborators()
        } else {
            setError(result.error)
        }
    }

    // Check if user is premium
    const isPremium = user?.user_metadata?.tier === 'pro'

    if (!isPremium) {
        return (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
                <UserGroupIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">Collaboration is a Pro Feature</h3>
                <p className="text-gray-400 mb-4">
                    Upgrade to Pro to invite collaborators and share your boards with your team.
                </p>
                <button className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors">
                    Upgrade to Pro
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Invite Form */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <EnvelopeIcon className="w-5 h-5" />
                    Invite Collaborator
                </h3>

                <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Permission Level</label>
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-500"
                        >
                            <option value="view">View Only</option>
                            <option value="edit">Can Edit</option>
                        </select>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!email || isInviting}
                        className="w-full px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                        {isInviting ? 'Sending Invite...' : 'Send Invite'}
                    </button>
                </form>
            </div>

            {/* Collaborators List */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5" />
                    Collaborators ({collaborators.length})
                </h3>

                {collaborators.length === 0 ? (
                    <p className="text-gray-500 text-sm">No collaborators yet. Invite someone to get started!</p>
                ) : (
                    <div className="space-y-2">
                        {collaborators.map((collab, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between bg-slate-900 p-3 rounded-lg"
                            >
                                <div>
                                    <p className="text-white font-medium">{collab.email}</p>
                                    <p className="text-xs text-gray-500">
                                        {collab.permission === 'edit' ? 'Can Edit' : 'View Only'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRemove(collab.user_id)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove collaborator"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
