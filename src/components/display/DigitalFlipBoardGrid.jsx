import { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import Character from './Character'
import { useSessionStore } from '../../store/sessionStore'
import { useScreenResolution, calculateFontSize, getBreakpointSettings } from '../../hooks/useScreenResolution'

export default function DigitalFlipBoardGrid({ overrideMessage, isFullscreen }) {
    const { currentMessage, boardState, lastAnimationType, lastColorTheme, gridConfig } = useSessionStore()
    const { screen, grid, calculateOptimalCharSize } = useScreenResolution()

    // Use config or defaults
    const rows = gridConfig?.rows || 6
    const cols = gridConfig?.cols || 22
    const totalChars = rows * cols

    // Calculate optimal sizing for current screen resolution
    const optimalGridDims = useMemo(() => {
        if (!isFullscreen) return null
        return calculateOptimalCharSize(rows, cols, screen.width, screen.height, screen.dpi)
    }, [rows, cols, screen.width, screen.height, screen.dpi, isFullscreen, calculateOptimalCharSize])

    // Get breakpoint settings
    const breakpointSettings = useMemo(() => {
        return getBreakpointSettings(screen.width)
    }, [screen.width])

    // Calculate font size
    const fontSize = useMemo(() => {
        if (!optimalGridDims) return 16
        return calculateFontSize(optimalGridDims.characterHeight, screen.dpi)
    }, [optimalGridDims, screen.dpi])

    const [displayGrid, setDisplayGrid] = useState(Array(totalChars).fill({ char: ' ', color: null }))

    useEffect(() => {
        if (Array.isArray(boardState) && boardState.length > 0) {
            // Flatten boardState if needed, or just use it if it matches totalChars
            const flat = boardState.flat().slice(0, totalChars)
            if (flat.length < totalChars) {
                const padding = Array(totalChars - flat.length).fill({ char: ' ', color: null })
                setDisplayGrid([...flat, ...padding])
            } else {
                setDisplayGrid(flat)
            }
        } else {
            // If overrideMessage is explicitly null (not undefined), show blank
            // If overrideMessage is undefined, fallback to currentMessage or blank
            const messageToShow = overrideMessage !== undefined ? overrideMessage : (currentMessage || "")

            // If message is empty string, show blank grid
            if (!messageToShow) {
                setDisplayGrid(Array(totalChars).fill({ char: ' ', color: null }))
                return
            }

            // Pad message to fit grid
            const safeMessage = typeof messageToShow === 'string' ? messageToShow : "ERROR"
            const paddedMessage = safeMessage.padEnd(totalChars, ' ').slice(0, totalChars)
            const newChars = paddedMessage.split('').map(c => ({ char: c, color: null }))
            setDisplayGrid(newChars)
        }
    }, [currentMessage, overrideMessage, boardState, totalChars])

    // Create accessible label
    const accessibleLabel = useMemo(() => {
        if (boardState) return "Custom design displayed on board"
        return overrideMessage || currentMessage || "Welcome message"
    }, [boardState, overrideMessage, currentMessage])

    // Determine container styles based on fullscreen and screen resolution
    const containerStyle = useMemo(() => {
        if (!isFullscreen) {
            return {
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                aspectRatio: `${cols} / ${rows}`,
                gap: '0.125rem',
            }
        }

        // Fullscreen mode: use calculated optimal dimensions
        if (optimalGridDims) {
            return {
                gridTemplateColumns: `repeat(${cols}, ${optimalGridDims.characterWidth}px)`,
                gridTemplateRows: `repeat(${rows}, ${optimalGridDims.characterHeight}px)`,
                gap: `${optimalGridDims.gap}px`,
                padding: `${breakpointSettings.padding}px`,
                justifyContent: 'center',
                alignContent: 'center',
            }
        }

        // Fallback for fullscreen
        return {
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            aspectRatio: `${cols} / ${rows}`,
            gap: '0.125rem',
        }
    }, [cols, rows, isFullscreen, optimalGridDims, breakpointSettings.padding])

    return (
        <div
            className={`grid bg-[#050505] transition-all duration-300 mx-auto
                ${
                    isFullscreen
                        ? 'fixed inset-0 w-screen h-screen overflow-hidden'
                        : 'w-full max-w-[95vw] p-2 md:p-4 rounded-xl shadow-2xl border border-white/5'
                }`}
            style={containerStyle}
            role="img"
            aria-label={`Split flap display showing: ${accessibleLabel}`}
            data-breakpoint={breakpointSettings.breakpoint}
        >
            {displayGrid.map((item, index) => {
                // Calculate stagger delay
                const row = Math.floor(index / cols)
                const col = index % cols
                // Diagonal wave effect
                const delay = (row + col) * 0.03

                return (
                    <Character
                        key={index}
                        char={item?.char || ' '}
                        color={item?.color || null}
                        animationType={lastAnimationType}
                        colorTheme={lastColorTheme}
                        delay={delay}
                        fontSize={fontSize}
                        isFullscreen={isFullscreen}
                    />
                )
            })}
        </div>
    )
}

DigitalFlipBoardGrid.propTypes = {
    overrideMessage: PropTypes.string,
    isFullscreen: PropTypes.bool
}
