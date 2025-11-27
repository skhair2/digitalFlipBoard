import { supabase } from './supabaseClient'

/**
 * Plan Limits Service
 * Checks user's subscription plan and enforces feature limits
 */

export const planLimitsService = {
  /**
   * Get user's current subscription plan with all limits
   */
  getUserPlan: async (userId) => {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          started_at,
          expires_at,
          auto_renew,
          subscription_plans(
            id,
            name,
            slug,
            price,
            max_displays,
            max_messages_per_day,
            max_scheduled_messages,
            features
          ),
          user_roles(
            id,
            name,
            permissions
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) throw error

      return {
        success: true,
        plan: subscription?.subscription_plans || null,
        role: subscription?.user_roles || null,
        subscription: subscription
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
      // Default to Free plan on error
      return {
        success: false,
        plan: {
          name: 'Free',
          slug: 'free',
          max_displays: 1,
          max_messages_per_day: 50,
          max_scheduled_messages: 0,
          features: {
            can_create_sessions: true,
            can_send_messages: true,
            can_view_boards: true,
            can_use_designer: false,
            can_schedule_messages: false,
            can_share_boards: false,
            max_saved_designs: 3
          }
        }
      }
    }
  },

  /**
   * Get all available plans
   */
  getAllPlans: async () => {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error

      return {
        success: true,
        plans: plans || []
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      return {
        success: false,
        plans: []
      }
    }
  },

  /**
   * Check if user can create a new session
   */
  canCreateSession: async (userId, currentSessionCount = 0) => {
    const { plan } = await planLimitsService.getUserPlan(userId)
    
    if (!plan) return { allowed: false, reason: 'No plan found' }

    const maxDisplays = plan.max_displays || 1
    const isAllowed = currentSessionCount < maxDisplays

    return {
      allowed: isAllowed,
      limit: maxDisplays,
      current: currentSessionCount,
      reason: !isAllowed ? `You've reached the limit of ${maxDisplays} displays on your plan` : null
    }
  },

  /**
   * Check if user can send a message today
   */
  canSendMessage: async (userId, messagesCountToday = 0) => {
    const { plan } = await planLimitsService.getUserPlan(userId)
    
    if (!plan) return { allowed: false, reason: 'No plan found' }

    const maxMessages = plan.max_messages_per_day || 50
    const isAllowed = messagesCountToday < maxMessages

    return {
      allowed: isAllowed,
      limit: maxMessages,
      current: messagesCountToday,
      remaining: Math.max(0, maxMessages - messagesCountToday),
      reason: !isAllowed ? `Daily message limit reached (${maxMessages})` : null
    }
  },

  /**
   * Check if user can schedule messages
   */
  canScheduleMessages: async (userId) => {
    const { plan } = await planLimitsService.getUserPlan(userId)
    
    if (!plan) return { allowed: false, reason: 'No plan found' }

    const canSchedule = plan.features?.can_schedule_messages || false
    const maxScheduled = plan.max_scheduled_messages || 0

    return {
      allowed: canSchedule,
      limit: maxScheduled,
      feature: 'Schedule Messages',
      reason: !canSchedule ? 'This feature requires a Pro or Premium plan' : null
    }
  },

  /**
   * Check if user can use the designer
   */
  canUseDesigner: async (userId) => {
    const { plan } = await planLimitsService.getUserPlan(userId)
    
    if (!plan) return { allowed: false, reason: 'No plan found' }

    const canUseDesigner = plan.features?.can_use_designer || false

    return {
      allowed: canUseDesigner,
      feature: 'Designer Tool',
      reason: !canUseDesigner ? 'Designer tool requires a Pro or Premium plan' : null
    }
  },

  /**
   * Check if user can share boards
   */
  canShareBoards: async (userId) => {
    const { plan } = await planLimitsService.getUserPlan(userId)
    
    if (!plan) return { allowed: false, reason: 'No plan found' }

    const canShare = plan.features?.can_share_boards || false

    return {
      allowed: canShare,
      feature: 'Share Boards',
      reason: !canShare ? 'Board sharing requires a Pro or Premium plan' : null
    }
  },

  /**
   * Check if user can save designs
   */
  canSaveDesign: async (userId, currentDesignCount = 0) => {
    const { plan } = await planLimitsService.getUserPlan(userId)
    
    if (!plan) return { allowed: false, reason: 'No plan found' }

    const maxDesigns = plan.features?.max_saved_designs || 3
    const isAllowed = currentDesignCount < maxDesigns

    return {
      allowed: isAllowed,
      limit: maxDesigns,
      current: currentDesignCount,
      remaining: Math.max(0, maxDesigns - currentDesignCount),
      reason: !isAllowed ? `Design limit reached (${maxDesigns}) on your plan` : null
    }
  },

  /**
   * Check if user is admin
   */
  isAdmin: async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error

      return {
        isAdmin: profile?.role === 'admin',
        role: profile?.role || 'user'
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      return {
        isAdmin: false,
        role: 'user'
      }
    }
  },

  /**
   * Get user's subscription status
   */
  getSubscriptionStatus: async (userId) => {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          expires_at,
          auto_renew,
          subscription_plans(name, slug)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) throw error

      const now = new Date()
      const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null
      const isExpiring = expiresAt && (expiresAt.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000 // 7 days

      return {
        success: true,
        plan: subscription?.subscription_plans?.name || 'Free',
        status: subscription?.status || 'active',
        expiresAt,
        autoRenew: subscription?.auto_renew || false,
        isExpiring,
        daysUntilExpiry: expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      return {
        success: false,
        plan: 'Free',
        status: 'active'
      }
    }
  },

  /**
   * Format plan limits for display
   */
  formatPlanLimits: (plan) => {
    if (!plan) return null

    return {
      name: plan.name,
      displayLimit: `${plan.max_displays} ${plan.max_displays === 1 ? 'display' : 'displays'}`,
      messagesPerDay: `${plan.max_messages_per_day} messages/day`,
      scheduledMessages: `${plan.max_scheduled_messages} scheduled messages`,
      designCount: plan.features?.max_saved_designs || 0,
      features: {
        designer: plan.features?.can_use_designer || false,
        scheduling: plan.features?.can_schedule_messages || false,
        sharing: plan.features?.can_share_boards || false,
        analytics: plan.features?.analytics || false,
        prioritySupport: plan.features?.priority_support || false,
        customBranding: plan.features?.custom_branding || false,
        apiAccess: plan.features?.api_access || false
      }
    }
  }
}
