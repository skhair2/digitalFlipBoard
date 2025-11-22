import { useAuthStore } from '../store/authStore'
import { useBoardStore } from '../store/boardStore'
import { useDesignStore } from '../store/designStore'

export const FEATURES = {
    UNLIMITED_BOARDS: 'unlimited_boards',
    UNLIMITED_DESIGNS: 'unlimited_designs',
    SCHEDULED_MESSAGES: 'scheduled_messages',
    PREMIUM_WIDGETS: 'premium_widgets',
    REMOVE_BRANDING: 'remove_branding',
    PRIORITY_SUPPORT: 'priority_support'
}

export const LIMITS = {
    free: {
        boards: 1,
        designs: 3
    },
    pro: {
        boards: Infinity,
        designs: Infinity
    },
    enterprise: {
        boards: Infinity,
        designs: Infinity
    }
}

export function useFeatureGate() {
    const { isPremium, profile } = useAuthStore()
    const { boards } = useBoardStore()
    const { savedDesigns } = useDesignStore()

    const tier = profile?.subscription_tier || 'free'
    const currentLimits = LIMITS[tier]

    const checkAccess = (feature) => {
        if (tier === 'enterprise') return true
        if (tier === 'pro') return true

        // Free tier restrictions
        switch (feature) {
            case FEATURES.SCHEDULED_MESSAGES:
            case FEATURES.PREMIUM_WIDGETS:
            case FEATURES.REMOVE_BRANDING:
            case FEATURES.PRIORITY_SUPPORT:
                return false
            default:
                return true
        }
    }

    const checkLimit = (type) => {
        if (tier === 'pro' || tier === 'enterprise') return false // No limits

        if (type === 'boards') {
            return boards.length >= currentLimits.boards
        }
        if (type === 'designs') {
            return savedDesigns.length >= currentLimits.designs
        }
        return false
    }

    return {
        canAccess: checkAccess,
        isLimitReached: checkLimit,
        currentUsage: {
            boards: boards.length,
            designs: savedDesigns.length
        },
        maxLimits: currentLimits,
        isPremium
    }
}
