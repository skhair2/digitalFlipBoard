import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDesignStore } from '../../store/designStore'
import { useSessionStore } from '../../store/sessionStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuthStore } from '../../store/authStore'
import { canUserSaveDesign } from '../../utils/designValidation'
import { createBoardState } from '../../utils/textLayouts'
import UpgradeModal from '../ui/UpgradeModal'
import toast from 'react-hot-toast'
import mixpanel from '../../services/mixpanelService'
import clsx from 'clsx'
import { 
    ArrowUturnLeftIcon, 
    ArrowUturnRightIcon, 
    TrashIcon, 
    CloudArrowUpIcon, 
    RocketLaunchIcon,
    CursorArrowRaysIcon,
    PencilIcon,
    PaintBrushIcon,
    BackspaceIcon,
    ArrowsPointingOutIcon,
    Square2StackIcon,
    AdjustmentsHorizontalIcon,
    SparklesIcon,
    ClockIcon,
    SwatchIcon,
    DevicePhoneMobileIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline'

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

const QUICK_ICONS = [
    { char: '', label: 'Cloud' },
    { char: '', label: 'Sun' },
    { char: '', label: 'Temp' },
    { char: '', label: 'Chart' },
    { char: '', label: 'Bell' },
    { char: '', label: 'Pin' },
    { char: '', label: 'Mail' },
    { char: '', label: 'Battery' },
    { char: '', label: 'Signal' },
    { char: '', label: 'Lock' },
]

export default function EnhancedGridEditor() {
    const { currentDesign, updateCell, clearDesign, saveDesign, designCount, maxDesigns, initializeDesign, setCurrentDesign, activeDesign } = useDesignStore()
    const { sendMessage } = useWebSocket()
    const { gridConfig, lastAnimationType, lastColorTheme, isConnected } = useSessionStore()
    const { isPremium } = useAuthStore()
    
    const rows = gridConfig?.rows || 6
    const cols = gridConfig?.cols || 22
    const layout = currentDesign

    // Enhanced state
    const gridRef = useRef(null)
    const [selectedTool, setSelectedTool] = useState('move')
    const [selectedValue, setSelectedValue] = useState('A')
    const [selectedCellIndex, setSelectedCellIndex] = useState(0)
    const [isGridFocused, setIsGridFocused] = useState(false)
    const [mobileView, setMobileView] = useState('canvas') // 'canvas', 'tools', 'properties'
    const [isMouseDown, setIsMouseDown] = useState(false)
    const [designName, setDesignName] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [selectedRange, setSelectedRange] = useState([])
    const [selectedAnimation, setSelectedAnimation] = useState(lastAnimationType || 'flip')
    const [selectedColor, setSelectedColor] = useState(lastColorTheme || 'monochrome')
    const [fontSize, setFontSize] = useState(16)
    const [charSpacing, setCharSpacing] = useState(0)
    const [textAlignment, setTextAlignment] = useState('left')
    const [showHistory, setShowHistory] = useState(false)
    const [magicText, setMagicText] = useState('')
    const [draggedWord, setDraggedWord] = useState(null)
    const [draggedWordRange, setDraggedWordRange] = useState([])

    // History state
    const [history, setHistory] = useState([currentDesign])
    const [historyIndex, setHistoryIndex] = useState(0)
    const isInternalUpdate = useRef(false)

    // Initialize design if empty
    useEffect(() => {
        if (!currentDesign || currentDesign.length === 0) {
            initializeDesign()
        }
    }, [currentDesign, initializeDesign])

    // Update design name when active design changes
    useEffect(() => {
        if (activeDesign) {
            setDesignName(activeDesign.name || '')
        }
    }, [activeDesign])

    // Magic Text Apply
    const handleApplyMagicText = () => {
        if (!magicText.trim()) return
        const upperText = magicText.toUpperCase()
        const newLayout = createBoardState(upperText, textAlignment, 'none', rows, cols)
        setCurrentDesign(newLayout)
        toast.success('Text applied to grid')
        mixpanel.track('Magic Text Applied', { text: upperText, alignment: textAlignment })
    }

    // History tracking
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false
            return
        }

        if (currentDesign && currentDesign.length > 0) {
            const currentHistoryState = history[historyIndex]
            if (JSON.stringify(currentDesign) !== JSON.stringify(currentHistoryState)) {
                const newHistory = history.slice(0, historyIndex + 1)
                newHistory.push([...currentDesign])
                if (newHistory.length > 50) newHistory.shift()
                setHistory(newHistory)
                setHistoryIndex(newHistory.length - 1)
            }
        }
    }, [currentDesign, history, historyIndex])

    const handleUndo = () => {
        if (historyIndex > 0) {
            isInternalUpdate.current = true
            const prevIndex = historyIndex - 1
            setHistoryIndex(prevIndex)
            setCurrentDesign(history[prevIndex])
            toast.success('Undo')
        }
    }

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            isInternalUpdate.current = true
            const nextIndex = historyIndex + 1
            setHistoryIndex(nextIndex)
            setCurrentDesign(history[nextIndex])
            toast.success('Redo')
        }
    }

    const handleCellClick = (index) => {
        setSelectedCellIndex(index)
        setIsGridFocused(true)
        gridRef.current?.focus()

        if (selectedTool === 'move') return

        if (selectedTool === 'char') {
            updateCell(index, { char: selectedValue, color: null })
        } else if (selectedTool === 'color') {
            updateCell(index, { char: ' ', color: selectedValue })
        } else if (selectedTool === 'eraser') {
            updateCell(index, { char: ' ', color: null })
        }
    }

    const handleMouseDown = (index) => {
        setIsMouseDown(true)
        handleCellClick(index)
    }

    const handleMouseEnter = (index) => {
        if (isMouseDown) {
            handleCellClick(index)
        }
    }

    const handleMouseUp = () => {
        setIsMouseDown(false)
    }

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp)
        return () => window.removeEventListener('mouseup', handleMouseUp)
    }, [])

    const handleFill = () => {
        if (!window.confirm('Fill entire board with current selection?')) return
        const newLayout = Array(rows * cols).fill(
            selectedTool === 'char' 
                ? { char: selectedValue, color: null }
                : { char: ' ', color: selectedValue }
        )
        // This is a bit hacky since updateCell only does one at a time
        // I should probably add a batchUpdate to designStore
        newLayout.forEach((cell, i) => updateCell(i, cell))
        toast.success('Board filled')
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

    // Word Detection & Dragging
    const findWordAt = (index) => {
        if (!layout[index] || layout[index].char === ' ') return null
        
        let start = index
        while (start > 0 && layout[start - 1].char !== ' ' && Math.floor((start - 1) / cols) === Math.floor(index / cols)) {
            start--
        }
        
        let end = index
        while (end < layout.length - 1 && layout[end + 1].char !== ' ' && Math.floor((end + 1) / cols) === Math.floor(index / cols)) {
            end++
        }
        
        return {
            start,
            end,
            text: layout.slice(start, end + 1).map(c => c.char).join(''),
            cells: layout.slice(start, end + 1)
        }
    }

    const handleDragStart = (e, index) => {
        const word = findWordAt(index)
        if (word) {
            setDraggedWord(word)
            const range = []
            for (let i = word.start; i <= word.end; i++) range.push(i)
            setDraggedWordRange(range)
            
            e.dataTransfer.setData('text/plain', word.text)
            e.dataTransfer.effectAllowed = 'move'
            
            // Add a ghost image effect if possible, or just rely on the highlight
            if (e.dataTransfer.setDragImage) {
                const ghost = document.createElement('div')
                ghost.textContent = word.text
                ghost.style.background = '#14b8a6'
                ghost.style.color = 'white'
                ghost.style.padding = '4px 8px'
                ghost.style.borderRadius = '4px'
                ghost.style.position = 'absolute'
                ghost.style.top = '-1000px'
                document.body.appendChild(ghost)
                e.dataTransfer.setDragImage(ghost, 0, 0)
                setTimeout(() => document.body.removeChild(ghost), 0)
            }
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e, targetIndex) => {
        e.preventDefault()
        if (!draggedWord) return

        const newLayout = [...layout]
        // Clear old position
        for (let i = draggedWord.start; i <= draggedWord.end; i++) {
            newLayout[i] = { char: ' ', color: null }
        }

        // Place at new position
        const wordLength = draggedWord.end - draggedWord.start + 1
        for (let i = 0; i < wordLength; i++) {
            const idx = targetIndex + i
            // Ensure we stay on the same row if possible, or just wrap
            if (idx < newLayout.length) {
                newLayout[idx] = draggedWord.cells[i]
            }
        }

        setCurrentDesign(newLayout)
        setDraggedWord(null)
        setDraggedWordRange([])
        toast.success('Word moved')
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

        const { sessionCode } = useSessionStore.getState()
        if (!sessionCode) {
            toast.error('Please pair with a display to cast your design')
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
        const fallbackContent = textSnapshot || activeDesign?.name || 'Custom Design'

        try {
            sendMessage(fallbackContent, {
                animationType: selectedAnimation,
                colorTheme: selectedColor,
                boardState,
                designId: activeDesign?.id,
                designName: activeDesign?.name
            })
            toast.success('Design cast to display!')
            mixpanel.track('Design Cast to Board', {
                gridSize: `${cols}x${rows}`,
                messageLength: textSnapshot.length,
                designId: activeDesign?.id,
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
        <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-180px)] min-h-[600px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName="Unlimited Designs"
            />

            {/* Designer Top Bar */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={magicText}
                            onChange={(e) => setMagicText(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyMagicText()}
                            placeholder="Magic Input: Type message..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-teal-500 transition-all font-mono uppercase"
                        />
                        <SparklesIcon className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                        onClick={handleApplyMagicText}
                        disabled={!magicText.trim()}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95"
                    >
                        APPLY
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1">
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white rounded transition-colors"
                            title="Undo (Ctrl+Z)"
                        >
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white rounded transition-colors"
                            title="Redo (Ctrl+Y)"
                        >
                            <ArrowUturnRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="w-px h-6 bg-slate-800 mx-1" />
                    <button
                        onClick={clearDesign}
                        className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                        title="Clear Board"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Mobile View Switcher */}
                <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-full p-1 shadow-2xl">
                    {[
                        { id: 'tools', icon: PencilIcon, label: 'Tools' },
                        { id: 'canvas', icon: Squares2X2Icon, label: 'Canvas' },
                        { id: 'properties', icon: AdjustmentsHorizontalIcon, label: 'Settings' }
                    ].map(view => (
                        <button
                            key={view.id}
                            onClick={() => setMobileView(view.id)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold transition-all",
                                mobileView === view.id ? "bg-teal-500 text-white" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <view.icon className="w-3.5 h-3.5" />
                            {view.label.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Left Sidebar: Tools */}
                <aside className={clsx(
                    "w-16 lg:w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 shrink-0 transition-all duration-300",
                    "lg:flex",
                    mobileView === 'tools' ? "flex absolute inset-y-0 left-0 z-40 w-24" : "hidden"
                )}>
                    <div className="flex flex-col gap-3">
                        {[
                            { id: 'move', icon: CursorArrowRaysIcon, label: 'Move' },
                            { id: 'char', icon: PencilIcon, label: 'Paint' },
                            { id: 'color', icon: PaintBrushIcon, label: 'Color' },
                            { id: 'eraser', icon: BackspaceIcon, label: 'Erase' }
                        ].map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setSelectedTool(tool.id)}
                                className={clsx(
                                    "p-3 rounded-2xl transition-all group relative active:scale-90",
                                    selectedTool === tool.id ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                                )}
                                title={tool.label}
                            >
                                <tool.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                <span className="hidden lg:block absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                                    {tool.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="w-8 h-px bg-slate-800" />

                    <div className="flex flex-col gap-2 overflow-y-auto px-2 pb-20 lg:pb-4 scrollbar-hide">
                        {QUICK_ICONS.map(icon => (
                            <button
                                key={icon.label}
                                onClick={() => {
                                    setSelectedTool('char')
                                    setSelectedValue(icon.char)
                                }}
                                className={clsx(
                                    "w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90",
                                    selectedTool === 'char' && selectedValue === icon.char
                                        ? "bg-teal-500/20 border border-teal-500/50 text-teal-400"
                                        : "bg-slate-950 border border-slate-800 text-slate-500 hover:border-slate-600"
                                )}
                                title={icon.label}
                            >
                                {icon.char}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Center: Canvas */}
                <main className={clsx(
                    "flex-1 bg-slate-950 p-4 lg:p-8 overflow-auto flex flex-col items-center justify-center transition-all duration-300",
                    "lg:flex",
                    mobileView === 'canvas' ? "flex" : "hidden"
                )}>
                    <div className="relative group">
                        {/* Grid Info Overlay */}
                        <div className="absolute -top-8 left-0 right-0 flex justify-between items-end px-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Canvas</span>
                                <span className="text-[10px] font-mono text-teal-500/80">{cols}x{rows}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-600">Cell: {selectedCellIndex + 1}</span>
                        </div>

                        <motion.div
                            ref={gridRef}
                            role="grid"
                            tabIndex={0}
                            onFocus={() => setIsGridFocused(true)}
                            onBlur={() => setIsGridFocused(false)}
                            onKeyDown={handleGridKeyDown}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="grid gap-0.5 bg-black p-3 rounded-2xl border border-slate-800 shadow-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            style={{
                                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                width: 'fit-content',
                                maxWidth: '100%'
                            }}
                        >
                            {layout.map((cell, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    draggable={cell.char !== ' '}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onMouseDown={() => handleMouseDown(index)}
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    className={clsx(
                                        'w-5 sm:w-8 aspect-[2/3] relative group outline-none rounded-[2px] overflow-hidden transition-all',
                                        selectedCellIndex === index && isGridFocused
                                            ? 'ring-2 ring-teal-400 ring-inset z-10'
                                            : 'border-[0.5px] border-slate-800/30 hover:border-slate-600',
                                        selectedRange.includes(index) && 'bg-amber-500/20 border-amber-500/50',
                                        draggedWordRange.includes(index) && 'opacity-50 scale-95 ring-1 ring-teal-500'
                                    )}
                                >
                                    <div 
                                        className="absolute inset-0 flex flex-col shadow-inner"
                                        style={{ backgroundColor: cell.color || '#0f172a' }}
                                    >
                                        <div className="flex-1 border-b border-black/40 bg-gradient-to-b from-white/5 to-transparent" />
                                        <div className="flex-1 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                    <div
                                        className="absolute inset-0 flex items-center justify-center font-mono font-bold transition-all z-10"
                                        style={{
                                            color: cell.color ? 'rgba(255,255,255,0.9)' : 'white',
                                            fontSize: 'clamp(10px, 1.5vw, 14px)',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        {cell.char}
                                    </div>
                                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/60 z-20" />
                                </button>
                            ))}
                        </motion.div>
                    </div>

                    <div className="mt-8 flex items-center gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                            <span>Live Preview</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DevicePhoneMobileIcon className="w-3 h-3" />
                            <span>Responsive Grid</span>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Properties */}
                <aside className={clsx(
                    "w-72 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto shrink-0 transition-all duration-300",
                    "lg:flex",
                    mobileView === 'properties' ? "flex absolute inset-y-0 right-0 z-40 w-full sm:w-80" : "hidden"
                )}>
                    <div className="p-6 space-y-8 pb-24 lg:pb-8">
                        {/* Palette */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <SwatchIcon className="w-3.5 h-3.5" />
                                Color Palette
                            </h3>
                            <div className="grid grid-cols-5 gap-2.5">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setSelectedTool('color')
                                            setSelectedValue(color)
                                        }}
                                        className={clsx(
                                            "w-full aspect-square rounded-xl border-2 transition-all active:scale-90",
                                            selectedTool === 'color' && selectedValue === color
                                                ? "border-white scale-110 shadow-lg shadow-white/10"
                                                : "border-transparent hover:border-slate-600"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Layout Actions */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                                Layout
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => {
                                        const text = layout.map(c => c.char).join('').trim()
                                        setMagicText(text)
                                        setTextAlignment('center')
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:border-teal-500/50 transition-all flex items-center gap-3 group"
                                >
                                    <Square2StackIcon className="w-4 h-4 group-hover:text-teal-400 transition-colors" />
                                    AUTO-CENTER TEXT
                                </button>
                                <button
                                    onClick={handleFill}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:border-teal-500/50 transition-all flex items-center gap-3 group"
                                >
                                    <AdjustmentsHorizontalIcon className="w-4 h-4 group-hover:text-teal-400 transition-colors" />
                                    FILL ENTIRE BOARD
                                </button>
                            </div>
                        </section>

                        {/* Display Settings */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ClockIcon className="w-3.5 h-3.5" />
                                Display
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">Animation Style</label>
                                    <select
                                        value={selectedAnimation}
                                        onChange={(e) => setSelectedAnimation(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer"
                                    >
                                        {ANIMATIONS.map(anim => (
                                            <option key={anim} value={anim}>{anim.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">Color Theme</label>
                                    <select
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="monochrome">MONOCHROME</option>
                                        <option value="colorful">COLORFUL</option>
                                        <option value="vintage">VINTAGE</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Publish */}
                        <section className="pt-6 border-t border-slate-800 space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={designName}
                                    onChange={(e) => setDesignName(e.target.value)}
                                    placeholder="DESIGN NAME..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-teal-500 transition-all uppercase tracking-widest"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={!designName || isSaving}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    <CloudArrowUpIcon className="w-4 h-4" />
                                    Save
                                </button>
                                <button
                                    onClick={handleCast}
                                    disabled={!hasDesignContent || !isConnected}
                                    className={clsx(
                                        "flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-xl text-[10px] transition-all shadow-lg active:scale-95 uppercase tracking-widest",
                                        !isConnected ? "bg-slate-800 text-slate-600" : "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20"
                                    )}
                                >
                                    <RocketLaunchIcon className="w-4 h-4" />
                                    Cast
                                </button>
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </div>
    )
}
