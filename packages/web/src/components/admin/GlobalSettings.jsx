import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import * as adminService from '../../services/adminService'
import Spinner from '../ui/Spinner'
import { Switch } from '@headlessui/react'
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CommandLineIcon,
  LockClosedIcon,
  GlobeAltIcon,
  BellIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

/**
 * Global Settings - High-fidelity redesign
 * Professional interface for managing system-wide configurations and maintenance.
 */

export default function GlobalSettings() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    maintenance_mode: { enabled: false, message: '' },
    global_announcement: { enabled: false, message: '', type: 'info' },
    registration_open: { enabled: true }
  })
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const result = await adminService.fetchGlobalSettings()
      if (result.success) {
        setSettings(prev => ({ ...prev, ...result.settings }))
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async (key, value) => {
    try {
      setIsSaving(true)
      setSuccessMessage('')
      setError(null)

      const result = await adminService.updateGlobalSetting(key, value, user.id)

      if (result.success) {
        setSettings(prev => ({ ...prev, [key]: value }))
        setSuccessMessage(`${key.replace(/_/g, ' ').toUpperCase()} UPDATED SUCCESSFULLY`)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-xl">
              <Cog6ToothIcon className="w-6 h-6 text-teal-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">System Configuration</h1>
          </div>
          <p className="text-slate-400 font-medium max-w-md">
            Manage global platform behavior, maintenance windows, and public announcements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      </div>

      {/* Status Banners */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-3"
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            {error}
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <CheckCircleIcon className="w-5 h-5" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Maintenance Mode */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${settings.maintenance_mode?.enabled ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-800 text-slate-500'}`}>
                <LockClosedIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Maintenance Mode</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Restrict platform access</p>
              </div>
            </div>
            <Switch
              checked={settings.maintenance_mode?.enabled || false}
              onChange={(checked) => handleSave('maintenance_mode', { ...settings.maintenance_mode, enabled: checked })}
              className={`${settings.maintenance_mode?.enabled ? 'bg-rose-500' : 'bg-slate-700'} relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none`}
            >
              <span className={`${settings.maintenance_mode?.enabled ? 'translate-x-8' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-all`} />
            </Switch>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maintenance Message</label>
            <textarea
              value={settings.maintenance_mode?.message || ''}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: { ...settings.maintenance_mode, message: e.target.value } })}
              placeholder="SYSTEM IS CURRENTLY UNDERGOING SCHEDULED MAINTENANCE..."
              className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500/50 transition-all resize-none"
            />
            <button
              onClick={() => handleSave('maintenance_mode', settings.maintenance_mode)}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
            >
              Update Maintenance Message
            </button>
          </div>
        </div>

        {/* Registration Control */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${settings.registration_open?.enabled ? 'bg-teal-500/20 text-teal-500' : 'bg-slate-800 text-slate-500'}`}>
                <UserPlusIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">User Registration</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Control new account creation</p>
              </div>
            </div>
            <Switch
              checked={settings.registration_open?.enabled || false}
              onChange={(checked) => handleSave('registration_open', { enabled: checked })}
              className={`${settings.registration_open?.enabled ? 'bg-teal-500' : 'bg-slate-700'} relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none`}
            >
              <span className={`${settings.registration_open?.enabled ? 'translate-x-8' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-all`} />
            </Switch>
          </div>

          <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                When disabled, new users will not be able to create accounts. Existing users can still log in and manage their boards. This is useful during high-load events or private beta phases.
              </p>
            </div>
          </div>
        </div>

        {/* Global Announcement */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${settings.global_announcement?.enabled ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                <MegaphoneIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Global Announcement</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Broadcast message to all users</p>
              </div>
            </div>
            <Switch
              checked={settings.global_announcement?.enabled || false}
              onChange={(checked) => handleSave('global_announcement', { ...settings.global_announcement, enabled: checked })}
              className={`${settings.global_announcement?.enabled ? 'bg-amber-500' : 'bg-slate-700'} relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none`}
            >
              <span className={`${settings.global_announcement?.enabled ? 'translate-x-8' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-all`} />
            </Switch>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Announcement Content</label>
              <textarea
                value={settings.global_announcement?.message || ''}
                onChange={(e) => setSettings({ ...settings, global_announcement: { ...settings.global_announcement, message: e.target.value } })}
                placeholder="ENTER ANNOUNCEMENT TEXT..."
                className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-700 text-xs font-medium focus:outline-none focus:border-amber-500/50 transition-all resize-none"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alert Type</label>
              <div className="grid grid-cols-1 gap-2">
                {['info', 'warning', 'error', 'success'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSettings({ ...settings, global_announcement: { ...settings.global_announcement, type } })}
                    className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      settings.global_announcement?.type === type
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSave('global_announcement', settings.global_announcement)}
            className="w-full py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Update Global Announcement
          </button>
        </div>
      </div>

      {/* System Info Footer */}
      <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-800 rounded-xl text-slate-500">
            <CommandLineIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment Context</p>
            <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">Production Cluster  v2.4.0-stable</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
            System Diagnostics
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            View Audit Logs
          </button>
        </div>
      </div>
    </div>
  )
}
