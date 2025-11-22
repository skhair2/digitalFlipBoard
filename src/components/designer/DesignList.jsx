import { useEffect, useState } from 'react'
import { useDesignStore } from '../../store/designStore'
import { useSessionStore } from '../../store/sessionStore'
import { useAuthStore } from '../../store/authStore'
import { premiumDesignService } from '../../services/premiumDesignService'
import Spinner from '../ui/Spinner'
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline'
import mixpanel from '../../services/mixpanelService'
import toast from 'react-hot-toast'

export default function DesignList() {
  const { savedDesigns, fetchDesigns, loadDesign, deleteDesign, isLoading } = useDesignStore()
  const { setGridConfig, currentMessage } = useSessionStore()
  const { user } = useAuthStore()
  const [selectedDesignId, setSelectedDesignId] = useState(null)

  useEffect(() => {
    if (user) {
      loadDesigns()
    }
  }, [user])

  const loadDesigns = async () => {
    await fetchDesigns()
  }

  const handleLoadDesign = async (design) => {
    try {
      // Update grid config to match design
      setGridConfig({
        rows: design.grid_rows || 6,
        cols: design.grid_cols || 22
      })

      // Load the design layout
      const result = await loadDesign(design.id)
      if (result.success) {
        setSelectedDesignId(design.id)
        toast.success(`Loaded: ${design.name}`)
        mixpanel.track('Design Loaded', {
          designId: design.id,
          designName: design.name,
          gridSize: `${design.grid_cols}x${design.grid_rows}`
        })
      } else {
        toast.error('Failed to load design')
      }
    } catch (error) {
      toast.error('Error loading design')
      mixpanel.track('Design Load Error', { error: error.message })
    }
  }

  const handleDeleteDesign = async (designId, designName) => {
    if (!confirm(`Delete "${designName}"?`)) return

    try {
      const result = await deleteDesign(designId)
      if (result.success) {
        toast.success('Design deleted')
        mixpanel.track('Design Deleted', { designId })
      } else {
        toast.error('Failed to delete design')
      }
    } catch (error) {
      toast.error('Error deleting design')
    }
  }

  const handleDuplicateDesign = async (design) => {
    const newName = `${design.name} (Copy)`
    try {
      const result = await premiumDesignService.duplicateDesign(design.id, newName)
      if (result.success) {
        toast.success('Design duplicated!')
        await loadDesigns()
        mixpanel.track('Design Duplicated', { sourceId: design.id })
      } else {
        toast.error('Failed to duplicate')
      }
    } catch (error) {
      toast.error('Error duplicating design')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (savedDesigns.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-dashed border-slate-700 text-center">
        <p className="text-gray-400 mb-2">No saved designs yet</p>
        <p className="text-xs text-gray-500">Save your first design from the editor above</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {savedDesigns.map((design) => {
        const isSelected = selectedDesignId === design.id
        return (
          <div
            key={design.id}
            className={`p-4 rounded-xl border transition-all ${
              isSelected
                ? 'bg-teal-500/10 border-teal-500/50'
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{design.name}</h3>
                  {isSelected && (
                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {design.grid_cols}×{design.grid_rows} grid • {new Date(design.created_at).toLocaleDateString()}
                </p>
                {design.description && (
                  <p className="text-xs text-gray-500 mt-1">{design.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleLoadDesign(design)}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 text-sm font-medium rounded-lg transition-colors"
              >
                {isSelected ? 'Reload' : 'Load'}
              </button>
              <button
                onClick={() => handleDuplicateDesign(design)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 text-sm font-medium rounded-lg transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={() => handleDeleteDesign(design.id, design.name)}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
