import { useEffect, useState } from 'react'
import { useDesignStore } from '../../store/designStore'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'
import { SparklesIcon, ArrowUturnLeftIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import mixpanel from '../../services/mixpanelService'
import PremiumGate from '../common/PremiumGate'

export default function VersionHistory() {
  const { currentDesign, designVersions, fetchVersions, restoreDesignVersion } = useDesignStore()
  const { isPremium, user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [expandedVersionId, setExpandedVersionId] = useState(null)

  useEffect(() => {
    if (currentDesign && isPremium) {
      loadVersions()
    }
  }, [currentDesign])

  const loadVersions = async () => {
    if (!currentDesign) return
    setIsLoading(true)
    try {
      await fetchVersions(currentDesign.id)
    } catch (error) {
      toast.error('Failed to load version history')
      console.error('Error loading versions:', error)
      mixpanel.track('Version History Load Error', { error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('Restore this version? Your current changes will be replaced.')) return

    setIsRestoring(true)
    try {
      const result = await restoreDesignVersion(currentDesign.id, versionId)
      if (result.success) {
        toast.success('Version restored!')
        await loadVersions()
        mixpanel.track('Design Version Restored', { 
          designId: currentDesign.id,
          versionId
        })
      } else {
        toast.error(result.error || 'Failed to restore version')
        mixpanel.track('Version Restore Error', { error: result.error })
      }
    } catch (error) {
      toast.error('Error restoring version')
      console.error('Error:', error)
      mixpanel.track('Version Restore Error', { error: error.message })
    } finally {
      setIsRestoring(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  const getVersionBadgeColor = (index, total) => {
    if (index === 0) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    if (index === total - 1) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
  }

  if (!isPremium) {
    return (
      <PremiumGate feature="versionHistory">
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Version History (Pro Only)</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Upgrade to Pro to track and restore previous versions of your designs.</p>
        </div>
      </PremiumGate>
    )
  }

  if (!currentDesign) {
    return (
      <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
        <SparklesIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Load a design first to see its version history</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {currentDesign.name}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Versions are automatically saved when you update your design
          </p>
        </div>
        <button
          onClick={loadVersions}
          className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : designVersions && designVersions.length === 0 ? (
        /* No Versions */
        <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
          <SparklesIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">No versions yet. Start editing to create versions!</p>
        </div>
      ) : (
        /* Versions Timeline */
        <div className="space-y-2">
          {designVersions && designVersions.map((version, index) => {
            const total = designVersions.length
            const isLatest = index === 0
            const isExpanded = expandedVersionId === version.id

            return (
              <div key={version.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedVersionId(isExpanded ? null : version.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {/* Badge */}
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getVersionBadgeColor(index, total)}`}>
                      {isLatest ? 'Latest' : `v${total - index}`}
                    </div>

                    {/* Version Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(version.created_at)}
                        </span>
                      </div>
                      {version.change_description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{version.change_description}</p>
                      )}
                    </div>
                  </div>

                  {/* Restore Button */}
                  {!isLatest && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestoreVersion(version.id)
                      }}
                      disabled={isRestoring}
                      className="ml-auto px-3 py-2 text-xs font-medium text-white bg-teal-600 rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isRestoring ? (
                        <>
                          <Spinner size="sm" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <ArrowUturnLeftIcon className="w-3 h-3" />
                          Restore
                        </>
                      )}
                    </button>
                  )}
                </button>

                {/* Expanded Version Details */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Grid Size</p>
                        <p className="text-slate-900 dark:text-slate-100">{version.grid_cols} × {version.grid_rows}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Timestamp</p>
                        <p className="text-slate-900 dark:text-slate-100 font-mono text-xs">{new Date(version.created_at).toISOString()}</p>
                      </div>
                    </div>

                    {version.change_description && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Change Notes</p>
                        <p className="text-slate-700 dark:text-slate-300">{version.change_description}</p>
                      </div>
                    )}

                    {isLatest && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded mt-2">
                        <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">This is the current version of your design</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info Section */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">How It Works</h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• New versions are created automatically when you save changes</li>
          <li>• You can restore any previous version at any time</li>
          <li>• Version history is unlimited with your Pro subscription</li>
          <li>• Free users can only keep the current version</li>
        </ul>
      </div>
    </div>
  )
}
