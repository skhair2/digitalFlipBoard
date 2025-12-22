import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useAuthStore } from '../../store/authStore'
import { Card, Button, Input } from '../ui/Components'
import { 
    RssIcon, 
    CloudIcon, 
    ChartBarIcon, 
    CheckCircleIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ChannelManager({ boardId }) {
    const { user, isPremium } = useAuthStore()
    const [channels, setChannels] = useState([])
    const [subscriptions, setSubscriptions] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (boardId) {
            fetchData()
        }
    }, [boardId])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Fetch available channels
            const { data: chanData } = await supabase
                .from('channels')
                .select('*')
                .eq('is_active', true)

            // Fetch current board subscriptions
            const { data: subData } = await supabase
                .from('board_channels')
                .select('*, channels(*)')
                .eq('board_id', boardId)

            setChannels(chanData || [])
            setSubscriptions(subData || [])
        } catch (error) {
            console.error('Error fetching channel data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubscribe = async (channelId) => {
        if (!isPremium) {
            toast.error('Automated Channels are a Pro feature')
            return
        }

        try {
            const { error } = await supabase
                .from('board_channels')
                .insert([{
                    board_id: boardId,
                    channel_id: channelId,
                    update_interval_minutes: 60
                }])

            if (error) throw error
            toast.success('Subscribed to channel!')
            fetchData()
        } catch (error) {
            toast.error('Failed to subscribe')
        }
    }

    const handleUnsubscribe = async (subId) => {
        try {
            const { error } = await supabase
                .from('board_channels')
                .delete()
                .eq('id', subId)

            if (error) throw error
            toast.success('Unsubscribed')
            fetchData()
        } catch (error) {
            toast.error('Failed to unsubscribe')
        }
    }

    const getIcon = (type) => {
        switch (type) {
            case 'weather': return <CloudIcon className="w-6 h-6 text-blue-400" />
            case 'stocks': return <ChartBarIcon className="w-6 h-6 text-green-400" />
            case 'news': return <RssIcon className="w-6 h-6 text-amber-400" />
            default: return <RssIcon className="w-6 h-6 text-slate-400" />
        }
    }

    if (!isPremium) {
        return (
            <Card className="p-8 text-center bg-slate-900/50 border-slate-800">
                <RssIcon className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Automated Channels</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Let your board update itself with live weather, stocks, and news when idle.
                </p>
                <div className="inline-block px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                    Pro Feature
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map(channel => {
                    const isSubscribed = subscriptions.some(s => s.channel_id === channel.id)
                    const sub = subscriptions.find(s => s.channel_id === channel.id)

                    return (
                        <Card key={channel.id} className={clsx(
                            "p-4 transition-all",
                            isSubscribed ? "border-teal-500/50 bg-teal-500/5" : "border-slate-800 hover:border-slate-700"
                        )}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        {getIcon(channel.type)}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{channel.name}</h4>
                                        <p className="text-xs text-slate-500 capitalize">{channel.type} Updates</p>
                                    </div>
                                </div>
                                {isSubscribed ? (
                                    <button 
                                        onClick={() => handleUnsubscribe(sub.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleSubscribe(channel.id)}
                                        className="text-teal-500 hover:text-teal-400 transition-colors"
                                    >
                                        <PlusIcon className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                            
                            {isSubscribed && (
                                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-teal-400">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Active
                                    </div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                                        Every {sub.update_interval_minutes}m
                                    </span>
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
