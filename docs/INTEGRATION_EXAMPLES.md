"""
# Premium Design Integration Examples

Quick reference for integrating premium design features into components.
"""

# Example 1: Save Design with Quota Check
# File: src/components/designer/GridEditor.jsx

```javascript
import { useDesignStore } from '../../store/designStore'
import { useAuthStore } from '../../store/authStore'
import { canUserSaveDesign } from '../../utils/designValidation'
import UpgradeModal from '../common/UpgradeModal'

export default function GridEditor() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { saveDesign, designCount, maxDesigns, currentDesign } = useDesignStore()
  const { isPremium } = useAuthStore()
  const [designName, setDesignName] = useState('')

  const handleSaveDesign = async () => {
    const { canSave, reason, requiresUpgrade } = canUserSaveDesign()

    if (!canSave) {
      if (requiresUpgrade) {
        setShowUpgradeModal(true)
      } else {
        toast.error(reason)
      }
      return
    }

    const result = await saveDesign(designName)
    if (result.success) {
      toast.success('Design saved!')
      setDesignName('')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Show quota for free tier */}
      {!isPremium && (
        <div className="text-sm text-gray-500">
          Designs: {designCount}/{maxDesigns}
          {designCount >= maxDesigns && (
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="ml-2 text-teal-500 underline"
            >
              Upgrade to save more
            </button>
          )}
        </div>
      )}

      <input
        type="text"
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
        placeholder="Design name"
        className="w-full px-3 py-2 border border-gray-300 rounded"
      />

      <button
        onClick={handleSaveDesign}
        disabled={!designName.trim()}
        className="w-full bg-teal-500 text-white py-2 rounded hover:bg-teal-600 disabled:opacity-50"
      >
        Save Design
      </button>

      {showUpgradeModal && (
        <UpgradeModal 
          message="Upgrade to Pro to save unlimited designs and organize them in collections"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  )
}
```

# Example 2: Load and Apply Saved Design
# File: src/components/designer/DesignList.jsx

```javascript
import { useDesignStore } from '../../store/designStore'
import { useSessionStore } from '../../store/sessionStore'
import { useEffect } from 'react'
import { premiumDesignService } from '../../services/premiumDesignService'

export default function DesignList() {
  const { savedDesigns, fetchDesigns, loadDesign } = useDesignStore()
  const { setGridConfig } = useSessionStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDesigns()
  }, [])

  const loadDesigns = async () => {
    setIsLoading(true)
    await fetchDesigns()
    setIsLoading(false)
  }

  const handleLoadDesign = async (design) => {
    // Update grid config to match design
    setGridConfig({
      rows: design.grid_rows,
      cols: design.grid_cols
    })

    // Load the design layout
    const result = await loadDesign(design.id)
    if (result.success) {
      toast.success(`Loaded: ${design.name}`)
    } else {
      toast.error('Failed to load design')
    }
  }

  const handleDeleteDesign = async (designId) => {
    if (confirm('Delete this design?')) {
      const result = await useDesignStore.getState().deleteDesign(designId)
      if (result.success) {
        toast.success('Design deleted')
      }
    }
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-2">
      {savedDesigns.length === 0 ? (
        <p className="text-gray-400">No saved designs yet</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {savedDesigns.map((design) => (
            <div key={design.id} className="bg-slate-800 p-3 rounded border border-slate-700">
              <h3 className="font-semibold text-white">{design.name}</h3>
              <p className="text-xs text-gray-400 mb-2">
                {design.grid_cols}x{design.grid_rows} • {new Date(design.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadDesign(design)}
                  className="flex-1 bg-teal-500 text-white py-1 text-sm rounded hover:bg-teal-600"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteDesign(design.id)}
                  className="px-3 bg-red-500/20 text-red-400 py-1 text-sm rounded hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

# Example 3: Design Collections (Pro Feature)
# File: src/components/designer/Collections.jsx

```javascript
import { useDesignStore } from '../../store/designStore'
import { useAuthStore } from '../../store/authStore'
import { canUserAccessCollections } from '../../utils/designValidation'
import { premiumDesignService } from '../../services/premiumDesignService'
import PremiumGate from '../common/PremiumGate'

export default function Collections() {
  const { designCollections, fetchCollections, createCollection, deleteCollection } = useDesignStore()
  const { user } = useAuthStore()
  const [newCollectionName, setNewCollectionName] = useState('')
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [collectionDesigns, setCollectionDesigns] = useState([])

  useEffect(() => {
    if (user) {
      loadCollections()
    }
  }, [user])

  const loadCollections = async () => {
    await fetchCollections()
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return

    const result = await createCollection(newCollectionName)
    if (result.success) {
      toast.success('Collection created!')
      setNewCollectionName('')
      await loadCollections()
    } else if (result.requiresUpgrade) {
      toast.error('Upgrade to Pro for collections')
    }
  }

  const handleSelectCollection = async (collectionId) => {
    setSelectedCollection(collectionId)
    const result = await premiumDesignService.getCollectionDesigns(collectionId)
    if (result.success) {
      setCollectionDesigns(result.data)
    }
  }

  const handleRemoveFromCollection = async (designId) => {
    const result = await premiumDesignService.removeFromCollection(selectedCollection, designId)
    if (result.success) {
      toast.success('Design removed')
      await handleSelectCollection(selectedCollection)
    }
  }

  return (
    <PremiumGate feature="collections">
      <div className="space-y-4">
        {/* Create new collection */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <h3 className="font-semibold text-white mb-2">New Collection</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
            />
            <button
              onClick={handleCreateCollection}
              className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600"
            >
              Create
            </button>
          </div>
        </div>

        {/* Collections list */}
        <div className="space-y-2">
          {designCollections.map((collection) => (
            <div
              key={collection.id}
              className={`p-3 rounded cursor-pointer border ${
                selectedCollection === collection.id
                  ? 'bg-teal-500/20 border-teal-500'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <div onClick={() => handleSelectCollection(collection.id)}>
                  <h4 className="font-semibold text-white">{collection.name}</h4>
                  <p className="text-xs text-gray-400">
                    {collection.design_collection_members?.length || 0} designs
                  </p>
                </div>
                <button
                  onClick={() => deleteCollection(collection.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Collection designs */}
        {selectedCollection && (
          <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h4 className="font-semibold text-white mb-3">Designs in Collection</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collectionDesigns.map((design) => (
                <div key={design.id} className="flex justify-between items-center p-2 bg-slate-900 rounded">
                  <span className="text-white text-sm">{design.name}</span>
                  <button
                    onClick={() => handleRemoveFromCollection(design.id)}
                    className="text-red-400 text-xs hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PremiumGate>
  )
}
```

# Example 4: Design Versioning (Pro Feature)
# File: src/components/designer/VersionHistory.jsx

```javascript
import { premiumDesignService } from '../../services/premiumDesignService'
import PremiumGate from '../common/PremiumGate'
import { useDesignStore } from '../../store/designStore'

export default function VersionHistory({ designId }) {
  const [versions, setVersions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { loadDesign } = useDesignStore()

  useEffect(() => {
    loadVersions()
  }, [designId])

  const loadVersions = async () => {
    setIsLoading(true)
    const result = await premiumDesignService.getDesignVersions(designId)
    if (result.success) {
      setVersions(result.data)
    }
    setIsLoading(false)
  }

  const handleRestoreVersion = async (versionNumber) => {
    if (!confirm('Restore this version? Current changes will be overwritten.')) return

    const result = await premiumDesignService.restoreDesignVersion(designId, versionNumber)
    if (result.success) {
      await loadDesign(designId)
      toast.success('Design restored')
      await loadVersions()
    } else {
      toast.error('Failed to restore version')
    }
  }

  return (
    <PremiumGate feature="versionHistory">
      <div className="space-y-3">
        <h3 className="font-semibold text-white">Version History</h3>
        
        {isLoading ? (
          <Spinner size="sm" />
        ) : versions.length === 0 ? (
          <p className="text-gray-400 text-sm">No versions saved yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {versions.map((version) => (
              <div key={version.id} className="bg-slate-900 p-2 rounded text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-teal-400">v{version.version_number}</span>
                  <button
                    onClick={() => handleRestoreVersion(version.version_number)}
                    className="text-teal-400 hover:text-teal-300 text-xs"
                  >
                    Restore
                  </button>
                </div>
                {version.change_description && (
                  <p className="text-gray-400 text-xs">{version.change_description}</p>
                )}
                <p className="text-gray-500 text-xs">
                  {new Date(version.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PremiumGate>
  )
}
```

# Example 5: Quota Indicator Component
# File: src/components/designer/DesignQuota.jsx

```javascript
import { useDesignStore } from '../../store/designStore'
import { useAuthStore } from '../../store/authStore'

export default function DesignQuota() {
  const { designCount, maxDesigns } = useDesignStore()
  const { isPremium } = useAuthStore()

  if (isPremium) {
    return (
      <div className="text-xs text-gray-400">
        Unlimited designs • Pro Account
      </div>
    )
  }

  const percentUsed = (designCount / maxDesigns) * 100
  const isNearLimit = percentUsed >= 80

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Design Space</span>
        <span className={isNearLimit ? 'text-yellow-600 font-semibold' : 'text-gray-400'}>
          {designCount}/{maxDesigns}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-colors ${
            percentUsed >= 100 ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-teal-500'
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      {percentUsed >= 100 && (
        <p className="text-xs text-red-400">
          Upgrade to Pro for unlimited designs
        </p>
      )}
    </div>
  )
}
```

# Example 6: Check Permission Before Action

```javascript
import { checkDesignPermission, isPremiumOperation } from '../../utils/designValidation'

// Check single action
const handleShareDesign = (designId) => {
  const { allowed, requiresUpgrade } = checkDesignPermission('share')
  
  if (!allowed) {
    showUpgradeModal(requiresUpgrade)
    return
  }
  
  // Proceed with sharing
}

// Check operation type
const handleDuplicateDesign = () => {
  if (isPremiumOperation('duplicate')) {
    // Only pro users can duplicate
    if (!isPremium) {
      showUpgradeModal()
      return
    }
  }
  
  // Proceed
}
```

---

These examples show the main integration patterns for the premium design system.
All examples use the provided store, services, and validation utilities.
