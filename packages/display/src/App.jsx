import React, { useEffect } from 'react'
import { useModeStore } from '@flipboard/web/src/store/modeStore'
import DisplayView from '@flipboard/web/src/components/DisplayView'
import { useAuthStore } from '@flipboard/web/src/store/authStore'

/**
 * Display App - Optimized display-only interface
 * Auto-selects display mode and shows fullscreen split-flap display
 */
export default function App() {
  const { initialize } = useAuthStore()
  const setMode = useModeStore((state) => state.setMode)

  useEffect(() => {
    // Initialize auth and force display mode
    initialize()
    setMode('display')
  }, [initialize, setMode])

  return (
    <div className="w-full h-screen overflow-hidden">
      <DisplayView />
    </div>
  )
}
