import Logo from '../ui/Logo'

export default function BrandingWatermark({ className = '' }) {
    return (
        <div
            className={`fixed bottom-6 left-6 flex items-center gap-3 z-50 group/watermark opacity-15 ${className}`}
        >
            {/* Logo with pulse animation */}
            <div
                className="group-hover/watermark:opacity-40 transition-opacity duration-300"
            >
                <Logo className="w-8 h-8" />
            </div>

            {/* Wordmark */}
            <span
                className="text-white text-sm font-medium opacity-20 group-hover/watermark:opacity-50 transition-opacity duration-300"
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                FlipDisplay.online
            </span>

            {/* Optional tooltip on click */}
            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-800/90 backdrop-blur-sm rounded-lg text-xs text-white opacity-0 group-hover/watermark:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Powered by FlipDisplay.online
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/90" />
            </div>
        </div>
    )
}
