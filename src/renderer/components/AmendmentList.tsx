import React from 'react';
import { Invoice } from '../../types';

interface AmendmentListProps {
  amendments: Invoice[];
  items: any[];
  onViewAmendment: (invoice: Invoice) => void;
}

export const AmendmentList: React.FC<AmendmentListProps> = ({ amendments, items, onViewAmendment }) => {
  if (amendments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        No amendments for this invoice.
      </div>
    );
  }

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Amendment History</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-50">
            <th className="text-left py-3 px-4">Amendment #</th>
            <th className="text-center py-3 px-4">Date</th>
            <th className="text-right py-3 px-4">Subtotal</th>
            <th className="text-right py-3 px-4">GST</th>
            <th className="text-right py-3 px-4">Total</th>
            <th className="text-center py-3 px-4">Status</th>
            <th className="text-center py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {amendments.map((amendment) => (
            <tr key={amendment.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">{amendment.invoiceNumber}</td>
              <td className="text-center py-3 px-4 text-sm">{formatDate(amendment.invoiceDate)}</td>
              <td className="text-right py-3 px-4">{formatCurrency(amendment.grossAmount)}</td>
              <td className="text-right py-3 px-4 text-orange-700">{formatCurrency(amendment.gstAmount)}</td>
              <td className="text-right py-3 px-4 font-semibold">{formatCurrency(amendment.netTotal)}</td>
              <td className="text-center py-3 px-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    amendment.status === 'Final'
                      ? 'bg-green-100 text-green-800'
                      : amendment.status === 'Draft'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {amendment.status}
                </span>
              </td>
              <td className="text-center py-3 px-4">
               <button
                   onClick={() => onViewAmendment(amendment)}
                   className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition text-sm"
                   aria-label={`View amendment for invoice #${amendment.invoiceNumber}`}
                 >
                   View
                 </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {amendments.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200 text-sm text-gray-600">
          <p>
            <strong>Total Amendments:</strong> {amendments.length}
          </p>
        </div>
      )}
    </div>
  );
};
