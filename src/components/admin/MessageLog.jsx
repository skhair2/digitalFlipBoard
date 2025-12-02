import React, { useEffect, useState } from 'react';
import * as adminService from '../../services/adminService';
import Spinner from '../ui/Spinner';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Message Log (Content Moderation)
 * View recent messages across all boards
 */

export default function MessageLog() {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        loadMessages();

        if (autoRefresh) {
            const interval = setInterval(loadMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const result = await adminService.fetchActiveBoardMessages();
            if (result.success) {
                setMessages(result.messages);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto">
            <div className="p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Content Moderation</h1>
                        <p className="text-gray-400 mt-2">Monitor active board messages</p>
                    </div>
                    <div className="flex gap-3">
                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">Auto Refresh</span>
                        </label>
                        <button
                            onClick={loadMessages}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid gap-4">
                    {messages.length === 0 && !loading ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
                            No active boards found
                        </div>
                    ) : (
                        messages.map((board) => (
                            <div key={board.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-white">{board.name || 'Untitled Board'}</h3>
                                        <p className="text-xs text-gray-400">
                                            Owner: {board.profiles?.email || 'Unknown'}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        Updated: {new Date(board.updated_at).toLocaleString()}
                                    </span>
                                </div>
                                {/* 
                  Note: Actual message content isn't in the 'boards' table in this schema version.
                  Ideally, we'd fetch the latest 'scheduled_messages' or check Redis state.
                  For now, we show metadata.
                */}
                                <div className="bg-black/30 p-3 rounded font-mono text-sm text-green-400 overflow-x-auto">
                                    [Board State Metadata Only - Content in Redis]
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
