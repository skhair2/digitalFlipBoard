import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { QrCodeIcon, LinkIcon } from '@heroicons/react/24/outline'

export default function QRCodeDisplay({ sessionCode, controlUrl }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!sessionCode || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const size = 200

        // Clear canvas with a slight off-white for better integration
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, 0, size, size)

        // Draw a simple grid pattern as placeholder
        ctx.fillStyle = '#0f172a'
        const cellSize = size / 10

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const hash = sessionCode.charCodeAt(i % sessionCode.length) + i + j
                if (hash % 2 === 0) {
                    ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
                }
            }
        }

        const markerSize = cellSize * 3
        const drawMarker = (x, y) => {
            ctx.fillStyle = '#0f172a'
            ctx.fillRect(x, y, markerSize, markerSize)
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(x + cellSize, y + cellSize, cellSize, cellSize)
            ctx.fillStyle = '#0f172a'
            ctx.fillRect(x + cellSize * 1.2, y + cellSize * 1.2, cellSize * 0.6, cellSize * 0.6)
        }

        drawMarker(0, 0)
        drawMarker(size - markerSize, 0)
        drawMarker(0, size - markerSize)

    }, [sessionCode])

    const fullUrl = controlUrl || `${window.location.origin}/control?session=${sessionCode}`

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
        >
            {/* QR Code Container */}
            <div className="relative group">
                <div className="absolute -inset-4 bg-teal-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white p-5 rounded-[2rem] shadow-2xl border border-slate-200">
                    <canvas
                        ref={canvasRef}
                        width={200}
                        height={200}
                        className="block rounded-xl"
                        aria-label={`QR code for session ${sessionCode}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity">
                        <QrCodeIcon className="w-20 h-20 text-slate-900" />
                    </div>
                </div>
            </div>

            {/* Instruction Text */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <LinkIcon className="w-3 h-3" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                        Direct Access Protocol
                    </p>
                </div>
                <p className="text-teal-400 font-mono text-lg font-black tracking-wider">
                    {window.location.hostname}/control
                </p>
            </div>
        </motion.div>
    )
}

QRCodeDisplay.propTypes = {
    sessionCode: PropTypes.string.isRequired,
    controlUrl: PropTypes.string,
}
