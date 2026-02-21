import React from 'react';
import { LineItem, Item } from '../../types';
import { calculateGST, calculateNetTotal, formatCurrency } from '../utils/invoiceUtils';

interface InvoiceSummaryProps {
  customerName: string;
  lineItems: LineItem[];
  items: Item[];
  gstPercentage: number;
  onRemoveLineItem: (itemId: string) => void;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  customerName,
  lineItems,
  items,
  gstPercentage,
  onRemoveLineItem,
}) => {
  const grossTotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const gstAmount = calculateGST(grossTotal, gstPercentage);
  const netTotal = calculateNetTotal(grossTotal, gstPercentage);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Invoice Summary</h2>

      {!customerName && (
        <div className="text-yellow-600 bg-yellow-50 p-3 rounded mb-4">
          Please enter customer name to proceed
        </div>
      )}

      {lineItems.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No items added yet</div>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-2 px-3">Item</th>
                  <th className="text-right py-2 px-3">Qty</th>
                  <th className="text-right py-2 px-3">Unit Price</th>
                  <th className="text-right py-2 px-3">Line Total</th>
                  <th className="text-center py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, idx) => {
                  const item = items.find((i) => i.id === line.itemId);
                  return (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-3 px-3">{item?.name || 'Unknown'}</td>
                      <td className="text-right py-3 px-3">{line.quantity}</td>
                      <td className="text-right py-3 px-3">₹{line.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-3 font-semibold">
                        ₹{line.lineTotal.toFixed(2)}
                      </td>
                      <td className="text-center py-3 px-3">
                        <button
                          onClick={() => onRemoveLineItem(line.itemId)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-4 rounded space-y-2">
            <div className="flex justify-between">
              <span>Subtotal (Gross):</span>
              <span className="font-semibold">{formatCurrency(grossTotal)}</span>
            </div>
            <div className="flex justify-between text-orange-600">
              <span>GST ({gstPercentage}%):</span>
              <span className="font-semibold">{formatCurrency(gstAmount)}</span>
            </div>
            <div className="border-t-2 border-gray-300 pt-2 flex justify-between text-lg">
              <span className="font-bold">Net Total:</span>
              <span className="font-bold">{formatCurrency(netTotal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
