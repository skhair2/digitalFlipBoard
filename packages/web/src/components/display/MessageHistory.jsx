/**
 * MessageHistory Component
 * Displays paginated message history for a session
 */

import React, { useState } from 'react';
import useMessageHistory from '../../hooks/useMessageHistory';

const MessageHistory = ({ className = '' }) => {
  const {
    messages,
    isLoading,
    error,
    pagination,
    stats,
    fetchHistory,
    nextPage,
    previousPage,
    clearHistory,
    search,
    searchResults
  } = useMessageHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const displayMessages = searchResults || messages;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await search(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchHistory(0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Message History</h2>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="px-3 py-1 text-sm bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          {showSearch ? 'Hide Search' : 'Search'}
        </button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Clear
            </button>
          )}
        </form>
      )}

      {/* Statistics */}
      {stats && (
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
          <p>
            Total messages: <span className="font-semibold">{stats.count || 0}</span> | 
            Duration: <span className="font-semibold">{stats.durationMs ? `${Math.round(stats.durationMs / 1000)}s` : '—'}</span>
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Messages List */}
      <div className="border rounded bg-white max-h-96 overflow-y-auto">
        {displayMessages.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {searchResults ? 'No messages match your search' : 'No messages yet'}
          </div>
        ) : (
          <div className="divide-y">
            {displayMessages.map((msg, idx) => (
              <div key={msg.id || idx} className="p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 break-words">{msg.content || msg.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '—'}
                    </p>
                  </div>
                  {msg.animation && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                      {msg.animation}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!searchResults && pagination.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)} 
            ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={previousPage}
              disabled={pagination.page === 0 || isLoading}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={nextPage}
              disabled={!pagination.hasMore || isLoading}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fetchHistory(0)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
        <button
          onClick={clearHistory}
          disabled={isLoading || displayMessages.length === 0}
          className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Clear History
        </button>
      </div>
    </div>
  );
};

export default MessageHistory;
