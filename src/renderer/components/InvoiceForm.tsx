import React, { useState } from 'react';
import { Item, CreateItemInput } from '../../types';
import { calculateLineTotal, calculateGST, calculateNetTotal } from '../utils/invoiceUtils';

interface InvoiceFormProps {
  items: Item[];
  gstPercentage: number;
  onLineItemAdd: (itemId: string, quantity: number, unitPrice: number) => void;
  onCustomerInfoChange: (info: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
  }) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  items,
  gstPercentage,
  onLineItemAdd,
  onCustomerInfoChange,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleCustomerChange = () => {
    onCustomerInfoChange({
      customerName,
      customerPhone,
      customerEmail,
    });
  };

  const handleAddLineItem = () => {
    if (!selectedItemId || !quantity) {
      alert('Please select an item and enter quantity');
      return;
    }

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    onLineItemAdd(selectedItemId, parseInt(quantity), item.unitPrice);
    setSelectedItemId('');
    setQuantity('1');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 gap-4">
          <input
            type="text"
            placeholder="Customer Name *"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              handleCustomerChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              handleCustomerChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={customerEmail}
            onChange={(e) => {
              setCustomerEmail(e.target.value);
              handleCustomerChange();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add Items</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (₹{item.unitPrice.toFixed(2)})
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleAddLineItem}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
            >
              Add Item
            </button>
          </div>

          {selectedItemId && (
            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded">
              {items.find((i) => i.id === selectedItemId)?.category && (
                <p>Category: {items.find((i) => i.id === selectedItemId)?.category}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Current GST Rate:</strong> {gstPercentage}%
        </p>
      </div>
    </div>
  );
};
