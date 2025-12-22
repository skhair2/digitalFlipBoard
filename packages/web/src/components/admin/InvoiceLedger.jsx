import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '../ui/Spinner'
import { useAdminStore } from '../../store/adminStore'
import {
  BanknotesIcon,
  UserGroupIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronRightIcon,
  CreditCardIcon,
  CalendarIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  ClockIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline'

const statusConfig = {
  paid: { color: 'text-teal-500', bg: 'bg-teal-500/10', icon: CheckBadgeIcon, label: 'PAID' },
  open: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: ClockIcon, label: 'OPEN' },
  void: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: NoSymbolIcon, label: 'VOID' },
  uncollectible: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: NoSymbolIcon, label: 'UNCOLLECTIBLE' },
  draft: { color: 'text-slate-500', bg: 'bg-slate-500/10', icon: DocumentTextIcon, label: 'DRAFT' }
}

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number') return ''
  const dollars = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: currency?.toUpperCase() || 'USD'
  })
  return dollars
}

export default function InvoiceLedger() {
  const {
    invoiceRows,
    invoiceLoading,
    invoiceError,
    invoiceSummary,
    invoiceFilterEmail,
    invoicePagination,
    setInvoiceFilterEmail,
    loadInvoiceLedger,
    loadMoreInvoices
  } = useAdminStore()

  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => {
    loadInvoiceLedger()
  }, [loadInvoiceLedger])

  const stats = useMemo(() => [
    {
      label: 'Free Customers',
      value: invoiceSummary?.totalFreeCustomers ?? 0,
      icon: UserIcon,
      color: 'text-slate-400',
      bg: 'bg-slate-400/10'
    },
    {
      label: 'Paying Customers',
      value: invoiceSummary?.totalPayingCustomers ?? 0,
      icon: CheckBadgeIcon,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    },
    {
      label: 'Anonymous Visitors',
      value: invoiceSummary?.totalAnonymousUsers ?? 0,
      icon: UserGroupIcon,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    }
  ], [invoiceSummary])

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    loadInvoiceLedger({ emailFilter: invoiceFilterEmail })
  }

  const handleClearFilter = () => {
    setInvoiceFilterEmail('')
    loadInvoiceLedger({ emailFilter: '' })
  }

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
                  <BanknotesIcon className="w-6 h-6 text-teal-500" />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Invoice Ledger</h1>
              </div>
              <p className="text-slate-400 font-medium">Financial audit trail and customer billing history.</p>
            </div>

            <div className="flex items-center gap-3">
              <form onSubmit={handleFilterSubmit} className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="text"
                  value={invoiceFilterEmail}
                  onChange={(e) => setInvoiceFilterEmail(e.target.value)}
                  placeholder="Filter by email..."
                  className="w-64 bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                />
                {invoiceFilterEmail && (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
              <button
                onClick={() => loadInvoiceLedger()}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-700 transition-all group"
              >
                <ArrowPathIcon className={`w-5 h-5 ${invoiceLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {invoiceError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-3">
              <NoSymbolIcon className="w-5 h-5" />
              {invoiceError}
            </div>
          )}

          <div className="space-y-3">
            {invoiceRows.map((invoice) => {
              const status = statusConfig[invoice.status?.toLowerCase()] || statusConfig.draft
              const isSelected = selectedInvoice?.id === invoice.id

              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedInvoice(invoice)}
                  className={`group relative p-5 rounded-[2rem] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-teal-500/50 shadow-lg shadow-teal-500/5'
                      : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className={`p-4 rounded-2xl transition-colors ${isSelected ? 'bg-teal-500/20 text-teal-500' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                        <CreditCardIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">
                            {invoice.customerName || 'Anonymous Customer'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <EnvelopeIcon className="w-3.5 h-3.5" />
                            {invoice.customerEmail || 'no-email@provided'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {invoice.created ? new Date(invoice.created).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-black text-white tracking-tight">
                          {formatCurrency(invoice.amountPaid, invoice.currency)}
                        </p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          {invoice.billingReason || 'Subscription'}
                        </p>
                      </div>
                      <ChevronRightIcon className={`w-5 h-5 transition-all ${isSelected ? 'text-teal-500 translate-x-1' : 'text-slate-700 group-hover:text-slate-500'}`} />
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {invoiceLoading && (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            )}

            {!invoiceLoading && invoiceRows.length === 0 && (
              <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                <div className="p-4 bg-slate-900 rounded-2xl w-fit mx-auto mb-4">
                  <MagnifyingGlassIcon className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-white font-black uppercase tracking-tight">No Invoices Found</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">Try adjusting your search or filters.</p>
              </div>
            )}

            {invoicePagination?.hasMore && !invoiceLoading && (
              <button
                onClick={loadMoreInvoices}
                className="w-full py-4 bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-[2rem] text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all"
              >
                Load More Transactions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[450px] border-l border-slate-900 bg-slate-950/80 backdrop-blur-2xl p-8 overflow-y-auto custom-scrollbar z-20"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Invoice Details</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-slate-900 rounded-xl text-slate-500 hover:text-white transition-all"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Status Card */}
              <div className={`p-6 rounded-[2rem] border ${statusConfig[selectedInvoice.status?.toLowerCase()]?.bg || 'bg-slate-900'} ${statusConfig[selectedInvoice.status?.toLowerCase()]?.color || 'text-slate-500'} border-current/10`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    {React.createElement(statusConfig[selectedInvoice.status?.toLowerCase()]?.icon || DocumentTextIcon, { className: 'w-6 h-6' })}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Status</p>
                    <p className="text-xl font-black uppercase tracking-tight">{selectedInvoice.status || 'DRAFT'}</p>
                  </div>
                </div>
                <div className="h-px bg-current/10 my-4" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Amount Paid</p>
                    <p className="text-2xl font-black tracking-tight text-white">
                      {formatCurrency(selectedInvoice.amountPaid, selectedInvoice.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Date</p>
                    <p className="text-sm font-bold text-white">
                      {selectedInvoice.created ? new Date(selectedInvoice.created).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Customer Information</h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800 rounded-2xl text-slate-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</p>
                      <p className="text-sm font-bold text-white">{selectedInvoice.customerName || 'Anonymous'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800 rounded-2xl text-slate-400">
                      <EnvelopeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-bold text-white">{selectedInvoice.customerEmail || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Billing Context</h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Billing Reason</p>
                    <p className="text-sm font-bold text-white">{selectedInvoice.billingReason || 'Subscription Cycle'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoice ID</p>
                    <p className="text-[10px] font-mono text-slate-400 break-all">{selectedInvoice.id}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 gap-3 pt-4">
                {selectedInvoice.hostedInvoiceUrl && (
                  <a
                    href={selectedInvoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 py-4 bg-teal-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    View Stripe Receipt
                  </a>
                )}
                {selectedInvoice.pdfUrl && (
                  <a
                    href={selectedInvoice.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
