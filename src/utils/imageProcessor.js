const ROWS = 6
const COLS = 22

// DigitalFlipBoard standard colors (approximate)
const PALETTE = [
    { name: 'red', hex: '#FF0000' },
    { name: 'orange', hex: '#FF7F00' },
    { name: 'yellow', hex: '#FFFF00' },
    { name: 'green', hex: '#00FF00' },
    { name: 'blue', hex: '#0000FF' },
    { name: 'violet', hex: '#8B00FF' },
    { name: 'white', hex: '#FFFFFF' },
    { name: 'black', hex: '#000000' },
]

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

function getDistance(rgb1, rgb2) {
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    )
}

function findNearestColor(r, g, b) {
    let minDistance = Infinity
    let nearest = PALETTE[7] // Default black

    const target = { r, g, b }

    PALETTE.forEach(color => {
        const rgb = hexToRgb(color.hex)
        const dist = getDistance(target, rgb)
        if (dist < minDistance) {
            minDistance = dist
            nearest = color
        }
    })

    return nearest.hex
}

export function processImageToBoard(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                // Resize to 22x6
                canvas.width = COLS
                canvas.height = ROWS

                // Draw image to fill the grid
                ctx.drawImage(img, 0, 0, COLS, ROWS)

                const imageData = ctx.getImageData(0, 0, COLS, ROWS)
                const data = imageData.data

                const board = []

                for (let r = 0; r < ROWS; r++) {
                    const row = []
                    for (let c = 0; c < COLS; c++) {
                        const i = (r * COLS + c) * 4
                        const red = data[i]
                        const green = data[i + 1]
                        const blue = data[i + 2]
                        const alpha = data[i + 3]

                        if (alpha < 128) {
                            // Transparent -> Black
                            row.push({ char: ' ', color: '#000000' })
                        } else {
                            const nearestHex = findNearestColor(red, green, blue)
                            row.push({ char: ' ', color: nearestHex })
                        }
                    }
                    board.push(row)
                }

                resolve(board)
            }
            img.onerror = reject
            img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
