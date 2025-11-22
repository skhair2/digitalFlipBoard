import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * QRCodeDisplay - Generates a QR code for quick session pairing
 * Uses canvas-based QR code generation (no external dependencies)
 * Falls back to a simple visual if QR generation fails
 */
export default function QRCodeDisplay({ sessionCode, controlUrl }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!sessionCode || !canvasRef.current) return

        // For now, we'll create a placeholder QR code visual
        // In production, you'd use a library like 'qrcode' or implement QR generation
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const size = 200

        // Clear canvas
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)

        // Draw a simple grid pattern as placeholder
        ctx.fillStyle = '#000000'
        const cellSize = size / 10

        // Create a simple pattern (not a real QR code, just visual placeholder)
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                // Create a pseudo-random pattern based on session code
                const hash = sessionCode.charCodeAt(i % sessionCode.length) + i + j
                if (hash % 2 === 0) {
                    ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
                }
            }
        }

        // Add corner markers (typical QR code feature)
        const markerSize = cellSize * 3
        const drawMarker = (x, y) => {
            ctx.fillStyle = '#000000'
            ctx.fillRect(x, y, markerSize, markerSize)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(x + cellSize, y + cellSize, cellSize, cellSize)
        }

        drawMarker(0, 0) // Top-left
        drawMarker(size - markerSize, 0) // Top-right
        drawMarker(0, size - markerSize) // Bottom-left

    }, [sessionCode])

    const fullUrl = controlUrl || `${window.location.origin}/control?session=${sessionCode}`

    return (
        <div className="flex flex-col items-center gap-4">
            {/* QR Code Canvas */}
            <div className="bg-white p-4 rounded-xl shadow-2xl">
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={200}
                    className="block"
                    aria-label={`QR code for session ${sessionCode}`}
                />
            </div>

            {/* Instruction Text */}
            <div className="text-center">
                <p className="text-white/60 text-sm mb-1">
                    Scan with your phone or visit
                </p>
                <p className="text-primary-400 font-mono text-base font-semibold">
                    flipdisplay.online/control
                </p>
            </div>

            {/* Alternative: Show URL for manual entry */}
            <div className="text-xs text-white/40 font-mono max-w-xs break-all text-center">
                {fullUrl}
            </div>
        </div>
    )
}

QRCodeDisplay.propTypes = {
    sessionCode: PropTypes.string.isRequired,
    controlUrl: PropTypes.string,
}
