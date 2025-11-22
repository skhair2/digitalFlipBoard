export const USER_JOURNEYS = [
  {
    id: 'anonymous',
    label: 'Anonymous Visitor',
    persona: 'Curious visitor checking out the retro board',
    cta: 'Preview Display',
    route: '/display',
    steps: [
      'Land on marketing site from social/search',
      'Watch hero preview and skim “How It Works”',
      'Try display demo with watermark and limited themes',
      'Prompted to sign up when attempting to pair controller or save anything'
    ],
    highlight: 'Encourage signup by showcasing limited live preview and upgrade prompts.'
  },
  {
    id: 'free',
    label: 'Signed-In Free User',
    persona: 'Experimenting with basic sessions',
    cta: 'Open Controller',
    route: '/control',
    steps: [
      'Complete Supabase login and land on Dashboard onboarding checklist',
      'Spin up first temporary session and pair a display',
      'Send basic text with default themes and 6x22 grid',
      'Hit save/design/scheduler limits and see contextual upgrade nudges'
    ],
    highlight: 'Celebrate first successful pairing and make upgrade moments obvious when limits hit.'
  },
  {
    id: 'pro',
    label: 'Pro Plan Member',
    persona: 'Runs permanent displays with premium features',
    cta: 'Go to Dashboard',
    route: '/dashboard',
    steps: [
      'Upgrade confirmation shows unlocked perks',
      'Create managed boards with persistent session codes',
      'Design boards with premium themes, collections, scheduler',
      'Invite collaborators and monitor analytics in dashboard insights'
    ],
    highlight: 'Remove friction, surface advanced tooling, and highlight ROI (uptime, sharing, analytics).'
  }
]
