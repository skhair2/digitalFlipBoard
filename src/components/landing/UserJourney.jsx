import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { USER_JOURNEYS } from '../../data/userJourneys'
import { useAuthStore } from '../../store/authStore'
import { motion } from 'framer-motion'
import { Button } from '../ui/Components'

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (index) => ({ opacity: 1, y: 0, transition: { delay: index * 0.1 } })
}

const JourneyStep = ({ step, index }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-semibold">
      {index + 1}
    </div>
    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
  </div>
)

export default function UserJourney() {
  const navigate = useNavigate()
  const { user, isPremium } = useAuthStore()

  const activeJourneyId = useMemo(() => {
    if (isPremium) return 'pro'
    if (user) return 'free'
    return 'anonymous'
  }, [user, isPremium])

  return (
    <section className="py-24 bg-slate-950/80 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <p className="uppercase tracking-[0.4em] text-teal-400 text-xs mb-4">User Journey</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Pick up right where you are
          </h2>
          <p className="text-slate-400 text-lg">
            Whether you are just peeking at the split-flap magic, pairing your first display, or orchestrating multiple boards—Digital FlipBoard adapts to your moment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {USER_JOURNEYS.map((journey, index) => {
            const isActive = journey.id === activeJourneyId
            return (
              <motion.div
                key={journey.id}
                className={`rounded-3xl border transition-all duration-300 p-6 bg-gradient-to-br ${
                  isActive
                    ? 'from-teal-500/15 to-cyan-500/10 border-teal-500/40 shadow-[0_0_35px_rgba(45,212,191,0.25)]'
                    : 'from-slate-900/60 to-slate-900 border-white/5 hover:border-white/10'
                }`}
                variants={cardVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                custom={index}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">{journey.persona}</p>
                    <h3 className="text-xl font-semibold text-white">{journey.label}</h3>
                  </div>
                  {isActive && (
                    <span className="text-xs text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
                      You are here
                    </span>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  {journey.steps.map((step, stepIndex) => (
                    <JourneyStep key={step} step={step} index={stepIndex} />
                  ))}
                </div>

                <div className="text-sm text-slate-400 mb-6 italic">
                  {journey.highlight}
                </div>

                <Button
                  variant={isActive ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => navigate(journey.route)}
                >
                  {journey.cta}
                </Button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
