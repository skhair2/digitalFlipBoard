import { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import Character from './Character'
import { useSessionStore } from '../../store/sessionStore'
import { useScreenResolution, calculateFontSize, getBreakpointSettings } from '../../hooks/useScreenResolution'

export default function DigitalFlipBoardGrid({ overrideMessage, isFullscreen }) {
    const { currentMessage, boardState, lastAnimationType, lastColorTheme, gridConfig } = useSessionStore()
    const { screen, calculateOptimalCharSize } = useScreenResolution()

    // Calculate dynamic defaults based on screen size
    const defaultRows = useMemo(() => {
        if (screen.isPortrait) {
            // Portrait: More rows to fill vertical space
            return Math.max(12, Math.floor(screen.height / 70))
        }
        // Landscape: Aim for ~100px height per row to fill screen nicely
        return Math.max(6, Math.floor(screen.height / 100))
    }, [screen.height, screen.isPortrait])

    const defaultCols = useMemo(() => {
        if (screen.isPortrait) {
            // Portrait: Fewer columns to fit width
            return Math.max(10, Math.floor(screen.width / 35))
        }
        // Landscape: Aim for ~60px width per col
        return Math.max(20, Math.floor(screen.width / 60))
    }, [screen.width, screen.isPortrait])

    // Use config or defaults
    const rows = gridConfig?.rows || defaultRows
    const cols = gridConfig?.cols || defaultCols
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
        if (!text) return []
        
        // Handle explicit newlines and split into paragraphs
        const paragraphs = text.split('\n')
        const allLines = []

        for (const paragraph of paragraphs) {
            const words = paragraph.trim().split(/\s+/)
            let currentLine = ''

            for (const word of words) {
                if (!word) continue

                // If a single word is longer than maxLen, we must break it
                if (word.length > maxLen) {
                    if (currentLine) {
                        allLines.push(currentLine)
                        currentLine = ''
                    }
                    
                    // Break the long word into chunks
                    for (let i = 0; i < word.length; i += maxLen) {
                        const chunk = word.substring(i, i + maxLen)
                        if (chunk.length === maxLen) {
                            allLines.push(chunk)
                        } else {
                            currentLine = chunk
                        }
                    }
                    continue
                }

                const testLine = currentLine ? `${currentLine} ${word}` : word
                if (testLine.length <= maxLen) {
                    currentLine = testLine
                } else {
                    allLines.push(currentLine)
                    currentLine = word
                }
            }
            if (currentLine) allLines.push(currentLine)
        }
        
        return allLines
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
            let infoText = messageToShow.toUpperCase()
            
            let lines = []
            if (infoText.includes('\n')) {
                // If explicit newlines are provided, respect them
                const rawLines = infoText.split('\n')
                for (const rawLine of rawLines) {
                    lines.push(...splitToLines(rawLine, cols))
                }
            } else {
                // Existing logic for auto-splitting
                let displaySentence = ''
                let enterSentence = ''
                const upperText = infoText.toUpperCase()
                
                // Special handling for pairing instructions
                if (upperText.includes('ENTER THIS CODE')) {
                    const idx = upperText.indexOf('ENTER THIS CODE')
                    displaySentence = infoText.slice(0, idx).trim()
                    enterSentence = infoText.slice(idx).trim()
                    
                    if (displaySentence) lines.push(...splitToLines(displaySentence, cols))
                    if (displaySentence && enterSentence) lines.push('') // Spacer
                    if (enterSentence) lines.push(...splitToLines(enterSentence, cols))
                } else {
                    // General message splitting
                    lines = splitToLines(infoText, cols)
                }
            }

            // Center each info line horizontally
            lines = lines.map(line => {
                const trimmed = line.trim()
                if (!trimmed) return ' '.repeat(cols)
                
                if (trimmed.length < cols) {
                    const pad = cols - trimmed.length
                    const left = Math.floor(pad / 2)
                    const right = pad - left
                    return ' '.repeat(left) + trimmed + ' '.repeat(right)
                }
                return trimmed.substring(0, cols)
            })

            // Vertically center the entire block of lines
            if (lines.length < rows) {
                const padRows = rows - lines.length
                const top = Math.floor(padRows / 2)
                const bottom = padRows - top
                for (let i = 0; i < top; i++) lines.unshift(' '.repeat(cols))
                for (let i = 0; i < bottom; i++) lines.push(' '.repeat(cols))
            }

            // Flatten to grid and ensure we don't exceed totalChars
            const gridChars = lines
                .join('')
                .padEnd(totalChars, ' ')
                .substring(0, totalChars)
                .split('')
                .map(c => ({ char: c, color: null }))
            
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
