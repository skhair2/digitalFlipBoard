import { AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'

export default function ControlOverlay({
    isVisible,
    isFullscreen,
    onToggleFullscreen,
    onShowInfo,
    onShowSettings
}) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-6 right-6 z-[100]"
                >
                    {/* Glassmorphism Panel */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/50">
                        <div className="flex flex-col gap-2">
                            {/* Fullscreen Toggle */}
                            <button
                                onClick={onToggleFullscreen}
                                className="p-3 text-white bg-white/5 hover:bg-primary-500/20 rounded-xl transition-all duration-200 group relative"
                                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
                                aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
                            >
                                {isFullscreen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    </svg>
                                )}
                                {/* Teal glow on hover */}
                                <div className="absolute inset-0 rounded-xl bg-primary-500/0 group-hover:bg-primary-500/10 transition-all duration-200" />
                            </button>

                            {/* Info Button */}
                            <button
                                onClick={onShowInfo}
                                className="p-3 text-white bg-white/5 hover:bg-primary-500/20 rounded-xl transition-all duration-200 group relative"
                                title="Show Info (I)"
                                aria-label="Show session information"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                </svg>
                                <div className="absolute inset-0 rounded-xl bg-primary-500/0 group-hover:bg-primary-500/10 transition-all duration-200" />
                            </button>

                            {/* Settings Button */}
                            <button
                                onClick={onShowSettings}
                                className="p-3 text-white bg-white/5 hover:bg-primary-500/20 rounded-xl transition-all duration-200 group relative"
                                title="Settings"
                                aria-label="Open settings"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                                <div className="absolute inset-0 rounded-xl bg-primary-500/0 group-hover:bg-primary-500/10 transition-all duration-200" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

ControlOverlay.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    isFullscreen: PropTypes.bool.isRequired,
    onToggleFullscreen: PropTypes.func.isRequired,
    onShowInfo: PropTypes.func,
    onShowSettings: PropTypes.func,
}
