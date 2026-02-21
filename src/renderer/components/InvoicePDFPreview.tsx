import React, { useState } from 'react';
import { Invoice, Item } from '../../types';

interface InvoicePDFPreviewProps {
  invoice: Invoice;
  items: Item[];
  onClose: () => void;
}

export const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = ({
  invoice,
  items,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await window.electronAPI.saveInvoicePDF(invoice.id);
      alert(`PDF saved successfully for ${invoice.invoiceNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAndPrint = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await window.electronAPI.printInvoicePDF(invoice.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save and print PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-zinc-200">
        <div className="bg-brand-600 text-white p-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold">Invoice Preview: {invoice.invoiceNumber}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-zinc-200 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-zinc-200 flex justify-center p-6 sm:p-8">
          <div className="bg-white p-10 sm:p-14 shadow-md border border-zinc-300 w-full max-w-[794px] min-h-[1123px] flex flex-col shrink-0">
            <div className="text-left mb-6">
              <h1 className="text-3xl font-bold text-[#000080] tracking-tight mb-1">KRIPA CAR CARE</h1>
              <p className="text-sm italic text-zinc-800 mb-4">Premium Car Workshop Services</p>
              
              <div className="border-t border-zinc-400 pt-3 space-y-1">
                <p className="text-sm text-black">
                  <span className="font-bold">Address:</span> Opposite to old toll booth, Vimangalam, PO Kadaloor, Moodadi
                </p>
                <p className="text-sm text-black">
                  <span className="font-bold">Phone:</span> 9745286370 | 9745286377 | 9995102092
                </p>
                <p className="text-sm text-black">
                  <span className="font-bold">Email:</span> kripacarcare@gmail.com
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6 mt-8">
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
                <tr className="border-b-2 border-zinc-400">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems && invoice.lineItems.length > 0 ? (
                  invoice.lineItems.map((lineItem: any) => {
                    const item = items.find(i => i.id === lineItem.itemId);
                    const itemName = item?.name || 'Unknown Item';
                    return (
                      <tr key={lineItem.id} className="border-b border-zinc-200">
                        <td className="py-2">{itemName}</td>
                        <td className="text-center py-2">{lineItem.quantity}</td>
                        <td className="text-right py-2">₹{lineItem.unitPrice.toFixed(2)}</td>
                        <td className="text-right py-2">₹{lineItem.lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-zinc-500">
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex-1"></div>

            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>₹{invoice.grossAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span>GST ({invoice.gstPercentage}%):</span>
                  <span>₹{invoice.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 border-zinc-400 pt-2">
                  <span>TOTAL:</span>
                  <span>₹{invoice.netTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-500">
              Thank you for your business!
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-zinc-100 p-4 flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition"
          >
            {isProcessing ? 'Processing...' : 'Save'}
          </button>
          <button
            onClick={handleSaveAndPrint}
            disabled={isProcessing}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition"
          >
            {isProcessing ? 'Processing...' : 'Save & Print'}
          </button>
        </div>
      </div>
    </div>
  );
};
