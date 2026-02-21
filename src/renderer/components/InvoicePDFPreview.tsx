import React, { useState } from 'react';
import { Invoice } from '../../types';

interface InvoicePDFPreviewProps {
  invoice: Invoice;
  onClose: () => void;
  onDownload: (invoiceId: string) => Promise<void>;
}

export const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = ({
  invoice,
  onClose,
  onDownload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await onDownload(invoice.id);
      alert(`PDF saved successfully for ${invoice.invoiceNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-96 overflow-hidden flex flex-col">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Invoice Preview: {invoice.invoiceNumber}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white p-6 rounded border border-gray-300">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">🚗 Kripa Car Care Workshop</h1>
              <p className="text-sm text-gray-600">Your Workshop Address, City, State 000000</p>
              <p className="text-sm text-gray-600">Phone: +91-XXXXXXXXXX | Email: info@kripacars.com</p>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="font-bold text-sm mb-2">INVOICE DETAILS</h3>
                <p className="text-sm">
                  <strong>Invoice #:</strong> {invoice.invoiceNumber}
                </p>
                <p className="text-sm">
                  <strong>Date:</strong>{' '}
                  {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong> {invoice.status}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-2">BILL TO</h3>
                <p className="text-sm">
                  <strong>{invoice.customerName}</strong>
                </p>
                {invoice.customerPhone && <p className="text-sm">Phone: {invoice.customerPhone}</p>}
                {invoice.customerEmail && <p className="text-sm">Email: {invoice.customerEmail}</p>}
              </div>
            </div>

            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="border-b-2 border-gray-400">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems && invoice.lineItems.length > 0 ? (
                  invoice.lineItems.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-2">Item #{item.itemId}</td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-2">₹{item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end mb-6">
              <div className="w-64">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>₹{invoice.grossAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span>GST ({invoice.gstPercentage}%):</span>
                  <span>₹{invoice.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 border-gray-400 pt-2">
                  <span>TOTAL:</span>
                  <span>₹{invoice.netTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500">
              Thank you for your business!
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-gray-100 p-4 flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isDownloading ? 'Downloading...' : '⬇ Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
