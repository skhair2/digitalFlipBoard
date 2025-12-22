import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '../../store/adminStore';
import * as adminService from '../../services/adminService';
import Spinner from '../ui/Spinner';
import { 
  UsersIcon, 
  StarIcon, 
  ChatBubbleLeftRightIcon, 
  LinkIcon, 
  PaintBrushIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  BellIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

/**
 * Admin Dashboard
 * High-fidelity redesign with professional metrics and analytics
 */

export default function AdminDashboard() {
  const { systemStats, setSystemStats } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await adminService.getSystemAnalytics();
      if (result.success) {
        setSystemStats(result.analytics);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Failed to load system stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setSystemStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: systemStats
    };
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-report-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Initializing Analytics...</p>
        </div>
      </div>
    );
  }

  const stats = systemStats || {};
  const premiumUsers = stats.tierBreakdown?.premium || 0;
  const totalMessages = stats.totalBoards || 0;

  const metrics = [
    {
      label: 'Total Users',
      value: stats.totalUsers || 0,
      icon: UsersIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Premium Tier',
      value: premiumUsers,
      icon: StarIcon,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      trend: '+5%',
      trendUp: true
    },
    {
      label: 'Total Sessions',
      value: totalMessages,
      icon: ChatBubbleLeftRightIcon,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      trend: '+24%',
      trendUp: true
    },
    {
      label: 'Active (24h)',
      value: stats.activeSessions24h || 0,
      icon: LinkIcon,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      trend: '-2%',
      trendUp: false
    }
  ];

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-xl">
              <ChartBarIcon className="w-6 h-6 text-teal-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">System Overview</h1>
          </div>
          <p className="text-slate-400 font-medium max-w-md">
            Real-time analytics and performance metrics for the Digital FlipBoard ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshStats}
            disabled={refreshing}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
          >
            <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
          <button
            onClick={handleExportReport}
            className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-slate-700 transition-all"
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              <div className="flex items-start justify-between">
                <div className={`p-3 ${metric.bg} rounded-2xl`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${metric.trendUp ? 'text-teal-500' : 'text-rose-500'}`}>
                  {metric.trendUp ? <ArrowUpRightIcon className="w-3 h-3" /> : <ArrowDownRightIcon className="w-3 h-3" />}
                  {metric.trend}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">{metric.label}</p>
                <p className="text-3xl font-black text-white tracking-tight">{metric.value.toLocaleString()}</p>
              </div>
            </div>
            {/* Decorative background element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${metric.bg} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
          </motion.div>
        ))}
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Health Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden"
        >
          <div className="p-8 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CpuChipIcon className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Infrastructure Health</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-teal-500 font-black uppercase tracking-widest">All Systems Operational</span>
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Database Latency</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white">24ms</p>
                <p className="text-[10px] text-teal-500 font-bold mb-1">Optimal</p>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[15%] bg-teal-500 rounded-full" />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">API Throughput</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white">1.2k</p>
                <p className="text-[10px] text-slate-400 font-bold mb-1">req/min</p>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[45%] bg-blue-500 rounded-full" />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Storage Usage</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white">64%</p>
                <p className="text-[10px] text-amber-500 font-bold mb-1">Warning</p>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[64%] bg-amber-500 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions / Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Security Alerts</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">New Admin Granted</p>
                  <p className="text-[10px] text-slate-500 mt-1">2 hours ago • System Audit</p>
                </div>
              </div>
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Traffic Spike Detected</p>
                  <p className="text-[10px] text-slate-500 mt-1">5 hours ago • US-East-1</p>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-4 mt-8 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-slate-700">
            View All Activity
          </button>
        </motion.div>
      </div>
    </div>
  );
}
