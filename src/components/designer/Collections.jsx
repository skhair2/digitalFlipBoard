import { useEffect, useState, useCallback } from 'react'
import { useDesignStore } from '../../store/designStore'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'
import { TrashIcon, PlusIcon, FolderIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import mixpanel from '../../services/mixpanelService'
import PremiumGate from '../common/PremiumGate'

export default function Collections() {
  const { designCollections, fetchCollections, createCollection, deleteCollection } = useDesignStore()
  const { isPremium } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [expandedCollectionId, setExpandedCollectionId] = useState(null)

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  const loadCollections = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchCollections()
    } catch (error) {
      toast.error('Failed to load collections')
      console.error('Error loading collections:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchCollections])

  const handleCreateCollection = async (e) => {
    e.preventDefault()
    if (!newCollectionName.trim()) {
      toast.error('Collection name is required')
      return
    }

    try {
      const result = await createCollection(newCollectionName, newCollectionDescription)
      if (result.success) {
        toast.success('Collection created!')
        setNewCollectionName('')
        setNewCollectionDescription('')
        setIsCreating(false)
        mixpanel.track('Collection Created', { 
          collectionName: newCollectionName,
          hasDescription: !!newCollectionDescription 
        })
        await loadCollections()
      } else {
        if (result.requiresUpgrade) {
          toast.error('Collections are a Pro feature. Upgrade to create unlimited collections.')
        } else {
          toast.error(result.error || 'Failed to create collection')
        }
      }
    } catch (error) {
      toast.error('Error creating collection')
      console.error('Error:', error)
      mixpanel.track('Collection Create Error', { error: error.message })
    }
  }

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Delete this collection? Designs will not be deleted.')) return

    try {
      const result = await deleteCollection(collectionId)
      if (result.success) {
        toast.success('Collection deleted')
        mixpanel.track('Collection Deleted', { collectionId })
        await loadCollections()
      } else {
        toast.error(result.error || 'Failed to delete collection')
      }
    } catch (error) {
      toast.error('Error deleting collection')
      console.error('Error:', error)
      mixpanel.track('Collection Delete Error', { error: error.message })
    }
  }

  const getCollectionDesigns = () => {
    // This would normally query the design_collection_members table
    // For now, return empty array (implement full integration later)
    return []
  }

  if (!isPremium) {
    return (
      <PremiumGate feature="collections">
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Collections (Pro Only)</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Upgrade to Pro to organize designs into collections, share them with teams, and version control.</p>
        </div>
      </PremiumGate>
    )
  }

  return (
    <div className="space-y-4">
      {/* Create Collection Form */}
      {isCreating && (
        <form onSubmit={handleCreateCollection} className="p-4 bg-teal-50 dark:bg-slate-900 rounded-lg border border-teal-200 dark:border-slate-700">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Collection Name
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Daily Promotions"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Describe the purpose of this collection..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setNewCollectionName('')
                  setNewCollectionDescription('')
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
              >
                Create Collection
              </button>
            </div>
          </div>
        </form>
      )}

      {/* New Collection Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-slate-900 border border-teal-200 dark:border-teal-700 rounded-lg hover:bg-teal-100 dark:hover:bg-slate-800"
        >
          <PlusIcon className="w-4 h-4" />
          New Collection
        </button>
      )}

      {/* Collections List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : designCollections.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
          <FolderIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">No collections yet. Create one to organize your designs!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {designCollections.map((collection) => {
            const collectionDesigns = getCollectionDesigns(collection.id)
            const isExpanded = expandedCollectionId === collection.id

            return (
              <div
                key={collection.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCollectionId(isExpanded ? null : collection.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <FolderIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">{collection.name}</h4>
                      {collection.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">{collection.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {collectionDesigns.length} designs
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCollection(collection.id)
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </button>

                {/* Expanded Collection Content */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 space-y-3">
                    {collectionDesigns.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-2">
                        No designs in this collection yet
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {collectionDesigns.map((design) => (
                          <div key={design.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded">
                            <span className="text-sm text-slate-900 dark:text-slate-100">{design.name}</span>
                            <button
                              onClick={() => {
                                // Handle remove design from collection
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        // Handle add design to collection
                        toast.info('Select designs from the list to add them to this collection')
                        mixpanel.track('Add Design To Collection Initiated', { collectionId: collection.id })
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/50 rounded hover:bg-teal-100 dark:hover:bg-teal-900/40"
                    >
                      Add designs...
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info Section */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Pro Tip</h4>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Organize designs into collections to make them easier to find and share with your team.
        </p>
      </div>
    </div>
  )
}
