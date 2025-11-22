import { supabase } from './supabaseClient'

/**
 * Invite a collaborator to a session
 * @param {string} sessionId - The session ID
 * @param {string} email - Email of the user to invite
 * @param {string} permission - 'view' or 'edit'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function inviteCollaborator(sessionId, email, permission = 'view') {
    try {
        // First, find the user by email
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .single()

        if (userError || !userData) {
            return { success: false, error: 'User not found with that email' }
        }

        // Get current session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('shared_users')
            .eq('id', sessionId)
            .single()

        if (sessionError) {
            return { success: false, error: 'Session not found' }
        }

        // Check if user is already shared
        const sharedUsers = session.shared_users || []
        if (sharedUsers.some(u => u.user_id === userData.id)) {
            return { success: false, error: 'User is already a collaborator' }
        }

        // Add user to shared_users
        const updatedSharedUsers = [
            ...sharedUsers,
            {
                user_id: userData.id,
                email: userData.email,
                permission,
                invited_at: new Date().toISOString()
            }
        ]

        const { error: updateError } = await supabase
            .from('sessions')
            .update({ shared_users: updatedSharedUsers })
            .eq('id', sessionId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Remove a collaborator from a session
 * @param {string} sessionId - The session ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeCollaborator(sessionId, userId) {
    try {
        // Get current session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('shared_users')
            .eq('id', sessionId)
            .single()

        if (sessionError) {
            return { success: false, error: 'Session not found' }
        }

        // Remove user from shared_users
        const updatedSharedUsers = (session.shared_users || []).filter(
            u => u.user_id !== userId
        )

        const { error: updateError } = await supabase
            .from('sessions')
            .update({ shared_users: updatedSharedUsers })
            .eq('id', sessionId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Get all boards shared with the current user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getSharedBoards(userId) {
    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .contains('shared_users', [{ user_id: userId }])
            .eq('is_active', true)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Get collaborators for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getCollaborators(sessionId) {
    try {
        const { data: session, error } = await supabase
            .from('sessions')
            .select('shared_users')
            .eq('id', sessionId)
            .single()

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, data: session.shared_users || [] }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
