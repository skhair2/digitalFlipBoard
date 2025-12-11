import { useState, useEffect } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { Card, Button, Input } from '../ui/Components'
import { CalendarIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function Scheduler({ boardId }) {
    const { schedules, fetchSchedules, createSchedule, deleteSchedule, isLoading } = useBoardStore()
    const [newMessage, setNewMessage] = useState('')
    const [scheduledTime, setScheduledTime] = useState('')

    useEffect(() => {
        if (boardId) {
            fetchSchedules(boardId)
        }
    }, [boardId, fetchSchedules])

    const handleSchedule = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !scheduledTime) return

        try {
            await createSchedule(boardId, newMessage, new Date(scheduledTime).toISOString())
            setNewMessage('')
            setScheduledTime('')
        } catch (error) {
            console.error('Failed to schedule message:', error)
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-teal-400" />
                    Schedule Message
                </h3>
                <form onSubmit={handleSchedule} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Enter message to schedule..."
                            maxLength={132}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                            <Input
                                type="datetime-local"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={isLoading || !newMessage || !scheduledTime}>
                                {isLoading ? 'Scheduling...' : 'Schedule'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Upcoming</h3>
                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-slate-700 rounded-lg">
                        <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>No scheduled messages</p>
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <div key={schedule.id} className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between group">
                            <div>
                                <p className="text-white font-mono text-sm mb-1">{schedule.content}</p>
                                <p className="text-xs text-teal-400 flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    {format(new Date(schedule.scheduled_time), 'PPp')}
                                </p>
                            </div>
                            <button
                                onClick={() => deleteSchedule(schedule.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Cancel Schedule"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
