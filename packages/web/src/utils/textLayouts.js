export const ALIGNMENTS = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right'
}

export const PATTERNS = {
    NONE: 'none',
    BORDER: 'border',
    CORNERS: 'corners',
    CHECKERBOARD: 'checkerboard'
}

export function createBoardState(text, alignment = ALIGNMENTS.LEFT, pattern = PATTERNS.NONE, rows = 6, cols = 22) {
    // Initialize empty board (1D array for store compatibility)
    let board = Array(rows * cols).fill(null).map(() => ({ char: ' ', color: null }))

    // Helper to get 1D index
    const getIdx = (r, c) => r * cols + c

    // 1. Apply Text with Alignment
    const words = text.split(' ')

    // Helper to place line on board
    const placeLine = (lineText, row) => {
        if (row >= rows) return

        let startCol = 0
        const trimmed = lineText.trim()

        if (alignment === ALIGNMENTS.CENTER) {
            startCol = Math.floor((cols - trimmed.length) / 2)
        } else if (alignment === ALIGNMENTS.RIGHT) {
            startCol = cols - trimmed.length
        }

        // Ensure startCol is not negative
        startCol = Math.max(0, startCol)

        for (let i = 0; i < trimmed.length; i++) {
            if (startCol + i < cols) {
                board[getIdx(row, startCol + i)] = { char: trimmed[i], color: null }
            }
        }
    }

    // Process text into lines with word wrapping
    let lines = []
    let currentLineText = ''

    words.forEach(word => {
        if ((currentLineText + (currentLineText ? ' ' : '') + word).length <= cols) {
            currentLineText += (currentLineText ? ' ' : '') + word
        } else {
            if (currentLineText) lines.push(currentLineText)
            // If a single word is longer than cols, we have to break it
            if (word.length > cols) {
                let remaining = word
                while (remaining.length > cols) {
                    lines.push(remaining.substring(0, cols))
                    remaining = remaining.substring(cols)
                }
                currentLineText = remaining
            } else {
                currentLineText = word
            }
        }
    })
    if (currentLineText) lines.push(currentLineText)

    // Center vertically if needed
    let startRow = 0
    if (lines.length < rows) {
        startRow = Math.floor((rows - lines.length) / 2)
    }

    lines.forEach((line, i) => {
        if (startRow + i < rows) {
            placeLine(line, startRow + i)
        }
    })

    // 2. Apply Patterns
    if (pattern === PATTERNS.BORDER) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                    board[getIdx(r, c)] = { char: '', color: '#ef4444' } // Red border
                }
            }
        }
    } else if (pattern === PATTERNS.CORNERS) {
        const color = '#3b82f6' // Blue
        board[getIdx(0, 0)] = { char: '', color }
        board[getIdx(0, cols - 1)] = { char: '', color }
        board[getIdx(rows - 1, 0)] = { char: '', color }
        board[getIdx(rows - 1, cols - 1)] = { char: '', color }
    } else if (pattern === PATTERNS.CHECKERBOARD) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r + c) % 2 === 0) {
                    const idx = getIdx(r, c)
                    if (board[idx].char === ' ') {
                        board[idx] = { char: '', color: '#334155' }
                    }
                }
            }
        }
    }

    return board
}
