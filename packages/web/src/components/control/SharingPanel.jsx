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

    const loadCollaborators = useCallback(async () => {
        const result = await getCollaborators(boardId)
        if (result.success) {
            setCollaborators(result.data)
        }
    }, [boardId])

    useEffect(() => {
        if (boardId) {
            loadCollaborators()
        }
    }, [boardId, loadCollaborators])

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
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <UserGroupIcon className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Collaboration is a Pro Feature</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
                    Upgrade to Pro to invite collaborators and share your boards with your team.
                </p>
                <button className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/20 uppercase text-xs tracking-widest">
                    Upgrade to Pro
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Invite Form */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-500/10 rounded-lg">
                        <EnvelopeIcon className="w-4 h-4 text-teal-400" />
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Invite Collaborator</h4>
                </div>

                <form onSubmit={handleInvite} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="COLLEAGUE@EXAMPLE.COM"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-teal-500 transition-all font-mono uppercase tracking-widest"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Permission Level</label>
                            <select
                                value={permission}
                                onChange={(e) => setPermission(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer font-mono uppercase tracking-widest"
                            >
                                <option value="view">VIEW ONLY</option>
                                <option value="edit">CAN EDIT</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider">
                            {error && <span className="text-red-400">{error}</span>}
                            {success && <span className="text-teal-400">{success}</span>}
                        </div>
                        <button
                            type="submit"
                            disabled={!email || isInviting}
                            className="px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-teal-500/20 uppercase text-xs tracking-widest flex items-center gap-2"
                        >
                            {isInviting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <PlusIcon className="w-4 h-4" />
                            )}
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>

            {/* Collaborators List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Collaborators</h4>
                    <span className="text-[10px] font-mono text-teal-500">{collaborators.length} TOTAL</span>
                </div>
                
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                    {collaborators.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-600 font-mono uppercase tracking-widest text-xs">No collaborators yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {collaborators.map((collab, index) => (
                                    <tr key={index} className="hover:bg-slate-900/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-teal-500 border border-slate-700">
                                                    {collab.email[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-white uppercase tracking-tight">{collab.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                                collab.permission === 'edit' ? "bg-teal-500/10 text-teal-500 border border-teal-500/20" :
                                                "bg-slate-800 text-slate-400 border border-slate-700"
                                            )}>
                                                {collab.permission === 'edit' ? 'CAN EDIT' : 'VIEW ONLY'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemove(collab.user_id)}
                                                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                                title="Remove Collaborator"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
