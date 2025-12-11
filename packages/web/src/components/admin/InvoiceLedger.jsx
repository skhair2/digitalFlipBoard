import React, { useEffect, useMemo } from 'react';
import Spinner from '../ui/Spinner';
import { useAdminStore } from '../../store/adminStore';

const statusStyles = {
  paid: 'bg-emerald-500/20 text-emerald-300',
  open: 'bg-amber-500/20 text-amber-200',
  void: 'bg-red-500/20 text-red-300',
  uncollectible: 'bg-red-500/20 text-red-300',
  draft: 'bg-slate-500/20 text-slate-200'
};

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number') return '—';
  const dollars = (amount / 100).toFixed(2);
  return `${currency?.toUpperCase() ?? 'USD'} $${dollars}`;
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
  } = useAdminStore();

  useEffect(() => {
    loadInvoiceLedger();
  }, [loadInvoiceLedger]);

  const stats = useMemo(() => [
    {
      label: 'Free customers',
      value: invoiceSummary?.totalFreeCustomers ?? 0,
      helper: 'Standard tier'
    },
    {
      label: 'Paying customers',
      value: invoiceSummary?.totalPayingCustomers ?? 0,
      helper: 'Pro / Premium'
    },
    {
      label: 'Anonymous visitors',
      value: invoiceSummary?.totalAnonymousUsers ?? 0,
      helper: 'No account yet'
    }
  ], [invoiceSummary]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    loadInvoiceLedger({ emailFilter: invoiceFilterEmail });
  };

  const handleClearFilter = () => {
    setInvoiceFilterEmail('');
    loadInvoiceLedger({ emailFilter: '' });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Invoice Ledger</h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Review every payment, filter by customer email, and keep an eye on free, anonymous, and paying counts.
              Use the hosted invoice links to drill straight into Stripe receipts when you need to share or audit a charge.
            </p>
          </div>
          <div className="text-xs uppercase tracking-wider text-gray-500">
            {invoicePagination?.hasMore ? 'Streaming live data' : 'Last page delivered'}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.helper}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <form className="flex flex-col gap-3 md:flex-row md:items-end" onSubmit={handleFilterSubmit}>
            <div className="flex-1">
              <label className="text-sm text-gray-400">Filter by email</label>
              <input
                type="text"
                value={invoiceFilterEmail}
                onChange={(event) => setInvoiceFilterEmail(event.target.value)}
                placeholder="support@flipdisplay.online"
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Apply filter
              </button>
              <button
                type="button"
                onClick={handleClearFilter}
                className="px-4 py-2 border border-gray-700 text-gray-200 rounded-lg text-sm hover:border-gray-500"
              >
                Clear
              </button>
            </div>
          </form>

          {invoiceError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {invoiceError}
            </div>
          )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800 text-left text-sm">
                <thead>
                  <tr className="text-gray-400">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Customer</th>
                    <th className="px-3 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                    <th className="px-3 py-3 font-semibold">Billing</th>
                    <th className="px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoiceRows.map((invoice) => {
                    const statusKey = invoice.status?.toLowerCase() || 'draft';
                    const pillClass = statusStyles[statusKey] || 'bg-slate-700 text-slate-200';

                    return (
                      <tr key={invoice.id} className="hover:bg-gray-900/40">
                        <td className="px-3 py-3 text-gray-300">
                          {invoice.created
                            ? new Date(invoice.created).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-white">{invoice.customerName || '—'}</td>
                        <td className="px-3 py-3 text-gray-300">{invoice.customerEmail || 'anonymous'}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${pillClass}`}>
                            {invoice.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-100">{formatCurrency(invoice.amountPaid, invoice.currency)}</td>
                        <td className="px-3 py-3 text-gray-400">{invoice.billingReason || 'Subscription'}</td>
                        <td className="px-3 py-3 space-x-2">
                          {invoice.hostedInvoiceUrl && (
                            <a
                              href={invoice.hostedInvoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-indigo-400 hover:text-indigo-300"
                            >
                              View receipt
                            </a>
                          )}
                          {invoice.pdfUrl && (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-gray-400 hover:text-white"
                            >
                              PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            {invoiceLoading && invoiceRows.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            )}

            {!invoiceLoading && invoiceRows.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-6">
                No invoices found. Try a broader filter or check back in a moment.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={loadMoreInvoices}
              disabled={!invoicePagination?.hasMore || invoiceLoading}
              className="px-5 py-2 border border-indigo-500 text-indigo-200 rounded-lg text-sm font-semibold disabled:cursor-not-allowed disabled:border-gray-600 disabled:text-gray-600"
            >
              {invoiceLoading ? 'Loading…' : invoicePagination?.hasMore ? 'Load more invoices' : 'All invoices loaded'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
