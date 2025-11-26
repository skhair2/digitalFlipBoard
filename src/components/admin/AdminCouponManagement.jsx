import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCouponStore } from '../../store/couponStore';
import Spinner from '../ui/Spinner';

/**
 * AdminCouponManagement Component
 * Senior-level coupon management with generation, validation, and analytics
 */

export default function AdminCouponManagement() {
  const { user } = useAuthStore();
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
  } = useCouponStore();

  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'manage', 'templates', 'analytics'
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
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
  });

  const [templateData, setTemplateData] = useState({
    templateName: '',
    couponType: 'percentage',
    discountValue: 10,
    maxUses: 1,
    applicableTier: 'all',
    minPurchaseAmount: 0,
    description: ''
  });

  const [templateQuantity, setTemplateQuantity] = useState(10);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchCoupons();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'analytics') {
      fetchCouponAnalytics();
    }
  }, [activeTab]);

  // ============================================
  // COUPON GENERATION
  // ============================================

  const handleGenerateCoupons = async (e) => {
    e.preventDefault();
    
    const config = {
      ...formData,
      discountValue: parseFloat(formData.discountValue),
      quantity: parseInt(formData.quantity),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null
    };

    const result = await generateCoupons(config, user.id);
    
    if (result.success) {
      setGeneratedCodes(result.codes);
      alert(`✓ Generated ${result.count} coupon(s) successfully!`);
      setFormData({
        couponType: 'percentage',
        discountValue: 10,
        quantity: 10,
        maxUses: 1,
        applicableTier: 'all',
        minPurchaseAmount: 0,
        expiryDate: '',
        description: '',
        prefix: 'FLIP'
      });
      setGeneratedCodes([]);
      setActiveTab('manage');
      fetchCoupons();
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const handleGenerateFromTemplate = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    const result = await generateCouponsFromTemplate(
      selectedTemplate,
      parseInt(templateQuantity),
      user.id
    );

    if (result.success) {
      alert(`✓ Generated ${result.count} coupon(s) from template!`);
      setTemplateQuantity(10);
      setSelectedTemplate(null);
      fetchCoupons();
      setActiveTab('manage');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  // ============================================
  // TEMPLATE MANAGEMENT
  // ============================================

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    
    const config = {
      ...templateData,
      discountValue: parseFloat(templateData.discountValue),
      maxUses: templateData.maxUses ? parseInt(templateData.maxUses) : null,
      minPurchaseAmount: templateData.minPurchaseAmount ? parseFloat(templateData.minPurchaseAmount) : 0
    };

    const result = await createTemplate(config, user.id);
    
    if (result.success) {
      alert('✓ Template created successfully!');
      setTemplateData({
        templateName: '',
        couponType: 'percentage',
        discountValue: 10,
        maxUses: 1,
        applicableTier: 'all',
        minPurchaseAmount: 0,
        description: ''
      });
      setShowTemplateModal(false);
      fetchTemplates();
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  // ============================================
  // COUPON MANAGEMENT
  // ============================================

  const handleToggleCouponStatus = async (coupon) => {
    const result = await updateCouponStatus(coupon.id, !coupon.is_active);
    
    if (result.success) {
      alert(result.coupon.is_active ? '✓ Coupon activated' : '✓ Coupon deactivated');
      fetchCoupons();
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      const result = await deleteCoupon(couponId);
      
      if (result.success) {
        alert('✓ Coupon deleted');
        setSelectedCoupon(null);
        fetchCoupons();
      } else {
        alert('❌ Error: ' + result.error);
      }
    }
  };

  const handleExportCoupons = async () => {
    const couponIds = coupons.map(c => c.id);
    const result = await exportCoupons(couponIds);
    
    if (result.success) {
      // Convert to CSV
      const csv = [
        ['Code', 'Type', 'Discount Value', 'Max Uses', 'Current Uses', 'Active', 'Expiry Date', 'Description'],
        ...result.data.map(c => [
          c.code,
          c.coupon_type,
          c.discount_value,
          c.max_uses || 'Unlimited',
          c.current_uses,
          c.is_active ? 'Yes' : 'No',
          c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No Expiry',
          c.description
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coupons-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // ============================================
  // RENDER TABS
  // ============================================

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        {['generate', 'manage', 'templates', 'analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'generate' && '✨ Generate'}
            {tab === 'manage' && '📋 Manage'}
            {tab === 'templates' && '📝 Templates'}
            {tab === 'analytics' && '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* GENERATE COUPONS TAB */}
      {activeTab === 'generate' && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">Generate New Coupons</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => { setShowModal(true); setShowTemplateModal(false); }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              ➕ Create New Coupons
            </button>
            <button
              onClick={() => { setShowTemplateModal(true); setShowModal(false); }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              🎨 Create Template
            </button>
          </div>

          {/* Existing Templates */}
          {!templatesLoading && templates.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Quick Generate from Template</h4>
              <div className="flex gap-3 flex-wrap">
                {templates.map(template => (
                  <div key={template.id} className="flex gap-2">
                    <select
                      value={selectedTemplate === template.id ? template.id : ''}
                      onChange={(e) => setSelectedTemplate(e.target.value === '' ? null : e.target.value)}
                      className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                    >
                      <option value="">{template.template_name}</option>
                      <option value={template.id}>{template.template_name}</option>
                    </select>
                  </div>
                ))}
              </div>

              {selectedTemplate && (
                <div className="mt-4 flex gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={templateQuantity}
                    onChange={(e) => setTemplateQuantity(e.target.value)}
                    className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 w-32"
                    placeholder="Quantity"
                  />
                  <button
                    onClick={handleGenerateFromTemplate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Generate {templateQuantity} Coupons
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Generated Codes Display */}
          {generatedCodes.length > 0 && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <h4 className="text-green-400 font-bold mb-3">✓ Generated Coupon Codes</h4>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {generatedCodes.map((code, idx) => (
                  <code
                    key={idx}
                    className="bg-slate-900 text-green-300 px-3 py-2 rounded text-sm font-mono border border-green-500/20 cursor-pointer hover:border-green-500 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      alert('Copied: ' + code);
                    }}
                  >
                    {code}
                  </code>
                ))}
              </div>
              <button
                onClick={() => {
                  const text = generatedCodes.join('\n');
                  navigator.clipboard.writeText(text);
                  alert('All codes copied!');
                }}
                className="mt-3 text-sm text-green-400 hover:text-green-300"
              >
                📋 Copy All Codes
              </button>
            </div>
          )}
        </div>
      )}

      {/* MANAGE COUPONS TAB */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <select
              value={couponStatusFilter}
              onChange={(e) => setCouponStatusFilter(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
            >
              <option value="all">All Coupons</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <button
              onClick={handleExportCoupons}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors ml-auto"
            >
              📥 Export CSV
            </button>
          </div>

          {couponsLoading ? (
            <Spinner />
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No coupons found</div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Discount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Uses</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Expiry</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <code className="bg-slate-900 text-teal-300 px-2 py-1 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {coupon.coupon_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {coupon.current_uses}/{coupon.max_uses || '∞'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          coupon.is_active 
                            ? 'bg-green-900/30 text-green-300' 
                            : 'bg-red-900/30 text-red-300'
                        }`}>
                          {coupon.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedCoupon(coupon)}
                          className="text-teal-400 hover:text-teal-300 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleToggleCouponStatus(coupon)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          {coupon.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            ➕ New Template
          </button>

          {templatesLoading ? (
            <Spinner />
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No templates created yet</div>
          ) : (
            <div className="grid gap-4">
              {templates.map(template => (
                <div key={template.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-white font-bold mb-2">{template.template_name}</h4>
                  <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Type</span>
                      <p className="text-white font-medium">{template.coupon_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Discount</span>
                      <p className="text-white font-medium">
                        {template.coupon_type === 'percentage' ? `${template.discount_value}%` : `$${template.discount_value}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Uses</span>
                      <p className="text-white font-medium">{template.max_uses || '∞'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Applicable To</span>
                      <p className="text-white font-medium">{template.applicable_tier}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {couponAnalytics ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-gray-400 text-sm">Total Redemptions</p>
                  <p className="text-3xl font-bold text-teal-400">{couponAnalytics.totalRedemptions}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-gray-400 text-sm">Total Discounted</p>
                  <p className="text-3xl font-bold text-green-400">${couponAnalytics.totalDiscounted}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-gray-400 text-sm">Avg Discount</p>
                  <p className="text-3xl font-bold text-blue-400">${couponAnalytics.averageDiscount}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-gray-400 text-sm">Utilization Rate</p>
                  <p className="text-3xl font-bold text-purple-400">{couponAnalytics.utilizationRate}%</p>
                </div>
              </div>

              {/* Top Coupons */}
              {couponAnalytics.topCoupons.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Top Performing Coupons</h3>
                  <div className="space-y-2">
                    {couponAnalytics.topCoupons.map((coupon, idx) => (
                      <div key={coupon.id} className="flex items-center justify-between pb-2 border-b border-slate-700">
                        <div>
                          <p className="text-white font-medium">#{idx + 1}: {coupon.code}</p>
                          <p className="text-gray-400 text-sm">
                            {coupon.coupon_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`} off
                          </p>
                        </div>
                        <span className="text-teal-400 font-bold text-lg">{coupon.current_uses} uses</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Spinner />
          )}
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Generate Coupons</h2>
            
            <form onSubmit={handleGenerateCoupons} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={formData.couponType}
                  onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Value {formData.couponType === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prefix</label>
                <input
                  type="text"
                  maxLength="4"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Uses per Code</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Applicable Tier</label>
                <select
                  value={formData.applicableTier}
                  onChange={(e) => setFormData({ ...formData, applicableTier: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free Only</option>
                  <option value="pro">Pro Only</option>
                  <option value="enterprise">Enterprise Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Purchase Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 resize-none"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Create Coupon Template</h2>
            
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateData.templateName}
                  onChange={(e) => setTemplateData({ ...templateData, templateName: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                  placeholder="e.g., Summer20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={templateData.couponType}
                  onChange={(e) => setTemplateData({ ...templateData, couponType: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Value {templateData.couponType === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={templateData.discountValue}
                  onChange={(e) => setTemplateData({ ...templateData, discountValue: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Uses per Code</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={templateData.maxUses}
                  onChange={(e) => setTemplateData({ ...templateData, maxUses: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Applicable Tier</label>
                <select
                  value={templateData.applicableTier}
                  onChange={(e) => setTemplateData({ ...templateData, applicableTier: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free Only</option>
                  <option value="pro">Pro Only</option>
                  <option value="enterprise">Enterprise Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Purchase Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={templateData.minPurchaseAmount}
                  onChange={(e) => setTemplateData({ ...templateData, minPurchaseAmount: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={templateData.description}
                  onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 resize-none"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON DETAILS MODAL */}
      {selectedCoupon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Coupon Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Code</p>
                <code className="text-teal-300 font-mono text-lg font-bold">{selectedCoupon.code}</code>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Type</p>
                  <p className="text-white font-medium capitalize">{selectedCoupon.coupon_type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Discount</p>
                  <p className="text-white font-medium">
                    {selectedCoupon.coupon_type === 'percentage' ? `${selectedCoupon.discount_value}%` : `$${selectedCoupon.discount_value}`}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Uses</p>
                  <p className="text-white font-medium">{selectedCoupon.current_uses}/{selectedCoupon.max_uses || '∞'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedCoupon.is_active 
                      ? 'bg-green-900/30 text-green-300' 
                      : 'bg-red-900/30 text-red-300'
                  }`}>
                    {selectedCoupon.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Description</p>
                <p className="text-white">{selectedCoupon.description || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Created</p>
                <p className="text-white">{new Date(selectedCoupon.created_at).toLocaleDateString()}</p>
              </div>
              {selectedCoupon.expiry_date && (
                <div>
                  <p className="text-gray-400 text-sm">Expires</p>
                  <p className="text-white">{new Date(selectedCoupon.expiry_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setSelectedCoupon(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteCoupon(selectedCoupon.id);
                  setSelectedCoupon(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
