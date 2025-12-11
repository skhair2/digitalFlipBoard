import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { planLimitsService } from '../services/planLimitsService'

/**
 * Hook to check user's plan limits and permissions
 */
export const usePlanLimits = () => {
  const { user } = useAuthStore()
  const [plan, setPlan] = useState(null)
  const [role, setRole] = useState(null)
  const [limits, setLimits] = useState({
    canCreateSession: true,
    canSendMessage: true,
    canScheduleMessages: false,
    canUseDesigner: false,
    canShareBoards: false,
    isAdmin: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchPlanLimits = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user's plan
        const planData = await planLimitsService.getUserPlan(user.id)
        setPlan(planData.plan)
        setRole(planData.role)

        // Get limits
        const [
          sessionLimit,
          messageLimit,
          scheduleLimit,
          designerLimit,
          sharingLimit,
          adminStatus
        ] = await Promise.all([
          planLimitsService.canCreateSession(user.id, 0),
          planLimitsService.canSendMessage(user.id, 0),
          planLimitsService.canScheduleMessages(user.id),
          planLimitsService.canUseDesigner(user.id),
          planLimitsService.canShareBoards(user.id),
          planLimitsService.isAdmin(user.id)
        ])

        setLimits({
          canCreateSession: sessionLimit.allowed,
          canSendMessage: messageLimit.allowed,
          canScheduleMessages: scheduleLimit.allowed,
          canUseDesigner: designerLimit.allowed,
          canShareBoards: sharingLimit.allowed,
          isAdmin: adminStatus.isAdmin,
          maxDisplays: sessionLimit.limit,
          maxMessagesPerDay: messageLimit.limit,
          maxScheduledMessages: scheduleLimit.limit,
          remainingMessages: messageLimit.remaining
        })
      } catch (err) {
        console.error('Error fetching plan limits:', err)
        setError(err.message)
        // Set sensible defaults
        setLimits({
          canCreateSession: true,
          canSendMessage: true,
          canScheduleMessages: false,
          canUseDesigner: false,
          canShareBoards: false,
          isAdmin: false,
          maxDisplays: 1,
          maxMessagesPerDay: 50,
          maxScheduledMessages: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPlanLimits()
  }, [user?.id])

  return {
    plan,
    role,
    limits,
    loading,
    error,
    isPremium: plan?.slug === 'premium',
    isPro: plan?.slug === 'pro' || plan?.slug === 'premium',
    isFree: plan?.slug === 'free' || !plan,
    isAdmin: limits.isAdmin
  }
}
