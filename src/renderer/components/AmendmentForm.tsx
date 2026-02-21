import React, { useState } from 'react';
import { Invoice, Item, LineItem } from '../../types';

interface AmendmentFormProps {
  originalInvoice: Invoice;
  items: Item[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
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
  const [amendmentLineItems, setAmendmentLineItems] = useState<LineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddItem = () => {
    if (!selectedItemId) {
      alert('Please select an item');
      return;
    }

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    const lineTotal = quantity * item.unitPrice;
    const newLineItem: LineItem = {
      id: `temp_${Date.now()}`,
      invoiceId: '',
      itemId: selectedItemId,
      quantity,
      unitPrice: item.unitPrice,
      lineTotal,
    };

    setAmendmentLineItems([...amendmentLineItems, newLineItem]);
    setSelectedItemId('');
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setAmendmentLineItems(amendmentLineItems.filter((line) => line.itemId !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amendmentLineItems.length === 0) {
      alert('Please add at least one item to the amendment');
      return;
    }

    try {
      await onSubmit({
        originalInvoiceId: originalInvoice.id,
        customerName,
        customerPhone,
        customerEmail,
        lineItems: amendmentLineItems,
        gstPercentage: originalInvoice.gstPercentage,
        notes,
      });
    } catch (err) {
      console.error('Error submitting amendment:', err);
    }
  };

  const grossAmount = amendmentLineItems.reduce((sum) => sum + (sum ? 0 : 0), 0);
  const amendmentTotal = amendmentLineItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const gstAmount = Number((amendmentTotal * (originalInvoice.gstPercentage / 100)).toFixed(2));
  const netTotal = Number((amendmentTotal + gstAmount).toFixed(2));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Original Invoice</label>
          <input
            type="text"
            value={originalInvoice.invoiceNumber}
            disabled
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Amendment Items</h3>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Item</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an item...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - ₹{item.unitPrice.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {amendmentLineItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-white">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-center py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {amendmentLineItems.map((line) => {
                  const item = items.find((i) => i.id === line.itemId);
                  return (
                    <tr key={line.id} className="border-b border-gray-200">
                      <td className="py-2">{item?.name}</td>
                      <td className="text-center py-2">{line.quantity}</td>
                      <td className="text-right py-2">₹{line.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-2">₹{line.lineTotal.toFixed(2)}</td>
                      <td className="text-center py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(line.itemId)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end space-x-4 text-sm">
              <div>
                <span className="text-gray-600">Subtotal: </span>
                <span className="font-semibold">₹{amendmentTotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">GST ({originalInvoice.gstPercentage}%): </span>
                <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-l-2 border-gray-300 pl-4">
                <span className="text-gray-600">Total: </span>
                <span className="font-bold text-lg">₹{netTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add amendment notes or reason for changes..."
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading || amendmentLineItems.length === 0}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
        >
          {isLoading ? 'Creating Amendment...' : 'Create Amendment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
