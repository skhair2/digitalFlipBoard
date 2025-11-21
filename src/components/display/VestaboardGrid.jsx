import { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import Character from './Character'
import { useSessionStore } from '../../store/sessionStore'

const ROWS = 6
const COLS = 22
const TOTAL_CHARS = ROWS * COLS

export default function VestaboardGrid({ overrideMessage }) {
    const { currentMessage, boardState, lastAnimationType, lastColorTheme } = useSessionStore()
    const [displayGrid, setDisplayGrid] = useState(Array(TOTAL_CHARS).fill({ char: ' ', color: null }))

    useEffect(() => {
        if (boardState) {
            // Flatten boardState (6x22) to 1D array (132)
            const flat = boardState.flat()
            setDisplayGrid(flat)
        } else {
            const messageToShow = overrideMessage || currentMessage || "WELCOME"
            // Pad message to fit grid
            const paddedMessage = messageToShow.padEnd(TOTAL_CHARS, ' ').slice(0, TOTAL_CHARS)
            const newChars = paddedMessage.split('').map(c => ({ char: c, color: null }))
            setDisplayGrid(newChars)
        }
    }, [currentMessage, overrideMessage, boardState])

    // Create accessible label
    const accessibleLabel = useMemo(() => {
        if (boardState) return "Custom design displayed on board"
        return overrideMessage || currentMessage || "Welcome message"
    }, [boardState, overrideMessage, currentMessage])

    return (
        <div
            className="grid grid-cols-[repeat(22,minmax(0,1fr))] gap-1 p-4 bg-slate-950 rounded-xl shadow-2xl border border-slate-800 mx-auto max-w-fit"
            role="img"
            aria-label={`Split flap display showing: ${accessibleLabel}`}
        >
            {displayGrid.map((item, index) => (
                <Character
                    key={index} // Use index as key for performance, let Character handle internal transitions
                    char={item.char}
                    color={item.color}
                    animationType={lastAnimationType}
                    colorTheme={lastColorTheme}
                />
            ))}
        </div>
    )
}

VestaboardGrid.propTypes = {
    overrideMessage: PropTypes.string
}
