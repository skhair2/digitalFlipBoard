/**
 * Premium Design Service
 * Handles database operations for premium design features
 */

import { supabase } from './supabaseClient'
import { useAuthStore } from '../store/authStore'
import mixpanel from './mixpanelService'

export const premiumDesignService = {
  /**
   * Fetch all designs for current user
   */
  async fetchUserDesigns() {
    try {
      const { user } = useAuthStore.getState()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('premium_designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      mixpanel.track('Design Service Error', { operation: 'fetchUserDesigns', error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * Fetch single design by ID
   */
  async getDesignById(designId) {
    try {
      const { data, error } = await supabase
        .from('premium_designs')
        .select('*')
        .eq('id', designId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get version history for a design
   */
  async getDesignVersions(designId) {
    try {
      const { data, error } = await supabase
        .from('design_versions')
        .select('*')
        .eq('design_id', designId)
        .order('version_number', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Restore design to previous version
   */
  async restoreDesignVersion(designId, versionNumber) {
    try {
      const { data: version, error: vError } = await supabase
        .from('design_versions')
        .select('layout')
        .eq('design_id', designId)
        .eq('version_number', versionNumber)
        .single()

      if (vError) throw vError

      const { data, error } = await supabase
        .from('premium_designs')
        .update({
          layout: version.layout,
          version: versionNumber
        })
        .eq('id', designId)
        .select()
        .single()

      if (error) throw error
      mixpanel.track('Design Version Restored', { designId, versionNumber })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Create design version snapshot
   */
  async createDesignVersion(designId, description = null) {
    try {
      const { user } = useAuthStore.getState()
      if (!user) throw new Error('User not authenticated')

      // Get current design
      const { data: design, error: designError } = await supabase
        .from('premium_designs')
        .select('layout, version')
        .eq('id', designId)
        .single()

      if (designError) throw designError

      // Create version record
      const { data, error } = await supabase
        .from('design_versions')
        .insert([{
          design_id: designId,
          version_number: design.version + 1,
          layout: design.layout,
          changed_by: user.id,
          change_description: description
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get design usage statistics
   */
  async getDesignStats(userId) {
    try {
      const { data: designs, error: designsError } = await supabase
        .from('premium_designs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      if (designsError) throw designsError

      const { data: collections, error: collectionsError } = await supabase
        .from('design_collections')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      if (collectionsError) throw collectionsError

      const { data: likes, error: likesError } = await supabase
        .from('design_likes')
        .select('*', { count: 'exact' })
        .in('design_id', designs?.map(d => d.id) || [])

      if (likesError && likesError.code !== 'PGRST116') throw likesError

      return {
        success: true,
        data: {
          totalDesigns: designs?.length || 0,
          totalCollections: collections?.length || 0,
          totalLikes: likes?.length || 0
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Search designs by name or tags
   */
  async searchDesigns(query, userId) {
    try {
      const { data, error } = await supabase
        .from('premium_designs')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,tags.cs.{"${query}"}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Fetch user's design collections
   */
  async fetchCollections(userId) {
    try {
      const { data, error } = await supabase
        .from('design_collections')
        .select(`
          *,
          design_collection_members(design_id, position)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Get designs in a collection
   */
  async getCollectionDesigns(collectionId) {
    try {
      const { data, error } = await supabase
        .from('design_collection_members')
        .select(`
          position,
          premium_designs(*)
        `)
        .eq('collection_id', collectionId)
        .order('position', { ascending: true })

      if (error) throw error
      return { success: true, data: data?.map(m => ({ ...m.premium_designs, position: m.position })) || [] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Remove design from collection
   */
  async removeFromCollection(collectionId, designId) {
    try {
      const { error } = await supabase
        .from('design_collection_members')
        .delete()
        .eq('collection_id', collectionId)
        .eq('design_id', designId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Reorder designs in collection
   */
  async reorderCollection(collectionId, designs) {
    try {
      // Delete and recreate with new positions
      const { error: deleteError } = await supabase
        .from('design_collection_members')
        .delete()
        .eq('collection_id', collectionId)

      if (deleteError) throw deleteError

      const members = designs.map((designId, idx) => ({
        collection_id: collectionId,
        design_id: designId,
        position: idx
      }))

      const { error: insertError } = await supabase
        .from('design_collection_members')
        .insert(members)

      if (insertError) throw insertError
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Like/Unlike a design
   */
  async toggleDesignLike(designId, liked) {
    try {
      const { user } = useAuthStore.getState()
      if (!user) throw new Error('User not authenticated')

      if (liked) {
        const { error } = await supabase
          .from('design_likes')
          .delete()
          .eq('design_id', designId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('design_likes')
          .insert([{ design_id: designId, user_id: user.id }])

        if (error) throw error
      }

      mixpanel.track('Design Like Toggled', { designId, liked: !liked })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Check if user likes a design
   */
  async checkDesignLike(designId, userId) {
    try {
      const { data, error } = await supabase
        .from('design_likes')
        .select('id')
        .eq('design_id', designId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return { success: true, liked: !!data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Export design as JSON
   */
  async exportDesignAsJSON(designId) {
    try {
      const { data, error } = await supabase
        .from('premium_designs')
        .select('*')
        .eq('id', designId)
        .single()

      if (error) throw error

      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      mixpanel.track('Design Exported', { designId, format: 'json' })
      return { success: true, url, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Duplicate a design
   */
  async duplicateDesign(designId, newName) {
    try {
      const { user } = useAuthStore.getState()
      if (!user) throw new Error('User not authenticated')

      const { data: original, error: fetchError } = await supabase
        .from('premium_designs')
        .select('*')
        .eq('id', designId)
        .single()

      if (fetchError) throw fetchError

      const { data, error } = await supabase
        .from('premium_designs')
        .insert([{
          user_id: user.id,
          name: newName,
          description: `Copy of ${original.name}`,
          layout: original.layout,
          grid_rows: original.grid_rows,
          grid_cols: original.grid_cols
        }])
        .select()
        .single()

      if (error) throw error
      mixpanel.track('Design Duplicated', { sourceDesignId: designId, newDesignId: data.id })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}
