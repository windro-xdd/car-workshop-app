import React from 'react';
import { Invoice } from '../../types';
import { formatDate, formatCurrency } from '../utils/invoiceUtils';

interface InvoiceTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onDownloadPDF?: (invoiceId: string) => Promise<void>;
  onCreateAmendment?: (invoiceId: string) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onDownloadPDF,
  onCreateAmendment,
}) => {
  if (invoices.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        No invoices yet. Create your first invoice above.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Invoice History</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-50">
            <th className="text-left py-3 px-4">Invoice #</th>
            <th className="text-left py-3 px-4">Customer</th>
            <th className="text-right py-3 px-4">Amount</th>
            <th className="text-right py-3 px-4">GST</th>
            <th className="text-right py-3 px-4">Total</th>
            <th className="text-center py-3 px-4">Date</th>
            <th className="text-center py-3 px-4">Status</th>
            <th className="text-center py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">{invoice.invoiceNumber}</td>
              <td className="py-3 px-4">{invoice.customerName}</td>
              <td className="text-right py-3 px-4">{formatCurrency(invoice.grossAmount)}</td>
              <td className="text-right py-3 px-4 text-orange-600">
                {formatCurrency(invoice.gstAmount)}
              </td>
              <td className="text-right py-3 px-4 font-semibold">
                {formatCurrency(invoice.netTotal)}
              </td>
              <td className="text-center py-3 px-4 text-sm">
                {formatDate(invoice.invoiceDate)}
              </td>
              <td className="text-center py-3 px-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    invoice.status === 'Final'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'Draft'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {invoice.status}
                </span>
              </td>
              <td className="text-center py-3 px-4 space-x-2">
                <button
                  onClick={() => onSelectInvoice(invoice)}
                  className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition text-sm"
                >
                  View
                </button>
                {onDownloadPDF && (
                  <button
                    onClick={() => onDownloadPDF(invoice.id)}
                    className="px-2 py-1 text-green-600 hover:bg-green-50 rounded transition text-sm"
                    title="Download PDF"
                  >
                    PDF
                  </button>
                )}
                {onCreateAmendment && !invoice.isAmendment && (
                  <button
                    onClick={() => onCreateAmendment(invoice.id)}
                    className="px-2 py-1 text-purple-600 hover:bg-purple-50 rounded transition text-sm"
                    title="Create amendment for this invoice"
                  >
                    Amend
                  </button>
                )}
                <button
                  onClick={() => onDeleteInvoice(invoice.id)}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
