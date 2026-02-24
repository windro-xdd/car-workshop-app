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
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-zinc-200">
      <div className="border-b border-zinc-100 pb-4 mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Invoice Summary</h2>
      </div>

      {!customerName && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg shadow-sm text-sm flex items-start animate-in fade-in duration-200">
          <svg className="w-5 h-5 mr-2 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span className="leading-tight">Please enter customer name to proceed with invoice generation.</span>
        </div>
      )}

      {lineItems.length === 0 ? (
        <div className="text-zinc-500 text-center py-10 border border-zinc-200 border-dashed rounded-xl bg-zinc-50/50 text-sm">
          No items added yet. Add items from the list to begin.
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="overflow-x-auto mb-6 rounded-xl border border-zinc-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Qty</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lineItems.map((line, idx) => {
                  const item = items.find((i) => i.id === line.itemId);
                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors duration-150 ease-in-out">
                      <td className="px-4 py-3 text-sm text-zinc-900 font-medium max-w-[180px]" title={item?.name}>
                        <div className="truncate">{item?.name || 'Unknown'}</div>
                        {line.remarks && (
                          <div className="text-xs text-zinc-500 font-normal truncate mt-0.5" title={line.remarks}>{line.remarks}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 text-right">{line.quantity}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 text-right">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-900 font-semibold text-right">{formatCurrency(line.lineTotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onRemoveLineItem(line.itemId)}
                          className="inline-flex items-center justify-center w-6 h-6 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-150"
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-50/80 p-5 rounded-xl border border-zinc-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 font-medium">Subtotal (Gross)</span>
              <span className="text-zinc-900 font-semibold">{formatCurrency(grossTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 font-medium flex items-center">
                GST 
                <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded text-xs font-medium bg-brand-100 text-brand-800 border border-brand-200">
                  {gstPercentage}%
                </span>
              </span>
              <span className="text-zinc-900 font-semibold">{formatCurrency(gstAmount)}</span>
            </div>
            <div className="border-t border-zinc-200/80 pt-3 mt-3 flex justify-between items-center">
              <span className="text-base font-bold text-zinc-900 tracking-tight">Net Total</span>
              <span className="text-lg font-bold text-brand-700 tracking-tight">{formatCurrency(netTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
