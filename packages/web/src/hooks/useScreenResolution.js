/**
 * useScreenResolution.js
 * 
 * Custom hook to detect screen resolution and calculate optimal grid sizing
 * for fullscreen display with responsive character sizing
 */

import { useState, useEffect, useCallback } from 'react'

export const useScreenResolution = () => {
    const [screenDimensions, setScreenDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        dpi: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
        isPortrait: typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false,
        isSmallScreen: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
        isLargeScreen: typeof window !== 'undefined' ? window.innerWidth > 1920 : false,
    })

    const [gridDimensions, setGridDimensions] = useState({
        characterWidth: 0,
        characterHeight: 0,
        totalPadding: 0,
        gap: 0,
        containerWidth: 0,
        containerHeight: 0,
    })

    // Calculate optimal character size based on screen resolution and grid dimensions
    const calculateOptimalCharSize = useCallback((rows, cols, width, height) => {
        // Reserve space for padding and gaps
        const horizontalPadding = 16 * 2 // 2rem on each side = 32px
        const verticalPadding = 16 * 2 // 2rem on top/bottom = 32px
        
        // Calculate available space
        const availableWidth = width - horizontalPadding
        const availableHeight = height - verticalPadding

        // Account for gaps between characters (0.125rem = 2px per gap)
        const gapSize = 2
        const totalHorizontalGaps = (cols - 1) * gapSize
        const totalVerticalGaps = (rows - 1) * gapSize

        // Available space for actual characters
        const spaceForCharsWidth = availableWidth - totalHorizontalGaps
        const spaceForCharsHeight = availableHeight - totalVerticalGaps

        // Calculate character dimensions based on available space
        let charWidth = spaceForCharsWidth / cols
        let charHeight = spaceForCharsHeight / rows

        // Maintain aspect ratio (typically 1:1.5 for flap displays - wider than tall)
        // Character aspect ratio: width/height = 0.6 (60% width of height)
        const targetAspectRatio = 0.6

        // If width-based calculation is too wide, constrain by height
        if (charWidth > charHeight * targetAspectRatio) {
            charWidth = charHeight * targetAspectRatio
        }
        // If height-based calculation is too tall, constrain by width
        else if (charHeight > charWidth / targetAspectRatio) {
            charHeight = charWidth / targetAspectRatio
        }

        // Apply minimum and maximum sizes for readability
        const minCharSize = 12 // Don't go below 12px
        const maxCharSize = 600 // Increased to allow filling large screens (was 120)

        charWidth = Math.max(minCharSize, Math.min(maxCharSize, charWidth))
        charHeight = Math.max(minCharSize, Math.min(maxCharSize, charHeight))

        // Calculate final container dimensions
        const containerWidth = (charWidth * cols) + totalHorizontalGaps + horizontalPadding
        const containerHeight = (charHeight * rows) + totalVerticalGaps + verticalPadding

        return {
            characterWidth: Math.floor(charWidth),
            characterHeight: Math.floor(charHeight),
            totalPadding: horizontalPadding + verticalPadding,
            gap: gapSize,
            containerWidth: Math.floor(containerWidth),
            containerHeight: Math.floor(containerHeight),
        }
    }, [])

    // Update dimensions on mount and when screen resizes
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            const dpi = window.devicePixelRatio || 1
            const isPortrait = height > width
            const isSmallScreen = width < 768
            const isLargeScreen = width > 1920

            setScreenDimensions({
                width,
                height,
                dpi,
                isPortrait,
                isSmallScreen,
                isLargeScreen,
            })
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Calculate grid dimensions whenever screen changes
    useEffect(() => {
        // Grid dimensions from session store will be passed as parameter
        // Default to 6x22 if not available
        const rows = 6
        const cols = 22

        const gridDims = calculateOptimalCharSize(
            rows,
            cols,
            screenDimensions.width,
            screenDimensions.height
        )

        setGridDimensions(gridDims)
    }, [screenDimensions, calculateOptimalCharSize])

    return {
        screen: screenDimensions,
        grid: gridDimensions,
        calculateOptimalCharSize,
    }
}

/**
 * Get CSS classes for responsive grid sizing
 */
export const getResponsiveGridClasses = (screen) => {
    if (screen.isSmallScreen) {
        return {
            padding: 'p-1 md:p-2',
            gap: 'gap-0.5',
            textSize: 'text-xs',
        }
    } else if (screen.isLargeScreen) {
        return {
            padding: 'p-4 md:p-6',
            gap: 'gap-1',
            textSize: 'text-lg',
        }
    } else {
        return {
            padding: 'p-2 md:p-4',
            gap: 'gap-0.5',
            textSize: 'text-base',
        }
    }
}

/**
 * Calculate font size for characters based on grid dimensions
 */
export const calculateFontSize = (charHeight, dpi = 1) => {
    // Font size should be roughly 70-80% of character cell height
    const baseFontSize = charHeight * 0.75
    
    // Apply DPI scaling for high-res displays
    const scaledFontSize = baseFontSize * Math.sqrt(dpi)
    
    return Math.floor(scaledFontSize)
}

/**
 * Get breakpoint-specific settings
 */
export const getBreakpointSettings = (width) => {
    if (width < 480) {
        return {
            breakpoint: 'xs',
            charScale: 0.8,
            padding: 8,
            gap: 1,
        }
    } else if (width < 768) {
        return {
            breakpoint: 'sm',
            charScale: 0.9,
            padding: 12,
            gap: 2,
        }
    } else if (width < 1024) {
        return {
            breakpoint: 'md',
            charScale: 1,
            padding: 16,
            gap: 2,
        }
    } else if (width < 1536) {
        return {
            breakpoint: 'lg',
            charScale: 1.1,
            padding: 20,
            gap: 3,
        }
    } else if (width < 2560) {
        return {
            breakpoint: 'xl',
            charScale: 1.2,
            padding: 24,
            gap: 4,
        }
    } else {
        return {
            breakpoint: '4k',
            charScale: 1.5,
            padding: 32,
            gap: 6,
        }
    }
}

export default useScreenResolution
