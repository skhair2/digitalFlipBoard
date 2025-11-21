import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import VestaboardGrid from '../components/display/VestaboardGrid'
import SessionCode from '../components/display/SessionCode'
import { useSessionStore } from '../store/sessionStore'
import mixpanel from '../services/mixpanelService'

export default function Display() {
    const { isConnected, setSessionCode, setBoardId, setConnected, isClockMode } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [timeString, setTimeString] = useState('')

    useEffect(() => {
        const boardId = searchParams.get('boardId')
        if (boardId) {
            setBoardId(boardId)
            setSessionCode(boardId)
            setConnected(true)
        }
        mixpanel.track('Display Page Viewed', { boardId: boardId || 'temporary' })
    }, [searchParams, setBoardId, setSessionCode, setConnected])

    // Clock Mode Logic
    useEffect(() => {
        if (isClockMode) {
            const updateTime = () => {
                const now = new Date()
                // Format: HH:MM with blinking colon effect could be cool, but simple for now
                const hours = String(now.getHours()).padStart(2, '0')
                const minutes = String(now.getMinutes()).padStart(2, '0')
                setTimeString(`${hours}:${minutes}`)
            }
            updateTime()
            const interval = setInterval(updateTime, 1000)
            return () => clearInterval(interval)
        }
    }, [isClockMode])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                setIsFullscreen(false)
            }
        }
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden relative group/display">
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-50 pointer-events-none" />

            <div className="z-10 w-full max-w-[90vw] flex flex-col items-center gap-8">
                <VestaboardGrid overrideMessage={isClockMode ? timeString : null} />

                {/* Only show session code if NOT a managed board */}
                {!searchParams.get('boardId') && (
                    <div className={`transition-opacity duration-500 ${isConnected ? 'opacity-0' : 'opacity-100'}`}>
                        <SessionCode />
                    </div>
                )}
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-4 right-4 flex items-center gap-4 opacity-0 group-hover/display:opacity-100 transition-opacity duration-300">
                <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Status indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500 font-mono uppercase">
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </div>
    )
}
