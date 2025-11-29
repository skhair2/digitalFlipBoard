import { motion } from 'framer-motion'
import { usePlanLimits } from '../../hooks/usePlanLimits'

const MotionDiv = motion.div

export default function PlanLimitsBanner({ feature, message, showUpgradeButton = true }) {
  const { plan, isPro, isPremium } = usePlanLimits()

  if (!feature || (isPro && feature !== 'advanced')) {
    return null
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-amber-200">{message}</p>
          <p className="text-xs text-amber-300 mt-1">
            Current plan: <span className="font-semibold">{plan?.name || 'Free'}</span>
          </p>
        </div>
        {showUpgradeButton && !isPremium && (
          <a
            href="/upgrade"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-white text-sm font-medium rounded-lg transition-all"
          >
            Upgrade
          </a>
        )}
      </div>
    </MotionDiv>
  )
}
