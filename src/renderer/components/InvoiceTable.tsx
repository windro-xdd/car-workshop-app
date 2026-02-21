import React from 'react';
import { Invoice } from '../../types';
import { useModal } from './ModalProvider';
import { useToast } from './ToastProvider';
import { formatDate, formatCurrency } from '../utils/invoiceUtils';

interface InvoiceTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onCreateAmendment?: (invoiceId: string) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onCreateAmendment,
}) => {
  const { openModal } = useModal();
  const { showToast } = useToast();

  const handleDeleteClick = async (invoice: Invoice) => {
    const confirmed = await openModal(
      'Delete Invoice',
      `Are you sure you want to delete invoice #${invoice.invoiceNumber}? This action cannot be undone.`,
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDangerous: true,
      }
    );
    if (confirmed) {
      onDeleteInvoice(invoice.id);
      showToast(`Invoice #${invoice.invoiceNumber} deleted`, 'success', 4000);
    }
  };
  
  if (invoices.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-zinc-200 text-center flex flex-col items-center">
        <svg className="w-12 h-12 text-zinc-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <p className="text-zinc-600 font-medium text-lg">No invoices yet</p>
        <p className="text-zinc-500 text-sm mt-1">Create your first invoice using the form above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in duration-300">
      <div className="border-b border-zinc-100 p-6 flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight flex items-center">
          <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
          </svg>
          Invoice History
        </h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
          {invoices.length} total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-200">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">GST</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Total</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-zinc-50/50 transition-colors duration-150 ease-in-out bg-white">
                <td className="px-6 py-4 text-sm text-zinc-900 font-mono font-medium">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-zinc-900 font-medium">{invoice.customerName}</td>
                <td className="px-6 py-4 text-sm text-zinc-600 text-right">{formatCurrency(invoice.grossAmount)}</td>
                <td className="px-6 py-4 text-sm text-zinc-600 text-right text-orange-700/80">
                  {formatCurrency(invoice.gstAmount)}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-900 font-semibold text-right">
                  {formatCurrency(invoice.netTotal)}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500 text-center">
                  {formatDate(invoice.invoiceDate)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      invoice.status === 'Final'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : invoice.status === 'Draft'
                          ? 'bg-brand-50 text-brand-700 border-brand-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                 <td className="px-6 py-4 text-right whitespace-nowrap space-x-1.5">
                  <button
                      onClick={() => onSelectInvoice(invoice)}
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-zinc-600 bg-transparent hover:text-brand-600 hover:bg-brand-50 transition-colors duration-150"
                      aria-label={`View invoice #${invoice.invoiceNumber}`}
                    >
                      View
                    </button>
                    {onCreateAmendment && !invoice.isAmendment && (
                      <button
                        onClick={() => onCreateAmendment(invoice.id)}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-zinc-600 bg-transparent hover:text-purple-600 hover:bg-purple-50 transition-colors duration-150"
                        aria-label={`Create amendment for invoice #${invoice.invoiceNumber}`}
                        title="Create amendment for this invoice"
                      >
                        Amend
                      </button>
                    )}
                   <button
                     onClick={() => handleDeleteClick(invoice)}
                     className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-zinc-600 bg-transparent hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                     aria-label={`Delete invoice #${invoice.invoiceNumber}`}
                   >
                     Delete
                   </button>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
