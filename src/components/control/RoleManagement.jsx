import { useEffect, useState } from 'react'
import { generateCSRFToken, grantAdminRole, revokeAdminRole, fetchAdmins, fetchAuditLog } from '../../services/permissionService'
import { useAuthStore } from '../../store/authStore'
import mixpanel from '../../services/mixpanelService'
import { Tab } from '@headlessui/react'
import { clsx } from 'clsx'

export default function RoleManagement() {
  const { user } = useAuthStore()
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [admins, setAdmins] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [revokeEmail, setRevokeEmail] = useState('')
  const [reason, setReason] = useState('')
  const [revokeReason, setRevokeReason] = useState('')
  const [rateLimitError, setRateLimitError] = useState(null)
  const [showRateLimitCountdown, setShowRateLimitCountdown] = useState(null)

  // Load admins and audit log
  useEffect(() => {
    loadAdmins()
    loadAuditLog()
    mixpanel.track('Role Management Viewed')
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const data = await fetchAdmins()
      setAdmins(data)
    } catch (err) {
      setError(`Failed to load admins: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadAuditLog = async () => {
    try {
      const data = await fetchAuditLog(50)
      setAuditLog(data)
    } catch (err) {
      console.error('Failed to load audit log:', err)
    }
  }

  const handleGrantAdmin = async (e) => {
    e.preventDefault()
    
    if (!searchEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setRateLimitError(null)
      setSuccess(null)

      // Generate CSRF token
      const csrfToken = generateCSRFToken(user.id)

      // Grant role
      await grantAdminRole(searchEmail, user.id, reason || null, csrfToken)

      // Success feedback
      setSuccess(`✅ Granted admin role to ${searchEmail}`)
      setSearchEmail('')
      setReason('')
      mixpanel.track('Admin Role Granted', { email: searchEmail })

      // Reload admins
      setTimeout(() => {
        loadAdmins()
        loadAuditLog()
      }, 500)

    } catch (err) {
      const message = err.message || 'Unknown error'
      
      // Handle rate limiting with countdown
      if (message.includes('Rate limited')) {
        const match = message.match(/Try again in (\d+) seconds/)
        if (match) {
          const seconds = parseInt(match[1])
          setRateLimitError(message)
          setShowRateLimitCountdown(seconds)
          
          // Countdown timer
          const interval = setInterval(() => {
            setShowRateLimitCountdown(prev => {
              if (prev <= 1) {
                clearInterval(interval)
                setRateLimitError(null)
                return null
              }
              return prev - 1
            })
          }, 1000)
        }
      } else if (message.includes('CSRF')) {
        setError('Security token invalid or expired. Please try again.')
      } else {
        setError(`Failed to grant admin role: ${message}`)
      }
      
      mixpanel.track('Admin Grant Failed', { email: searchEmail, error: message })
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAdmin = async (e) => {
    e.preventDefault()
    
    if (!revokeEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    if (!window.confirm(`Are you sure you want to revoke admin access from ${revokeEmail}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setRateLimitError(null)
      setSuccess(null)

      // Generate CSRF token
      const csrfToken = generateCSRFToken(user.id)

      // Revoke role
      await revokeAdminRole(revokeEmail, user.id, revokeReason || null, csrfToken)

      // Success feedback
      setSuccess(`✅ Revoked admin role from ${revokeEmail}`)
      setRevokeEmail('')
      setRevokeReason('')
      mixpanel.track('Admin Role Revoked', { email: revokeEmail })

      // Reload admins
      setTimeout(() => {
        loadAdmins()
        loadAuditLog()
      }, 500)

    } catch (err) {
      const message = err.message || 'Unknown error'
      
      // Handle rate limiting with countdown
      if (message.includes('Rate limited')) {
        const match = message.match(/Try again in (\d+) seconds/)
        if (match) {
          const seconds = parseInt(match[1])
          setRateLimitError(message)
          setShowRateLimitCountdown(seconds)
          
          // Countdown timer
          const interval = setInterval(() => {
            setShowRateLimitCountdown(prev => {
              if (prev <= 1) {
                clearInterval(interval)
                setRateLimitError(null)
                return null
              }
              return prev - 1
            })
          }, 1000)
        }
      } else if (message.includes('CSRF')) {
        setError('Security token invalid or expired. Please try again.')
      } else {
        setError(`Failed to revoke admin role: ${message}`)
      }
      
      mixpanel.track('Admin Revoke Failed', { email: revokeEmail, error: message })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    {
      name: 'Grant Access',
      component: (
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Grant Admin Role</h3>
            
            {error && !rateLimitError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {rateLimitError && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                <div>{rateLimitError}</div>
                {showRateLimitCountdown && (
                  <div className="text-xs text-yellow-300 mt-2">
                    Try again in {showRateLimitCountdown}s
                  </div>
                )}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleGrantAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={loading || showRateLimitCountdown}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Added to support team"
                  disabled={loading || showRateLimitCountdown}
                  maxLength={255}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {reason.length}/255 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || showRateLimitCountdown}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : showRateLimitCountdown ? `Try again in ${showRateLimitCountdown}s` : 'Grant Admin Role'}
              </button>
            </form>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">
              <strong>ℹ️ Security Note:</strong> CSRF protection is enabled. Each grant operation uses a unique security token that expires in 10 minutes.
            </p>
          </div>
        </div>
      )
    },
    {
      name: 'Revoke Access',
      component: (
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revoke Admin Role</h3>
            
            {error && !rateLimitError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {rateLimitError && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm">
                <div>{rateLimitError}</div>
                {showRateLimitCountdown && (
                  <div className="text-xs text-yellow-300 mt-2">
                    Try again in {showRateLimitCountdown}s
                  </div>
                )}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleRevokeAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={revokeEmail}
                  onChange={(e) => setRevokeEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={loading || showRateLimitCountdown}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g., Employee departure"
                  disabled={loading || showRateLimitCountdown}
                  maxLength={255}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {revokeReason.length}/255 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || showRateLimitCountdown}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : showRateLimitCountdown ? `Try again in ${showRateLimitCountdown}s` : 'Revoke Admin Role'}
              </button>
            </form>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">
              <strong>⚠️ Careful:</strong> Revoking admin access is permanent. The user will lose all admin permissions immediately.
            </p>
          </div>
        </div>
      )
    },
    {
      name: 'Current Admins',
      component: (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading admins...</div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No admins found</div>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{admin.email}</p>
                    {admin.full_name && (
                      <p className="text-sm text-gray-400">{admin.full_name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Added {new Date(admin.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      admin.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm text-gray-400 capitalize">{admin.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      name: 'Audit Log',
      component: (
        <div className="space-y-4">
          {auditLog.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No audit entries</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLog.map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">
                        {entry.action.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      entry.action.includes('FAILED')
                        ? 'bg-red-500/20 text-red-300'
                        : entry.action === 'GRANT'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {entry.action}
                    </span>
                  </div>
                  
                  {entry.reason && (
                    <p className="text-sm text-gray-400 mb-2">
                      Reason: {entry.reason}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <p className="text-gray-400">User</p>
                      <p className="font-mono">{entry.user_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Admin</p>
                      <p className="font-mono">{entry.admin_id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="w-full">
      <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-slate-800/50 p-1 mb-8">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                clsx(
                  'px-4 py-2.5 text-sm font-medium leading-5 rounded-lg',
                  'ring-white/60 ring-offset-2 ring-offset-slate-900 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-teal-500 text-white shadow'
                    : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {tabs.map((tab, idx) => (
            <Tab.Panel
              key={idx}
              className={clsx(
                'rounded-xl focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-900 ring-white/60'
              )}
            >
              {tab.component}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
