import { useState, useEffect, useMemo } from 'react'
import { useDesignStore } from '../../store/designStore'
import { useSessionStore } from '../../store/sessionStore'
import { useAuthStore } from '../../store/authStore'
import { Card, Button, Input } from '../ui/Components'
import { 
    BookmarkIcon, 
    TrashIcon, 
    PaperAirplaneIcon, 
    MagnifyingGlassIcon,
    Squares2X2Icon,
    ListBulletIcon,
    PlusIcon,
    SparklesIcon,
    FolderIcon,
    TagIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon, StarIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { TEMPLATE_CATEGORIES } from '../../data/templates'

export default function LibraryManager() {
    const { 
        savedDesigns, 
        fetchDesigns, 
        saveDesign, 
        deleteDesign, 
        isLoading, 
        setCurrentDesign,
        templates,
        fetchTemplates
    } = useDesignStore()
    const { boardState, setBoardState, gridConfig } = useSessionStore()
    const { user, isPremium } = useAuthStore()
    
    const [activeTab, setActiveTab] = useState('saved') // 'saved' or 'templates'
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [isSaving, setIsSaving] = useState(false)
    const [newDesignName, setNewDesignName] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        if (user) {
            fetchDesigns()
            fetchTemplates()
        }
    }, [user, fetchDesigns, fetchTemplates])

    const handleSaveCurrent = async () => {
        if (!boardState) {
            toast.error('Nothing to save! Create a message first.')
            return
        }

        if (!newDesignName.trim()) {
            toast.error('Please enter a name for your design')
            return
        }

        setIsSaving(true)
        try {
            // Sync current design to store before saving
            setCurrentDesign(boardState)
            const result = await saveDesign(newDesignName)
            
            if (result.success) {
                toast.success('Saved to library!')
                setNewDesignName('')
            } else {
                toast.error(result.error || 'Failed to save')
            }
        } catch (error) {
            toast.error('Error saving design')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLoadDesign = (design) => {
        setBoardState(design.layout)
        toast.success(`Loaded: ${design.name}`)
    }

    const handleDelete = async (id, name) => {
        if (window.confirm(`Delete "${name}" from library?`)) {
            const result = await deleteDesign(id)
            if (result.success) {
                toast.success('Deleted')
            } else {
                toast.error('Failed to delete')
            }
        }
    }

    const filteredDesigns = useMemo(() => {
        const list = activeTab === 'saved' ? savedDesigns : templates
        return list.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [activeTab, savedDesigns, templates, searchQuery, selectedCategory])

    if (!user) {
        return (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BookmarkIcon className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Custom Library</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
                    Sign in to save your favorite messages and designs to your personal library.
                </p>
                <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-teal-500/20 uppercase text-xs tracking-widest"
                >
                    Sign In
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 w-fit">
                <button
                    onClick={() => { setActiveTab('saved'); setSelectedCategory('All'); }}
                    className={clsx(
                        "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'saved' ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <BookmarkIcon className="w-4 h-4" />
                    My Library
                </button>
                <button
                    onClick={() => { setActiveTab('templates'); setSelectedCategory('All'); }}
                    className={clsx(
                        "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'templates' ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <SparklesIcon className="w-4 h-4" />
                    Templates
                </button>
            </div>

            {/* Save Current Section (Only for My Library) */}
            {activeTab === 'saved' && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-teal-500/10 rounded-lg">
                            <PlusIcon className="w-4 h-4 text-teal-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Save Current Board</h4>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="ENTER DESIGN NAME..."
                            value={newDesignName}
                            onChange={(e) => setNewDesignName(e.target.value.toUpperCase())}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-teal-500 transition-all font-mono uppercase tracking-widest"
                        />
                        <button
                            onClick={handleSaveCurrent}
                            disabled={isSaving || !boardState}
                            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-teal-500/20 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <BookmarkIcon className="w-4 h-4" />
                            )}
                            Save
                        </button>
                    </div>
                    {!isPremium && savedDesigns.length >= 5 && (
                        <p className="text-[10px] text-amber-400 mt-3 font-mono uppercase tracking-wider">
                            Free tier limit reached ({savedDesigns.length}/5). Upgrade to Pro for unlimited library slots.
                        </p>
                    )}
                </div>
            )}

            {/* Template Categories (Only for Templates) */}
            {activeTab === 'templates' && (
                <div className="flex flex-wrap gap-2">
                    {TEMPLATE_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={clsx(
                                "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                                selectedCategory === cat 
                                    ? "bg-purple-500/10 border-purple-500 text-purple-400" 
                                    : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative flex-1 w-full">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder={activeTab === 'saved' ? "SEARCH SAVED DESIGNS..." : "SEARCH TEMPLATES..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-teal-500 transition-all font-mono uppercase tracking-widest"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx(
                            "p-2 rounded-lg transition-all",
                            viewMode === 'grid' ? "bg-slate-800 text-teal-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <Squares2X2Icon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            "p-2 rounded-lg transition-all",
                            viewMode === 'list' ? "bg-slate-800 text-teal-400 shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <ListBulletIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Designs Grid/List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredDesigns.length === 0 ? (
                <div className="text-center py-20 bg-slate-950/30 border border-dashed border-slate-800 rounded-2xl">
                    {activeTab === 'saved' ? (
                        <BookmarkIcon className="w-12 h-12 mx-auto text-slate-800 mb-4" />
                    ) : (
                        <SparklesIcon className="w-12 h-12 mx-auto text-slate-800 mb-4" />
                    )}
                    <p className="text-slate-500 font-mono uppercase tracking-widest text-xs">No {activeTab} found</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDesigns.map((design) => (
                        <div 
                            key={design.id}
                            className={clsx(
                                "group bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden transition-all hover:shadow-2xl",
                                activeTab === 'saved' ? "hover:border-teal-500/50 hover:shadow-teal-500/5" : "hover:border-purple-500/50 hover:shadow-purple-500/5"
                            )}
                        >
                            <div className="aspect-video bg-slate-950 p-4 flex items-center justify-center relative overflow-hidden">
                                {/* Mini Preview Placeholder */}
                                <div className="grid grid-cols-11 gap-0.5 opacity-20 group-hover:opacity-40 transition-opacity">
                                    {Array.from({ length: 33 }).map((_, i) => (
                                        <div key={i} className={clsx("w-2 h-2 rounded-sm", activeTab === 'saved' ? "bg-teal-500" : "bg-purple-500")} />
                                    ))}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div className={clsx(
                                        "px-2 py-1 bg-slate-800/80 backdrop-blur-md rounded text-[10px] font-mono border border-slate-700",
                                        activeTab === 'saved' ? "text-teal-400" : "text-purple-400"
                                    )}>
                                        {design.category || 'CUSTOM'}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <h5 className="text-white font-bold uppercase tracking-tight mb-1 truncate">{design.name}</h5>
                                <p className="text-[10px] text-slate-500 font-mono uppercase mb-4 truncate">
                                    {design.description || (activeTab === 'saved' ? `Created ${new Date(design.created_at).toLocaleDateString()}` : 'Pre-filled template')}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleLoadDesign(design)}
                                        className={clsx(
                                            "flex-1 bg-slate-800 text-slate-300 hover:text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            activeTab === 'saved' ? "hover:bg-teal-500" : "hover:bg-purple-500"
                                        )}
                                    >
                                        <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                        Load
                                    </button>
                                    {activeTab === 'saved' && (
                                        <button
                                            onClick={() => handleDelete(design.id, design.name)}
                                            className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredDesigns.map((design) => (
                                <tr key={design.id} className="hover:bg-slate-900/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "p-2 bg-slate-800 rounded-lg transition-colors",
                                                activeTab === 'saved' ? "group-hover:bg-teal-500/10" : "group-hover:bg-purple-500/10"
                                            )}>
                                                {activeTab === 'saved' ? (
                                                    <BookmarkSolidIcon className="w-4 h-4 text-slate-600 group-hover:text-teal-500" />
                                                ) : (
                                                    <SparklesIcon className="w-4 h-4 text-slate-600 group-hover:text-purple-500" />
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">{design.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-mono uppercase">
                                        {design.category || 'Custom'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleLoadDesign(design)}
                                                className={clsx(
                                                    "px-4 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                                    activeTab === 'saved' ? "hover:bg-teal-500" : "hover:bg-purple-500"
                                                )}
                                            >
                                                Load
                                            </button>
                                            {activeTab === 'saved' && (
                                                <button
                                                    onClick={() => handleDelete(design.id, design.name)}
                                                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
