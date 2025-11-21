const ROWS = 6
const COLS = 22
const TOTAL_CHARS = ROWS * COLS

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

export function createBoardState(text, alignment = ALIGNMENTS.LEFT, pattern = PATTERNS.NONE) {
    // Initialize empty board
    let board = Array(ROWS).fill().map(() => Array(COLS).fill({ char: ' ', color: null }))

    // 1. Apply Text with Alignment
    const words = text.split(' ')
    let currentLine = 0

    // Simple word wrapping logic
    // This is a basic implementation; could be improved
    let lineBuffer = ''

    // Helper to place line on board
    const placeLine = (lineText, row) => {
        if (row >= ROWS) return

        let startCol = 0
        const trimmed = lineText.trim()

        if (alignment === ALIGNMENTS.CENTER) {
            startCol = Math.floor((COLS - trimmed.length) / 2)
        } else if (alignment === ALIGNMENTS.RIGHT) {
            startCol = COLS - trimmed.length
        }

        // Ensure startCol is not negative
        startCol = Math.max(0, startCol)

        for (let i = 0; i < trimmed.length; i++) {
            if (startCol + i < COLS) {
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
        if ((currentLineText + word).length + 1 <= COLS) {
            currentLineText += (currentLineText ? ' ' : '') + word
        } else {
            lines.push(currentLineText)
            currentLineText = word
        }
    })
    if (currentLineText) lines.push(currentLineText)

    // Center vertically if needed? For now just start from top or middle
    // Let's center vertically if lines < ROWS
    let startRow = 0
    if (lines.length < ROWS) {
        startRow = Math.floor((ROWS - lines.length) / 2)
    }

    lines.forEach((line, i) => {
        placeLine(line, startRow + i)
    })

    // 2. Apply Patterns
    if (pattern === PATTERNS.BORDER) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
                    // Only overwrite if empty? Or always?
                    // Let's overwrite to make the border visible
                    board[r][c] = { char: '', color: '#ef4444' } // Red border
                }
            }
        }
    } else if (pattern === PATTERNS.CORNERS) {
        const color = '#3b82f6' // Blue
        board[0][0] = { char: '', color }
        board[0][COLS - 1] = { char: '', color }
        board[ROWS - 1][0] = { char: '', color }
        board[ROWS - 1][COLS - 1] = { char: '', color }
    } else if (pattern === PATTERNS.CHECKERBOARD) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if ((r + c) % 2 === 0) {
                    // Only background, keep text if present?
                    // For checkerboard, maybe just subtle background
                    if (board[r][c].char === ' ') {
                        board[r][c] = { char: '', color: '#334155' }
                    }
                }
            }
        }
    }

    return board
}
