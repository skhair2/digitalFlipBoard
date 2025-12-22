import { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import Character from './Character'
import { useSessionStore } from '../../store/sessionStore'
import { useScreenResolution, calculateFontSize, getBreakpointSettings } from '../../hooks/useScreenResolution'
import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function DigitalFlipBoardGrid({ overrideMessage, isFullscreen }) {
    const { currentMessage, boardState, lastAnimationType, lastColorTheme, gridConfig } = useSessionStore()
    const { screen, calculateOptimalCharSize } = useScreenResolution()

    // Calculate available space first to drive row/col logic
    const availableSpace = useMemo(() => {
        const padding = isFullscreen ? (screen.isSmallScreen ? 4 : 12) : (screen.isSmallScreen ? 8 : 24)
        const gap = isFullscreen ? 1 : 2
        
        const height = isFullscreen ? screen.height : screen.height - 180
        const width = isFullscreen ? screen.width : screen.width * 0.92
        
        return { width, height, padding, gap }
    }, [screen.width, screen.height, isFullscreen, screen.isSmallScreen])

    // Calculate dynamic defaults based on available space
    const defaultRows = useMemo(() => {
        const targetHeight = screen.isSmallScreen ? 45 : (isFullscreen ? 120 : 80)
        const calculatedRows = Math.floor(availableSpace.height / targetHeight)
        const safeRows = isNaN(calculatedRows) ? 0 : calculatedRows
        
        if (screen.isPortrait) {
            return Math.max(12, safeRows)
        }
        return Math.max(5, safeRows)
    }, [availableSpace.height, screen.isPortrait, screen.isSmallScreen, isFullscreen])

    const defaultCols = useMemo(() => {
        const charHeight = Math.max(1, availableSpace.height / defaultRows)
        const charWidth = charHeight * 0.65
        const idealCols = charWidth > 0 ? Math.floor(availableSpace.width / charWidth) : 24
        
        if (screen.isPortrait) {
            return isNaN(idealCols) ? 10 : Math.max(10, idealCols)
        }
        return isNaN(idealCols) ? 24 : Math.max(24, idealCols)
    }, [availableSpace.width, availableSpace.height, screen.isPortrait, defaultRows])

    // Use config or defaults
    const rows = gridConfig?.rows || defaultRows
    const cols = gridConfig?.cols || defaultCols
    const totalChars = rows * cols

    // Calculate optimal sizing for current screen resolution
    const optimalGridDims = useMemo(() => {
        const { width, height, padding, gap } = availableSpace
        const dims = calculateOptimalCharSize(rows, cols, width, height, padding, gap)
        
        // Calculate actual grid dimensions (excluding the outer padding)
        const gridWidth = (dims.characterWidth * cols) + ((cols - 1) * gap)
        const gridHeight = (dims.characterHeight * rows) + ((rows - 1) * gap)
        
        return { ...dims, gridWidth, gridHeight, padding, gap }
    }, [rows, cols, availableSpace, calculateOptimalCharSize])

    // Calculate font size
    const fontSize = useMemo(() => {
        if (!optimalGridDims) return 16
        return calculateFontSize(optimalGridDims.characterHeight, screen.dpi)
    }, [optimalGridDims, screen.dpi])

    const [displayGrid, setDisplayGrid] = useState(Array(totalChars).fill({ char: ' ', color: null }))

    const splitToLines = (text, maxLen) => {
        if (!text) return []
        const paragraphs = text.split('\n')
        const allLines = []

        for (const paragraph of paragraphs) {
            const words = paragraph.trim().split(/\s+/)
            let currentLine = ''

            for (const word of words) {
                if (!word) continue
                if (word.length > maxLen) {
                    if (currentLine) {
                        allLines.push(currentLine)
                        currentLine = ''
                    }
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
            const flat = boardState.flat().slice(0, totalChars)
            if (flat.length < totalChars) {
                const padding = Array(totalChars - flat.length).fill({ char: ' ', color: null })
                setDisplayGrid([...flat, ...padding])
            } else {
                setDisplayGrid(flat)
            }
        } else {
            const messageToShow = overrideMessage !== undefined ? overrideMessage : (currentMessage || "")
            if (!messageToShow) {
                setDisplayGrid(Array(totalChars).fill({ char: ' ', color: null }))
                return
            }

            let infoText = messageToShow.toUpperCase()
            let lines = []
            if (infoText.includes('\n')) {
                const rawLines = infoText.split('\n')
                for (const rawLine of rawLines) {
                    lines.push(...splitToLines(rawLine, cols))
                }
            } else {
                lines = splitToLines(infoText, cols)
            }

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

            if (lines.length < rows) {
                const padRows = rows - lines.length
                const top = Math.floor(padRows / 2)
                const bottom = padRows - top
                for (let i = 0; i < top; i++) lines.unshift(' '.repeat(cols))
                for (let i = 0; i < bottom; i++) lines.push(' '.repeat(cols))
            }

            const gridChars = lines
                .join('')
                .padEnd(totalChars, ' ')
                .substring(0, totalChars)
            
            setDisplayGrid(gridChars.split('').map(char => ({ char, color: null })))
        }
    }, [currentMessage, boardState, totalChars, rows, cols, overrideMessage])

    if (!optimalGridDims) return null

    return (
        <div className="relative flex items-center justify-center w-full h-full">
            {/* Professional Frame */}
            <div 
                className={clsx(
                    "relative bg-[#0a0a0a] rounded-[2rem] border-[12px] border-[#1a1a1a] shadow-[0_0_100px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(0,0,0,0.9)] overflow-hidden",
                    isFullscreen ? "p-4" : "p-8"
                )}
                style={{
                    width: optimalGridDims.gridWidth + (isFullscreen ? 40 : 80),
                    height: optimalGridDims.gridHeight + (isFullscreen ? 40 : 80),
                }}
            >
                {/* Internal Bezel */}
                <div className="absolute inset-0 border-[2px] border-white/5 rounded-[1.4rem] pointer-events-none z-20" />
                
                {/* Grid Content */}
                <div 
                    className="grid relative z-10"
                    style={{
                        gridTemplateColumns: `repeat(${cols}, ${optimalGridDims.characterWidth}px)`,
                        gridTemplateRows: `repeat(${rows}, ${optimalGridDims.characterHeight}px)`,
                        gap: `${optimalGridDims.gap}px`,
                        width: optimalGridDims.gridWidth,
                        height: optimalGridDims.gridHeight,
                    }}
                >
                    {displayGrid.map((item, idx) => (
                        <Character
                            key={idx}
                            char={item.char}
                            color={item.color || lastColorTheme?.primary}
                            delay={idx * 0.001}
                            fontSize={fontSize}
                            isFullscreen={true}
                            animationType={lastAnimationType || 'flip'}
                        />
                    ))}
                </div>

                {/* Ambient Lighting Effects */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-20" />
                <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-20" />
            </div>

            {/* Background Glow */}
            <div className="absolute -inset-20 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
    )
}

DigitalFlipBoardGrid.propTypes = {
    overrideMessage: PropTypes.string,
    isFullscreen: PropTypes.bool
}
