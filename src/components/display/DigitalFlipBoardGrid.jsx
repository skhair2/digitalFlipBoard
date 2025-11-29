import { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import Character from './Character'
import { useSessionStore } from '../../store/sessionStore'
import { useScreenResolution, calculateFontSize, getBreakpointSettings } from '../../hooks/useScreenResolution'

export default function DigitalFlipBoardGrid({ overrideMessage, isFullscreen }) {
    const { currentMessage, boardState, lastAnimationType, lastColorTheme, gridConfig } = useSessionStore()
    const { screen, calculateOptimalCharSize } = useScreenResolution()

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

    const splitToLines = (text, maxLen) => {
        const words = text.split(' ')
        const lines = []
        let line = ''
        for (const word of words) {
            if ((line + ' ' + word).trim().length <= maxLen) {
                line = (line + ' ' + word).trim()
            } else {
                if (line) lines.push(line)
                line = word
            }
        }
        if (line) lines.push(line)
        return lines
    }

    useEffect(() => {
        if (Array.isArray(boardState) && boardState.length > 0) {
            // ...existing code...
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

            // --- Smart centering and line splitting logic ---
            // Split message into logical lines (session code always last)
            let infoText = messageToShow.toUpperCase()
            let sessionCode = ''
            // Try to extract session code (assume last word of message is code if all caps and length 6-8)
            const words = infoText.trim().split(/\s+/)
            if (words.length > 2 && /^[A-Z0-9]{6,8}$/.test(words[words.length - 1])) {
                sessionCode = words.pop()
                infoText = words.join(' ')
            }

            // Split infoText into two sentences for spacing
            let displaySentence = ''
            let enterSentence = ''
            if (infoText.includes('ENTER THIS CODE')) {
                const idx = infoText.indexOf('ENTER THIS CODE')
                displaySentence = infoText.slice(0, idx).trim()
                enterSentence = infoText.slice(idx).trim()
            } else {
                displaySentence = infoText
            }

            // Split and center each sentence
            let lines = []
            if (displaySentence) {
                lines.push(...splitToLines(displaySentence, cols).map(line => {
                    if (line.length < cols) {
                        const pad = cols - line.length
                        const left = Math.floor(pad / 2)
                        const right = pad - left
                        return ' '.repeat(left) + line + ' '.repeat(right)
                    }
                    return line
                }))
            }
            // Add one empty line between display and enter sentences
            if (displaySentence && enterSentence) {
                lines.push(' '.repeat(cols))
            }
            if (enterSentence) {
                lines.push(...splitToLines(enterSentence, cols).map(line => {
                    if (line.length < cols) {
                        const pad = cols - line.length
                        const left = Math.floor(pad / 2)
                        const right = pad - left
                        return ' '.repeat(left) + line + ' '.repeat(right)
                    }
                    return line
                }))
            }
            // Add one empty line before session code
            if (sessionCode) {
                lines.push(' '.repeat(cols))
                let codeLine = sessionCode
                if (codeLine.length < cols) {
                    const pad = cols - codeLine.length
                    const left = Math.floor(pad / 2)
                    const right = pad - left
                    codeLine = ' '.repeat(left) + codeLine + ' '.repeat(right)
                }
                lines.push(codeLine)
            }

            // Center each info line
            lines = lines.map(line => {
                if (line.length < cols) {
                    const pad = cols - line.length
                    const left = Math.floor(pad / 2)
                    const right = pad - left
                    return ' '.repeat(left) + line + ' '.repeat(right)
                }
                return line
            })

            // Vertically center block
            if (lines.length < rows) {
                const padRows = rows - lines.length
                const top = Math.floor(padRows / 2)
                const bottom = padRows - top
                for (let i = 0; i < top; i++) lines.unshift(' '.repeat(cols))
                for (let i = 0; i < bottom; i++) lines.push(' '.repeat(cols))
            }

            // Flatten to grid
            const gridChars = lines.join('').padEnd(totalChars, ' ').slice(0, totalChars).split('').map(c => ({ char: c, color: null }))
            setDisplayGrid(gridChars)
        }
    }, [currentMessage, overrideMessage, boardState, totalChars, cols, rows])

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
