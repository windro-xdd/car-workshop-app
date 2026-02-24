import React, { useState } from 'react';
import { Invoice, Item, LineItem } from '../../types';

interface AmendmentFormProps {
  originalInvoice: Invoice;
  items: Item[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

interface AmendmentLineItem extends LineItem {
  isOriginal: boolean;
  markedForRemoval: boolean;
}

export const AmendmentForm: React.FC<AmendmentFormProps> = ({
  originalInvoice,
  items,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [customerName, setCustomerName] = useState(originalInvoice.customerName);
  const [customerPhone, setCustomerPhone] = useState(originalInvoice.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(originalInvoice.customerEmail || '');
  const [notes, setNotes] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Initialize with original line items
  const [amendmentLineItems, setAmendmentLineItems] = useState<AmendmentLineItem[]>(
    () =>
      (originalInvoice.lineItems || []).map((line) => ({
        ...line,
        isOriginal: true,
        markedForRemoval: false,
      })),
  );

  const handleAddItem = () => {
    if (!selectedItemId) {
      alert('Please select an item');
      return;
    }

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    const lineTotal = quantity * item.unitPrice;
    const newLineItem: AmendmentLineItem = {
      id: `temp_${Date.now()}`,
      invoiceId: '',
      itemId: selectedItemId,
      quantity,
      unitPrice: item.unitPrice,
      lineTotal,
      isOriginal: false,
      markedForRemoval: false,
    };

    setAmendmentLineItems([...amendmentLineItems, newLineItem]);
    setSelectedItemId('');
    setQuantity(1);
  };

  const handleToggleRemoval = (index: number) => {
    setAmendmentLineItems((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        if (line.isOriginal) {
          return { ...line, markedForRemoval: !line.markedForRemoval };
        }
        return line;
      }),
    );
  };

  const handleDeleteNew = (index: number) => {
    setAmendmentLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const activeItems = amendmentLineItems.filter((line) => !line.markedForRemoval);
  const removedItems = amendmentLineItems.filter((line) => line.markedForRemoval);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeItems.length === 0) {
      alert('Amendment must have at least one line item');
      return;
    }

    try {
      await onSubmit({
        originalInvoiceId: originalInvoice.id,
        customerName,
        customerPhone,
        customerEmail,
        lineItems: activeItems.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        })),
        gstPercentage: originalInvoice.gstPercentage,
        notes,
      });
    } catch (err) {
      console.error('Error submitting amendment:', err);
    }
  };

  const amendmentTotal = activeItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const gstAmount = Number((amendmentTotal * (originalInvoice.gstPercentage / 100)).toFixed(2));
  const netTotal = Number((amendmentTotal + gstAmount).toFixed(2));

  const originalTotal = (originalInvoice.lineItems || []).reduce(
    (sum, line) => sum + line.lineTotal,
    0,
  );
  const difference = amendmentTotal - originalTotal;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Phone</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Email</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Original Invoice</label>
          <input
            type="text"
            value={originalInvoice.invoiceNumber}
            disabled
            className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-100 text-zinc-600"
          />
        </div>
      </div>

      {/* Current Line Items (from original invoice) */}
      <div className="bg-zinc-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Line Items</h3>

        {amendmentLineItems.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-300 bg-white">
                  <th className="text-left py-2 px-2">Item</th>
                  <th className="text-center py-2 px-2">Qty</th>
                  <th className="text-right py-2 px-2">Rate</th>
                  <th className="text-right py-2 px-2">Amount</th>
                  <th className="text-center py-2 px-2 w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {amendmentLineItems.map((line, index) => {
                  const item = items.find((i) => i.id === line.itemId);
                  return (
                    <tr
                      key={line.id}
                      className={`border-b border-zinc-200 transition-colors ${
                        line.markedForRemoval
                          ? 'bg-red-50 opacity-60'
                          : line.isOriginal
                            ? 'bg-white'
                            : 'bg-green-50'
                      }`}
                    >
                      <td className={`py-2 px-2 ${line.markedForRemoval ? 'line-through text-zinc-400' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          {line.isOriginal && !line.markedForRemoval && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0"></span>
                          )}
                          {!line.isOriginal && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                          )}
                          {line.markedForRemoval && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                          )}
                          {item?.name}
                        </div>
                      </td>
                      <td className={`text-center py-2 px-2 ${line.markedForRemoval ? 'line-through text-zinc-400' : ''}`}>
                        {line.quantity}
                      </td>
                      <td className={`text-right py-2 px-2 ${line.markedForRemoval ? 'line-through text-zinc-400' : ''}`}>
                        {line.unitPrice.toFixed(2)}
                      </td>
                      <td className={`text-right py-2 px-2 ${line.markedForRemoval ? 'line-through text-zinc-400' : ''}`}>
                        {line.lineTotal.toFixed(2)}
                      </td>
                      <td className="text-center py-2 px-2">
                        {line.isOriginal ? (
                          <button
                            type="button"
                            onClick={() => handleToggleRemoval(index)}
                            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                              line.markedForRemoval
                                ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                : 'text-red-700 bg-red-100 hover:bg-red-200'
                            }`}
                          >
                            {line.markedForRemoval ? 'Restore' : 'Remove'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteNew(index)}
                            className="text-xs font-medium px-2 py-1 rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new item */}
        <div className="border-t border-zinc-200 pt-4">
          <p className="text-xs font-medium text-zinc-500 mb-2">Add new item</p>
          <div className="space-y-3">
            <div>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value="">Choose an item...</option>
                {items
                  .filter((item) => item.isActive)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.unitPrice.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-800 transition font-medium"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        {activeItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Subtotal:</span>
              <span className="font-medium">{amendmentTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">GST ({originalInvoice.gstPercentage}%):</span>
              <span className="font-medium">{gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-zinc-300">
              <span className="font-semibold text-zinc-900">Total:</span>
              <span className="font-bold text-base">{netTotal.toFixed(2)}</span>
            </div>
            {difference !== 0 && (
              <div className="flex justify-between pt-1">
                <span className="text-zinc-500 text-xs">Difference from original:</span>
                <span
                  className={`text-xs font-medium ${
                    difference > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {difference > 0 ? '+' : ''}
                  {difference.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {removedItems.length > 0 && (
          <p className="mt-2 text-xs text-red-600">
            {removedItems.length} item{removedItems.length > 1 ? 's' : ''} will be removed in this amendment
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Reason for amendment..."
          className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          disabled={isLoading || activeItems.length === 0}
          className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition font-semibold text-sm"
        >
          {isLoading ? 'Creating Amendment...' : 'Create Amendment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 transition font-semibold text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
