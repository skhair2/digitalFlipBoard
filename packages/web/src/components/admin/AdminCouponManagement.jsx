import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useCouponStore } from '../../store/couponStore'
import Spinner from '../ui/Spinner'
import {
  TicketIcon,
  PlusIcon,
  QueueListIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  TagIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  SparklesIcon,
  BeakerIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

/**
 * AdminCouponManagement - High-fidelity redesign
 * Professional coupon engine with generation, templates, and real-time analytics.
 */

export default function AdminCouponManagement() {
  const { user } = useAuthStore()
  const {
    coupons,
    couponsLoading,
    selectedCoupon,
    couponAnalytics,
    templates,
    templatesLoading,
    couponStatusFilter,
    setCouponStatusFilter,
    setSelectedCoupon,
    fetchCoupons,
    fetchTemplates,
    updateCouponStatus,
    deleteCoupon,
    generateCoupons,
    generateCouponsFromTemplate,
    fetchCouponAnalytics,
    createTemplate,
    exportCoupons
  } = useCouponStore()

  const [activeTab, setActiveTab] = useState('generate')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [formData, setFormData] = useState({
    couponType: 'percentage',
    discountValue: 10,
    quantity: 10,
    maxUses: 1,
    applicableTier: 'all',
    minPurchaseAmount: 0,
    expiryDate: '',
    description: '',
    prefix: 'FLIP'
  })

  const [templateData, setTemplateData] = useState({
    templateName: '',
    couponType: 'percentage',
    discountValue: 10,
    maxUses: 1,
    applicableTier: 'all',
    minPurchaseAmount: 0,
    description: ''
  })

  const [templateQuantity, setTemplateQuantity] = useState(10)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    if (activeTab === 'manage') fetchCoupons()
    else if (activeTab === 'templates') fetchTemplates()
    else if (activeTab === 'analytics') fetchCouponAnalytics()
  }, [activeTab, fetchCoupons, fetchTemplates, fetchCouponAnalytics])

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [coupons, searchQuery])

  const handleGenerateCoupons = async (e) => {
    e.preventDefault()
    const config = {
      ...formData,
      discountValue: parseFloat(formData.discountValue),
      quantity: parseInt(formData.quantity),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null
    }

    const result = await generateCoupons(config, user.id)
    if (result.success) {
      setActiveTab('manage')
      fetchCoupons()
    }
  }

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    const config = {
      ...templateData,
      discountValue: parseFloat(templateData.discountValue),
      maxUses: templateData.maxUses ? parseInt(templateData.maxUses) : null,
      minPurchaseAmount: templateData.minPurchaseAmount ? parseFloat(templateData.minPurchaseAmount) : 0
    }

    const result = await createTemplate(config, user.id)
    if (result.success) {
      setShowTemplateModal(false)
      fetchTemplates()
    }
  }

  const tabs = [
    { id: 'generate', label: 'Generate', icon: SparklesIcon },
    { id: 'manage', label: 'Manage', icon: QueueListIcon },
    { id: 'templates', label: 'Templates', icon: DocumentDuplicateIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
  ]

  return (
    <div className="flex h-full overflow-hidden bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="p-8 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <TicketIcon className="w-6 h-6 text-teal-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Coupon Engine</h1>
              </div>
              <p className="text-slate-400 font-medium">Generate, manage, and analyze promotional campaigns.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'generate' && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-teal-500/20 rounded-2xl text-teal-500">
                      <SparklesIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">Batch Generation</h2>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Create unique promotional codes</p>
                    </div>
                  </div>

                  <form onSubmit={handleGenerateCoupons} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Coupon Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['percentage', 'fixed'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData({ ...formData, couponType: type })}
                              className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                formData.couponType === type
                                  ? 'bg-slate-800 border-slate-600 text-white'
                                  : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Discount Value</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-teal-500/50 transition-all"
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                            {formData.couponType === 'percentage' ? '%' : 'USD'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Quantity to Generate</label>
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Code Prefix</label>
                        <input
                          type="text"
                          value={formData.prefix}
                          onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Expiry Date</label>
                        <input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-teal-500/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Summer Sale 2024..."
                          className="w-full h-[108px] bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:border-teal-500/50 transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-4">
                      <button
                        type="submit"
                        className="w-full py-5 bg-teal-500 hover:bg-teal-400 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-3"
                      >
                        <SparklesIcon className="w-5 h-5" />
                        Generate Batch Now
                      </button>
                    </div>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                      <InformationCircleIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Codes are generated using a cryptographically secure random engine.
                    </p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                      <BeakerIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Prefixes help identify specific marketing campaigns in analytics.
                    </p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2rem] p-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Expiry dates are enforced at the database level for security.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'manage' && (
              <motion.div
                key="manage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full gap-8"
              >
                {/* Sidebar List */}
                <div className="w-1/3 flex flex-col gap-6">
                  <div className="relative group">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search codes..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {couponsLoading ? (
                      <div className="flex justify-center py-12"><Spinner /></div>
                    ) : filteredCoupons.map((coupon) => (
                      <button
                        key={coupon.id}
                        onClick={() => setSelectedCoupon(coupon)}
                        className={`w-full text-left p-5 rounded-[2rem] border transition-all ${
                          selectedCoupon?.id === coupon.id
                            ? 'bg-slate-900 border-teal-500/50 shadow-lg shadow-teal-500/5'
                            : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-black text-white uppercase tracking-tight">{coupon.code}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${coupon.is_active ? 'bg-teal-500/10 text-teal-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <TagIcon className="w-3 h-3" />
                            {coupon.coupon_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="w-3 h-3" />
                            {coupon.uses_count} / {coupon.max_uses || ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detail View */}
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {selectedCoupon ? (
                      <motion.div
                        key={selectedCoupon.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-10 h-full flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-10">
                          <div className="flex items-center gap-5">
                            <div className="p-4 bg-slate-800 rounded-[1.5rem] text-teal-500">
                              <TicketIcon className="w-8 h-8" />
                            </div>
                            <div>
                              <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedCoupon.code}</h2>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Coupon ID: {selectedCoupon.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateCouponStatus(selectedCoupon.id, !selectedCoupon.is_active)}
                              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedCoupon.is_active
                                  ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'
                                  : 'bg-teal-500/10 text-teal-500 hover:bg-teal-500 hover:text-white'
                              }`}
                            >
                              {selectedCoupon.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteCoupon(selectedCoupon.id)}
                              className="p-3 bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-10">
                          <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium text-slate-400">Type</span>
                                <span className="text-xs font-black text-white uppercase">{selectedCoupon.coupon_type}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium text-slate-400">Value</span>
                                <span className="text-xs font-black text-white">
                                  {selectedCoupon.coupon_type === 'percentage' ? `${selectedCoupon.discount_value}%` : `$${selectedCoupon.discount_value}`}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium text-slate-400">Min Purchase</span>
                                <span className="text-xs font-black text-white">${selectedCoupon.min_purchase_amount || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usage & Limits</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium text-slate-400">Total Uses</span>
                                <span className="text-xs font-black text-white">{selectedCoupon.uses_count}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium text-slate-400">Max Uses</span>
                                <span className="text-xs font-black text-white">{selectedCoupon.max_uses || 'Unlimited'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-medium text-slate-400">Expiry</span>
                                <span className="text-xs font-black text-white">
                                  {selectedCoupon.expiry_date ? new Date(selectedCoupon.expiry_date).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Description & Notes</h3>
                          <p className="text-sm text-slate-300 font-medium leading-relaxed">
                            {selectedCoupon.description || 'No description provided for this coupon.'}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                        <div className="p-6 bg-slate-900 rounded-[2rem] mb-6">
                          <TicketIcon className="w-12 h-12 text-slate-700" />
                        </div>
                        <h3 className="text-white font-black uppercase tracking-tight">Select a Coupon</h3>
                        <p className="text-slate-500 text-xs font-medium mt-1">Choose a code from the list to view details.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'templates' && (
              <motion.div
                key="templates"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Coupon Templates</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Reusable configurations for quick generation</p>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create Template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {templatesLoading ? (
                    <div className="col-span-full flex justify-center py-12"><Spinner /></div>
                  ) : templates.map((template) => (
                    <div key={template.id} className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-slate-800 rounded-2xl text-teal-500">
                          <DocumentDuplicateIcon className="w-6 h-6" />
                        </div>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-widest">
                          {template.coupon_type}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{template.template_name}</h3>
                      <p className="text-xs text-slate-500 font-medium mb-8 line-clamp-2">{template.description || 'No description'}</p>
                      
                      <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">Discount</span>
                          <span className="text-white">
                            {template.coupon_type === 'percentage' ? `${template.discount_value}%` : `$${template.discount_value}`}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTemplate(template)
                            // Logic to show generation modal from template
                          }}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Generate from Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Redeemed', value: couponAnalytics?.totalRedeemed || 0, icon: CheckCircleIcon, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                    { label: 'Active Coupons', value: couponAnalytics?.activeCount || 0, icon: TicketIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Total Revenue', value: `$${(couponAnalytics?.totalRevenue || 0).toLocaleString()}`, icon: CurrencyDollarIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Avg. Discount', value: `${couponAnalytics?.avgDiscount || 0}%`, icon: TagIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Top Performing Codes</h3>
                    <div className="space-y-4">
                      {(couponAnalytics?.topCoupons || []).map((c, i) => (
                        <div key={c.code} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-700">0{i + 1}</span>
                            <span className="text-sm font-black text-white uppercase tracking-tight">{c.code}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-teal-500">{c.uses} Uses</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">${c.revenue} Revenue</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Redemption Trends</h3>
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                      {(couponAnalytics?.trends || [40, 65, 45, 90, 55, 75, 85]).map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${val}%` }}
                            className="w-full bg-teal-500/20 border-t-2 border-teal-500 rounded-t-lg"
                          />
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Day {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Create New Template</h2>
              <form onSubmit={handleCreateTemplate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Template Name</label>
                  <input
                    type="text"
                    value={templateData.templateName}
                    onChange={(e) => setTemplateData({ ...templateData, templateName: e.target.value })}
                    placeholder="e.g. Holiday Promo 20%"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-teal-500/50 transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Type</label>
                    <select
                      value={templateData.couponType}
                      onChange={(e) => setTemplateData({ ...templateData, couponType: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-teal-500/50 transition-all appearance-none"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Value</label>
                    <input
                      type="number"
                      value={templateData.discountValue}
                      onChange={(e) => setTemplateData({ ...templateData, discountValue: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-teal-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Description</label>
                  <textarea
                    value={templateData.description}
                    onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                    className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:border-teal-500/50 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-teal-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
