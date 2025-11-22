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
    // Initialize empty board
    let board = Array(rows).fill().map(() => Array(cols).fill({ char: ' ', color: null }))

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
                board[row][startCol + i] = { char: trimmed[i], color: null }
            }
        }
    }

    // Process text into lines
    // Very naive wrapping for now: just fill lines
    // A better approach would be to wrap by word

    // Let's try a slightly smarter wrap
    let lines = []
    let currentLineText = ''

    words.forEach(word => {
        if ((currentLineText + word).length + 1 <= cols) {
            currentLineText += (currentLineText ? ' ' : '') + word
        } else {
            lines.push(currentLineText)
            currentLineText = word
        }
    })
    if (currentLineText) lines.push(currentLineText)

    // Center vertically if needed
    let startRow = 0
    if (lines.length < rows) {
        startRow = Math.floor((rows - lines.length) / 2)
    }

    lines.forEach((line, i) => {
        placeLine(line, startRow + i)
    })

    // 2. Apply Patterns
    if (pattern === PATTERNS.BORDER) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                    board[r][c] = { char: '', color: '#ef4444' } // Red border
                }
            }
        }
    } else if (pattern === PATTERNS.CORNERS) {
        const color = '#3b82f6' // Blue
        board[0][0] = { char: '', color }
        board[0][cols - 1] = { char: '', color }
        board[rows - 1][0] = { char: '', color }
        board[rows - 1][cols - 1] = { char: '', color }
    } else if (pattern === PATTERNS.CHECKERBOARD) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r + c) % 2 === 0) {
                    if (board[r][c].char === ' ') {
                        board[r][c] = { char: '', color: '#334155' }
                    }
                }
            }
        }
    }

    return board
}
