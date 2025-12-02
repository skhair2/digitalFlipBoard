import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import * as adminService from '../../services/adminService';
import Spinner from '../ui/Spinner';
import { Switch } from '@headlessui/react';

/**
 * Global Settings
 * Manage system-wide configurations
 */

export default function GlobalSettings() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        maintenance_mode: { enabled: false, message: '' },
        global_announcement: { enabled: false, message: '', type: 'info' },
        registration_open: { enabled: true }
    });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const result = await adminService.fetchGlobalSettings();
            if (result.success) {
                // Merge with defaults to ensure structure
                setSettings(prev => ({ ...prev, ...result.settings }));
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key, value) => {
        try {
            setSuccessMessage('');
            setError(null);

            const result = await adminService.updateGlobalSetting(key, value, user.id);

            if (result.success) {
                setSettings(prev => ({ ...prev, [key]: value }));
                setSuccessMessage('Settings updated successfully');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="flex-1 overflow-auto">
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Global Settings</h1>
                    <p className="text-gray-400 mt-2">Configure system-wide behavior</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-300">
                        {successMessage}
                    </div>
                )}

                <div className="space-y-6 max-w-4xl">
                    {/* Maintenance Mode */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Maintenance Mode</h2>
                                <p className="text-gray-400 text-sm">Disable access for non-admin users</p>
                            </div>
                            <Switch
                                checked={settings.maintenance_mode?.enabled || false}
                                onChange={(checked) => handleSave('maintenance_mode', { ...settings.maintenance_mode, enabled: checked })}
                                className={`${settings.maintenance_mode?.enabled ? 'bg-red-600' : 'bg-gray-600'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                                <span
                                    className={`${settings.maintenance_mode?.enabled ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                        </div>

                        {settings.maintenance_mode?.enabled && (
                            <div className="mt-4">
                                <label className="block text-sm text-gray-400 mb-2">Maintenance Message</label>
                                <input
                                    type="text"
                                    value={settings.maintenance_mode?.message || ''}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        maintenance_mode: { ...prev.maintenance_mode, message: e.target.value }
                                    }))}
                                    onBlur={() => handleSave('maintenance_mode', settings.maintenance_mode)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    placeholder="System is under maintenance..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Global Announcement */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Global Announcement</h2>
                                <p className="text-gray-400 text-sm">Show a banner message to all users</p>
                            </div>
                            <Switch
                                checked={settings.global_announcement?.enabled || false}
                                onChange={(checked) => handleSave('global_announcement', { ...settings.global_announcement, enabled: checked })}
                                className={`${settings.global_announcement?.enabled ? 'bg-indigo-600' : 'bg-gray-600'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                                <span
                                    className={`${settings.global_announcement?.enabled ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                        </div>

                        {settings.global_announcement?.enabled && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Message</label>
                                    <input
                                        type="text"
                                        value={settings.global_announcement?.message || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            global_announcement: { ...prev.global_announcement, message: e.target.value }
                                        }))}
                                        onBlur={() => handleSave('global_announcement', settings.global_announcement)}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        placeholder="New features available!"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Type</label>
                                    <select
                                        value={settings.global_announcement?.type || 'info'}
                                        onChange={(e) => handleSave('global_announcement', { ...settings.global_announcement, type: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    >
                                        <option value="info">Info (Blue)</option>
                                        <option value="warning">Warning (Yellow)</option>
                                        <option value="error">Critical (Red)</option>
                                        <option value="success">Success (Green)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Registration Control */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">User Registration</h2>
                                <p className="text-gray-400 text-sm">Allow new users to sign up</p>
                            </div>
                            <Switch
                                checked={settings.registration_open?.enabled ?? true}
                                onChange={(checked) => handleSave('registration_open', { enabled: checked })}
                                className={`${(settings.registration_open?.enabled ?? true) ? 'bg-green-600' : 'bg-gray-600'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                                <span
                                    className={`${(settings.registration_open?.enabled ?? true) ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
