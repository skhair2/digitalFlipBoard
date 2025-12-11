/**
 * Design Management Utilities
 * Handles premium design feature logic, validation, and subscription checks
 */

import { useAuthStore } from '../store/authStore'
import { useDesignStore } from '../store/designStore'

/**
 * Check if user can save designs (premium feature)
 * @returns {{ canSave: boolean, reason?: string, requiresUpgrade: boolean }}
 */
export const canUserSaveDesign = () => {
  const { user, isPremium } = useAuthStore.getState()
  const { designCount, maxDesigns } = useDesignStore.getState()

  if (!user) {
    return {
      canSave: false,
      reason: 'You must be logged in to save designs',
      requiresUpgrade: false
    }
  }

  // Free tier has design limit
  if (!isPremium && designCount >= maxDesigns) {
    return {
      canSave: false,
      reason: `Free tier limited to ${maxDesigns} designs. Upgrade to Pro for unlimited designs.`,
      requiresUpgrade: true
    }
  }

  return { canSave: true, requiresUpgrade: false }
}

/**
 * Check if user can access design collections (Pro feature)
 * @returns {{ canAccess: boolean, reason?: string, requiresUpgrade: boolean }}
 */
export const canUserAccessCollections = () => {
  const { isPremium } = useAuthStore.getState()

  if (!isPremium) {
    return {
      canAccess: false,
      reason: 'Design Collections are a Pro feature. Upgrade now to organize your designs.',
      requiresUpgrade: true
    }
  }

  return { canAccess: true, requiresUpgrade: false }
}

/**
 * Check if user can perform design action (premium feature)
 * @param {string} action - The action to check (save, load, delete, duplicate, share)
 * @returns {{ allowed: boolean, reason?: string, requiresUpgrade: boolean }}
 */
export const checkDesignPermission = (action) => {
  const { user, isPremium } = useAuthStore.getState()

  if (!user) {
    return {
      allowed: false,
      reason: 'You must be logged in',
      requiresUpgrade: false
    }
  }

  // Free tier restrictions
  if (!isPremium) {
    const restrictedActions = ['share', 'duplicate', 'create_collection', 'make_template']
    if (restrictedActions.includes(action)) {
      return {
        allowed: false,
        reason: `${action} is a Pro feature`,
        requiresUpgrade: true
      }
    }
  }

  return { allowed: true, requiresUpgrade: false }
}

/**
 * Format design for display (summary)
 * @param {Object} design - The design object from database
 * @returns {Object} Formatted design summary
 */
export const formatDesignSummary = (design) => {
  if (!design) return null

  return {
    id: design.id,
    name: design.name,
    description: design.description,
    gridSize: `${design.grid_cols}x${design.grid_rows}`,
    createdAt: new Date(design.created_at),
    updatedAt: new Date(design.updated_at),
    version: design.version,
    isTemplate: design.is_template || false,
    thumbnailUrl: design.thumbnail_url
  }
}

/**
 * Validate design data before saving
 * @param {Object} design - Design data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateDesign = (design) => {
  const errors = []

  if (!design) {
    errors.push('Design data is required')
    return { valid: false, errors }
  }

  if (!design.name || design.name.trim().length === 0) {
    errors.push('Design name is required')
  }

  if (design.name && design.name.length > 255) {
    errors.push('Design name must be 255 characters or less')
  }

  if (design.description && design.description.length > 1000) {
    errors.push('Design description must be 1000 characters or less')
  }

  if (!Array.isArray(design.layout) || design.layout.length === 0) {
    errors.push('Design layout is required')
  }

  if (design.grid_rows && (design.grid_rows < 1 || design.grid_rows > 100)) {
    errors.push('Grid rows must be between 1 and 100')
  }

  if (design.grid_cols && (design.grid_cols < 1 || design.grid_cols > 100)) {
    errors.push('Grid columns must be between 1 and 100')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate design storage usage (rough estimate in bytes)
 * @param {Array} designLayout - The layout array
 * @returns {number} Estimated size in bytes
 */
export const estimateDesignSize = (designLayout) => {
  if (!Array.isArray(designLayout)) return 0
  
  // Rough estimate: ~30 bytes per cell
  return designLayout.length * 30
}

/**
 * Get user's design tier limits based on subscription
 * @param {string} subscriptionTier - The user's subscription tier
 * @returns {Object} Tier limits
 */
export const getDesignTierLimits = (subscriptionTier = 'free') => {
  const tierLimits = {
    free: {
      maxDesigns: 5,
      maxCollections: 0,
      canShareDesigns: false,
      canCreateTemplates: false,
      maxStorageBytes: 5 * 1024 * 1024, // 5MB
      versionHistory: false
    },
    pro: {
      maxDesigns: 999999, // Unlimited
      maxCollections: 20,
      canShareDesigns: true,
      canCreateTemplates: true,
      maxStorageBytes: 500 * 1024 * 1024, // 500MB
      versionHistory: true
    },
    enterprise: {
      maxDesigns: 999999,
      maxCollections: 999999,
      canShareDesigns: true,
      canCreateTemplates: true,
      maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
      versionHistory: true
    }
  }

  return tierLimits[subscriptionTier] || tierLimits.free
}

/**
 * Check if design operation requires Premium
 * @param {string} operation - The operation type
 * @returns {boolean} True if premium required
 */
export const isPremiumOperation = (operation) => {
  const premiumOps = [
    'save_design',
    'create_collection',
    'share_design',
    'make_template',
    'version_history',
    'bulk_export'
  ]
  return premiumOps.includes(operation)
}
