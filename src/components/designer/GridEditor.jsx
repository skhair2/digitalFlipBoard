import { useState } from 'react'
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

export default function GridEditor() {
    const { currentDesign, updateCell, clearDesign, saveDesign, designCount, maxDesigns } = useDesignStore()
    const { sendMessage } = useWebSocket()
    const { gridConfig } = useSessionStore()
    const { isPremium } = useAuthStore()

    // Use dynamic grid config
    const rows = gridConfig?.rows || 6
    const cols = gridConfig?.cols || 22

    const [selectedTool, setSelectedTool] = useState('char') // 'char' or 'color'
    const [selectedValue, setSelectedValue] = useState('A') // Char or Color hex
    const [designName, setDesignName] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    const handleCellClick = (index) => {
        if (selectedTool === 'char') {
            updateCell(index, { char: selectedValue, color: null })
        } else {
            updateCell(index, { char: ' ', color: selectedValue })
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
                mixpanel.track('Design Save Blocked - Limit Reached', { 
                  designCount,
                  maxDesigns
                })
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

    const handleCast = () => {
        // Convert currentDesign to message format (just the text content)
        const messageText = currentDesign
            .map(cell => cell.char)
            .join('')
            .trim()
        
        if (!messageText) {
            toast.error('Please add some content before casting')
            return
        }

        try {
            sendMessage(messageText, { animationType: 'flip', colorTheme: 'monochrome' })
            toast.success('Design cast to display!')
            mixpanel.track('Design Cast to Board', {
              gridSize: `${cols}x${rows}`,
              messageLength: messageText.length
            })
        } catch (error) {
            toast.error(error.message || 'Failed to cast to board')
            mixpanel.track('Design Cast Error', { error: error.message })
        }
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

            {/* Toolbar */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedTool('char')}
                            className={clsx("px-4 py-2 rounded-lg font-medium transition-colors", selectedTool === 'char' ? "bg-teal-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600")}
                        >
                            Character
                        </button>
                        <button
                            onClick={() => setSelectedTool('color')}
                            className={clsx("px-4 py-2 rounded-lg font-medium transition-colors", selectedTool === 'color' ? "bg-teal-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600")}
                        >
                            Color Block
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={clearDesign}
                            className="px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            Clear Board
                        </button>
                    </div>
                </div>

                {/* Value Picker */}
                <div className="p-3 bg-slate-900 rounded-lg overflow-x-auto">
                    {selectedTool === 'char' ? (
                        <div className="flex gap-2 min-w-max">
                            {CHARS.split('').map(char => (
                                <button
                                    key={char}
                                    onClick={() => setSelectedValue(char)}
                                    className={clsx(
                                        "w-10 h-12 rounded flex items-center justify-center font-mono text-xl font-bold border transition-all",
                                        selectedValue === char ? "border-teal-500 bg-teal-500/20 text-teal-400" : "border-slate-700 text-gray-400 hover:border-slate-500"
                                    )}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedValue(color)}
                                    className={clsx(
                                        "w-10 h-10 rounded-full border-2 transition-all",
                                        selectedValue === color ? "border-teal-500 scale-110" : "border-transparent hover:scale-105"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Preview/Editor */}
            <div className="overflow-x-auto pb-4">
                <div
                    className="grid gap-0.5 min-w-[800px] bg-black p-2 rounded-lg border border-slate-800"
                    style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                    }}
                >
                    {currentDesign.map((cell, index) => (
                        <button
                            key={index}
                            onClick={() => handleCellClick(index)}
                            className="aspect-[2/3] relative group outline-none focus:ring-1 focus:ring-teal-500 rounded-[1px] overflow-hidden"
                        >
                            <div
                                className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm sm:text-base"
                                style={{
                                    backgroundColor: cell.color || '#1e293b',
                                    color: cell.color ? 'transparent' : 'white'
                                }}
                            >
                                {cell.char}
                            </div>
                            {/* Hover highlight */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Save Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                <input
                    type="text"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="Design Name (e.g. Morning Menu)"
                    disabled={designCount >= maxDesigns && !isPremium}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-50"
                />
                <button
                    onClick={handleSave}
                    disabled={!designName || isSaving || (designCount >= maxDesigns && !isPremium)}
                    className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                    {isSaving ? 'Saving...' : 'Save Design'}
                </button>
                <button
                    onClick={handleCast}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                    Cast to Board
                </button>
            </div>
        </div>
    )
}
