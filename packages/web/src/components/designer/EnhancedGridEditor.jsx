import { useEffect, useMemo, useRef, useState } from 'react'
import { useDesignStore } from '../../store/designStore'
import { useSessionStore } from '../../store/sessionStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../store/authStore'
import { canUserSaveDesign } from '../../utils/designValidation'
import UpgradeModal from '../ui/UpgradeModal'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import mixpanel from '../../services/mixpanelService'

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/ "
const COLORS = [
    '#1e293b', // Slate 800 (Default)
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#ffffff', // White
    '#000000', // Black
]

const ANIMATIONS = ['flip', 'fade', 'slide-up', 'typewriter']

export default function EnhancedGridEditor() {
    const { currentDesign, updateCell, clearDesign, saveDesign, designCount, maxDesigns, initializeDesign } = useDesignStore()
    const { sendMessage } = useWebSocket()
    const { gridConfig, lastAnimationType, lastColorTheme } = useSessionStore()
    const { isPremium } = useAuthStore()
    const rows = currentDesign?.grid_rows || gridConfig?.rows || 6
    const cols = currentDesign?.grid_cols || gridConfig?.cols || 22
    const layout = useMemo(() => currentDesign?.layout || [], [currentDesign?.layout])

    // Enhanced state
    const [selectedTool, setSelectedTool] = useState('char')
    const [selectedValue, setSelectedValue] = useState('A')
    const [selectedCellIndex, setSelectedCellIndex] = useState(0)
    const [isGridFocused, setIsGridFocused] = useState(false)
    const [designName, setDesignName] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    
    // New pro features
    const [selectedAnimation, setSelectedAnimation] = useState(lastAnimationType || 'flip')
    const [selectedColor, setSelectedColor] = useState(lastColorTheme || 'monochrome')
    const [textAlignment, setTextAlignment] = useState('left')
    const [fontSize, setFontSize] = useState(16)
    const [charSpacing, setCharSpacing] = useState(0)
    const [history, setHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [selectedRange, setSelectedRange] = useState([])
    const [showHistory, setShowHistory] = useState(false)
    
    const gridRef = useRef(null)

    useEffect(() => {
        if (!layout.length) {
            initializeDesign()
        }
    }, [initializeDesign, layout.length])

    useEffect(() => {
        if (layout.length && selectedCellIndex >= layout.length) {
            setSelectedCellIndex(0)
        }
    }, [layout.length, selectedCellIndex])

    // History management
    const _saveToHistory = (newLayout) => {
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newLayout)
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
    }

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1)
            // Restore from history
            toast.success('Undone')
        }
    }

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1)
            toast.success('Redone')
        }
    }

    const handleCellClick = (index) => {
        setSelectedCellIndex(index)
        setIsGridFocused(true)
        gridRef.current?.focus()

        if (selectedTool === 'char') {
            updateCell(index, { char: selectedValue, color: null })
        } else {
            updateCell(index, { char: ' ', color: selectedValue })
        }
    }

    const moveSelection = (deltaRow, deltaCol) => {
        if (!layout.length) return
        const currentIndex = selectedCellIndex ?? 0
        const row = Math.floor(currentIndex / cols)
        const col = currentIndex % cols
        const nextRow = Math.min(Math.max(row + deltaRow, 0), rows - 1)
        const nextCol = Math.min(Math.max(col + deltaCol, 0), cols - 1)
        setSelectedCellIndex(nextRow * cols + nextCol)
    }

    const handleGridKeyDown = (event) => {
        if (!isGridFocused || !layout.length) return
        const { key, ctrlKey, metaKey } = event

        // Undo/Redo shortcuts
        if ((ctrlKey || metaKey) && key === 'z') {
            event.preventDefault()
            handleUndo()
            return
        }
        if ((ctrlKey || metaKey) && key === 'y') {
            event.preventDefault()
            handleRedo()
            return
        }

        if (key === 'ArrowRight') {
            event.preventDefault()
            moveSelection(0, 1)
            return
        }
        if (key === 'ArrowLeft') {
            event.preventDefault()
            moveSelection(0, -1)
            return
        }
        if (key === 'ArrowUp') {
            event.preventDefault()
            moveSelection(-1, 0)
            return
        }
        if (key === 'ArrowDown') {
            event.preventDefault()
            moveSelection(1, 0)
            return
        }

        if (key === 'Backspace' || key === 'Delete') {
            event.preventDefault()
            updateCell(selectedCellIndex, { char: ' ', color: null })
            return
        }

        if (key.length === 1) {
            const upper = key.toUpperCase()
            if (CHARS.includes(upper)) {
                event.preventDefault()
                setSelectedTool('char')
                setSelectedValue(upper)
                updateCell(selectedCellIndex, { char: upper, color: null })
                moveSelection(0, 1)
            }
        }
    }

    const handleSave = async () => {
        if (!designName.trim()) {
            toast.error('Please enter a design name')
            return
        }

        const { canSave, reason, requiresUpgrade } = canUserSaveDesign()
        
        if (!canSave) {
            if (requiresUpgrade) {
                toast.error(reason)
                setShowUpgradeModal(true)
            } else {
                toast.error(reason)
            }
            return
        }

        setIsSaving(true)
        try {
            const result = await saveDesign(designName)
            if (result.success) {
                toast.success('Design saved!')
                setDesignName('')
                mixpanel.track('Design Saved', {
                    designName,
                    gridSize: `${cols}x${rows}`,
                    isPremium,
                    totalDesigns: designCount + 1
                })
            } else {
                toast.error(result.error || 'Failed to save design')
            }
        } catch (error) {
            toast.error('Error saving design')
            mixpanel.track('Design Save Error', { error: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const hasDesignContent = useMemo(() => (
        Array.isArray(layout) && layout.some(cell => {
            const charValue = cell?.char || ''
            return Boolean(charValue.trim()) || Boolean(cell?.color)
        })
    ), [layout])

    const handleCast = () => {
        if (!hasDesignContent) {
            toast.error('Please add characters or color before casting')
            return
        }

        const boardState = []
        for (let r = 0; r < rows; r++) {
            const rowCells = []
            for (let c = 0; c < cols; c++) {
                const cell = layout[r * cols + c] || { char: ' ', color: null }
                rowCells.push({
                    char: typeof cell?.char === 'string' && cell.char.length > 0 ? cell.char[0] : ' ',
                    color: cell?.color || null
                })
            }
            boardState.push(rowCells)
        }

        const textSnapshot = layout
            .map(cell => cell?.char || ' ')
            .join('')
            .trim()
        const fallbackContent = textSnapshot || currentDesign?.name || 'Custom Design'

        try {
            sendMessage(fallbackContent, {
                animationType: selectedAnimation,
                colorTheme: selectedColor,
                boardState,
                designId: currentDesign?.id,
                designName: currentDesign?.name
            })
            toast.success('Design cast to display!')
            mixpanel.track('Design Cast to Board', {
                gridSize: `${cols}x${rows}`,
                messageLength: textSnapshot.length,
                designId: currentDesign?.id,
                animation: selectedAnimation,
                color: selectedColor
            })
        } catch (error) {
            toast.error(error.message || 'Failed to cast to board')
            mixpanel.track('Design Cast Error', { error: error.message })
        }
    }

    const _handleBatchColorSelection = (color) => {
        if (selectedRange.length === 0) {
            toast.error('Please select cells by clicking and dragging')
            return
        }
        selectedRange.forEach(index => {
            updateCell(index, { char: ' ', color })
        })
        setSelectedRange([])
        toast.success(`Applied color to ${selectedRange.length} cells`)
    }

    return (
        <div className="space-y-6">
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Unlimited Designs"
            />

            {/* Quota Indicator */}
            {!isPremium && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                    <p className="text-xs text-amber-300">
                        Free tier: {designCount}/{maxDesigns} designs used
                        {designCount >= maxDesigns && (
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="ml-2 underline hover:text-amber-200"
                            >
                                Upgrade now
                            </button>
                        )}
                    </p>
                </div>
            )}

            {/* Top Toolbar */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center gap-4 justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        ↶ Undo
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        ↷ Redo
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                    >
                        📋 History
                    </button>
                    <button
                        onClick={clearDesign}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Grid Canvas */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-white">Design Canvas</h3>
                            <span className="text-xs text-gray-400">
                                {selectedCellIndex + 1} / {rows * cols}
                            </span>
                        </div>

                        {/* Quick Character Picker */}
                        <div className="mb-4 pb-4 border-b border-slate-700">
                            <p className="text-xs text-gray-400 mb-2">Quick Type:</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {CHARS.split('').map(char => (
                                    <button
                                        key={char}
                                        onClick={() => {
                                            setSelectedTool('char')
                                            setSelectedValue(char)
                                        }}
                                        className={clsx(
                                            "w-8 h-8 rounded text-xs font-bold transition-all flex-shrink-0",
                                            selectedTool === 'char' && selectedValue === char
                                                ? "bg-teal-500 text-white border border-teal-400"
                                                : "bg-slate-900 text-gray-400 hover:bg-slate-800 border border-slate-700"
                                        )}
                                    >
                                        {char === ' ' ? '·' : char}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid Editor */}
                        <div className="overflow-x-auto">
                            <div
                                ref={gridRef}
                                role="grid"
                                tabIndex={0}
                                onFocus={() => setIsGridFocused(true)}
                                onBlur={() => setIsGridFocused(false)}
                                onKeyDown={handleGridKeyDown}
                                className="grid gap-0.5 min-w-[600px] bg-black p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                style={{
                                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                                }}
                            >
                                {layout.map((cell, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleCellClick(index)}
                                        onMouseEnter={() => {
                                            if (selectedRange.includes(index)) {
                                                // Multi-select tracking
                                            }
                                        }}
                                        className={clsx(
                                            'aspect-[2/3] relative group outline-none rounded-[1px] overflow-hidden transition-all',
                                            selectedCellIndex === index && isGridFocused
                                                ? 'border-2 border-teal-400 shadow-lg shadow-teal-500/20'
                                                : 'border border-slate-700 hover:border-slate-600',
                                            selectedRange.includes(index) && 'border-amber-400'
                                        )}
                                    >
                                        <div
                                            className="absolute inset-0 flex items-center justify-center font-mono font-bold transition-all"
                                            style={{
                                                backgroundColor: cell.color || '#1e293b',
                                                color: cell.color ? 'transparent' : 'white',
                                                fontSize: `${fontSize * 0.6}px`,
                                                letterSpacing: `${charSpacing}px`
                                            }}
                                        >
                                            {cell.char}
                                        </div>
                                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid Tips */}
                        <p className="text-xs text-gray-500 mt-3">
                            💡 Tip: Type directly to fill cells | Use arrows to navigate | Delete to clear | Ctrl+Z to undo
                        </p>
                    </div>
                </div>

                {/* Right: Settings Panel */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Character/Color Tool Selector */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                        <h3 className="text-sm font-semibold text-white">Tools</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedTool('char')}
                                className={clsx(
                                    "flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors",
                                    selectedTool === 'char'
                                        ? "bg-teal-500 text-white"
                                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                                )}
                            >
                                📝 Char
                            </button>
                            <button
                                onClick={() => setSelectedTool('color')}
                                className={clsx(
                                    "flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors",
                                    selectedTool === 'color'
                                        ? "bg-teal-500 text-white"
                                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                                )}
                            >
                                🎨 Color
                            </button>
                        </div>

                        {/* Color Grid */}
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400">Select Color:</p>
                            <div className="grid grid-cols-5 gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setSelectedTool('color')
                                            setSelectedValue(color)
                                        }}
                                        className={clsx(
                                            "w-full aspect-square rounded-lg border-2 transition-all hover:scale-110",
                                            selectedTool === 'color' && selectedValue === color
                                                ? "border-white scale-110 shadow-lg"
                                                : "border-slate-600 hover:border-slate-500"
                                        )}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Animation & Color Theme */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                        <h3 className="text-sm font-semibold text-white">Display Settings</h3>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Animation:</label>
                            <select
                                value={selectedAnimation}
                                onChange={(e) => setSelectedAnimation(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                            >
                                <option value="flip">🔄 Flip</option>
                                <option value="fade">✨ Fade</option>
                                <option value="slide-up">⬆️ Slide Up</option>
                                <option value="typewriter">📝 Typewriter</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Color Theme:</label>
                            <select
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                            >
                                <option value="monochrome">Monochrome</option>
                                <option value="colorful">Colorful</option>
                                <option value="vintage">Vintage</option>
                            </select>
                        </div>
                    </div>

                    {/* Text Customization (Pro) */}
                    {isPremium && (
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                ⭐ Pro Features
                            </h3>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Font Size: {fontSize}px</label>
                                <input
                                    type="range"
                                    min="12"
                                    max="24"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Char Spacing: {charSpacing}px</label>
                                <input
                                    type="range"
                                    min="-2"
                                    max="4"
                                    value={charSpacing}
                                    onChange={(e) => setCharSpacing(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Alignment:</label>
                                <div className="flex gap-2">
                                    {['left', 'center', 'right'].map(align => (
                                        <button
                                            key={align}
                                            onClick={() => setTextAlignment(align)}
                                            className={clsx(
                                                "flex-1 px-2 py-2 rounded text-xs transition-colors",
                                                textAlignment === align
                                                    ? "bg-teal-500 text-white"
                                                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                                            )}
                                        >
                                            {align === 'left' ? '⬅️' : align === 'center' ? '⬇️' : '➡️'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Design Name & Save */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                        <h3 className="text-sm font-semibold text-white">Save Design</h3>
                        <input
                            type="text"
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                            placeholder="Design name..."
                            disabled={designCount >= maxDesigns && !isPremium}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSave}
                            disabled={!designName || isSaving || (designCount >= maxDesigns && !isPremium)}
                            className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        >
                            {isSaving ? '⏳ Saving...' : '💾 Save'}
                        </button>
                        <button
                            onClick={handleCast}
                            disabled={!hasDesignContent}
                            className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                        >
                            🚀 Cast Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
