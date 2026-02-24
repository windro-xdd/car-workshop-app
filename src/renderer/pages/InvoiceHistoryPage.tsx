import React, { useEffect, useState } from 'react';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoicePDFPreview } from '../components/InvoicePDFPreview';
import { AmendmentForm } from '../components/AmendmentForm';
import { useInvoiceStore } from '../store/invoiceStore';
import { useItemStore } from '../store/itemStore';
import { useToast } from '../components/ToastProvider';
import { Invoice } from '../../types';

export const InvoiceHistoryPage: React.FC = () => {
  const {
    invoices,
    loading,
    error,
    setInvoices,
    setLoading,
    setError,
  } = useInvoiceStore();

  const { items, setItems } = useItemStore();
  const { showToast } = useToast();

  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState<Invoice | null>(null);
  const [selectedInvoiceForAmendment, setSelectedInvoiceForAmendment] = useState<Invoice | null>(null);

  // Filters
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadItems();
    loadInvoices();
  }, []);

  const loadItems = async () => {
    try {
      const result = await window.electronAPI.getItems();
      if (result.success) {
        setItems(result.data || []);
      }
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getInvoices();
      if (result.success) {
        setInvoices(result.data || []);
        setError(null);
      } else {
        setError(result.error || 'Failed to load invoices');
      }
    } catch (err) {
      setError('Error loading invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.deleteInvoice(id);
      if (result.success) {
        setInvoices((invoices || []).filter((inv) => inv.id !== id));
        setError(null);
        showToast('Invoice deleted successfully', 'success', 4000);
      } else {
        setError(result.error || 'Failed to delete invoice');
        showToast(result.error || 'Failed to delete invoice', 'error', 5000);
      }
    } catch (err) {
      setError('Error deleting invoice');
      showToast('Error deleting invoice', 'error', 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAmendment = async (data: any) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.createAmendment(data);
      if (result.success) {
        const amendment = result.data as Invoice;
        setInvoices([...(invoices || []), amendment]);
        setSelectedInvoiceForAmendment(null);
        showToast(`Amendment created: ${amendment.invoiceNumber}`, 'success', 4000);
      } else {
        showToast(`Error: ${result.error}`, 'error', 5000);
      }
    } catch (err) {
      showToast(`Failed to create amendment`, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredInvoices = (invoices || []).filter((inv) => {
    if (searchCustomer && !inv.customerName.toLowerCase().includes(searchCustomer.toLowerCase())) {
      return false;
    }
    if (searchPhone && !(inv.customerPhone || '').includes(searchPhone)) {
      return false;
    }
    if (searchEmail && !(inv.customerEmail || '').toLowerCase().includes(searchEmail.toLowerCase())) {
      return false;
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      const invDate = new Date(inv.invoiceDate);
      if (invDate < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      const invDate = new Date(inv.invoiceDate);
      if (invDate > to) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setSearchCustomer('');
    setSearchPhone('');
    setSearchEmail('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchCustomer || searchPhone || searchEmail || dateFrom || dateTo;

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Invoice History</h1>
        <p className="text-sm md:text-base text-zinc-500 mt-1">View, search, and manage past invoices</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Filters</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Customer Name</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Phone</label>
            <input
              type="text"
              placeholder="Search by phone..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
            <input
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-zinc-500 mt-3">
            Showing {filteredInvoices.length} of {(invoices || []).length} invoices
          </p>
        )}
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <span className="ml-3 text-zinc-500 text-sm">Loading invoices...</span>
        </div>
      ) : (
        <InvoiceTable
          invoices={filteredInvoices}
          onSelectInvoice={(invoice) => setSelectedInvoiceForPDF(invoice)}
          onDeleteInvoice={handleDeleteInvoice}
          onCreateAmendment={(invoiceId) => {
            const inv = invoices?.find((i) => i.id === invoiceId);
            if (inv) setSelectedInvoiceForAmendment(inv);
          }}
        />
      )}

      {selectedInvoiceForPDF && (
        <InvoicePDFPreview
          invoice={selectedInvoiceForPDF}
          items={items || []}
          onClose={() => setSelectedInvoiceForPDF(null)}
        />
      )}

      {selectedInvoiceForAmendment && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-white border-b border-zinc-100 p-5 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Create Amendment: <span className="font-mono text-zinc-500 text-sm ml-1">{selectedInvoiceForAmendment.invoiceNumber}</span></h2>
              <button
                onClick={() => setSelectedInvoiceForAmendment(null)}
                className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <AmendmentForm
                originalInvoice={selectedInvoiceForAmendment}
                items={items || []}
                onSubmit={handleCreateAmendment}
                onCancel={() => setSelectedInvoiceForAmendment(null)}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
