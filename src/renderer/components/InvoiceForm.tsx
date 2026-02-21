import React, { useState } from 'react';
import { Item, CreateItemInput } from '../../types';
import { useToast } from './ToastProvider';
import { SearchableSelect } from './SearchableSelect';
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
  const { showToast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [errors, setErrors] = useState<{ customerName?: string; quantity?: string }>({});

  const handleCustomerChange = () => {
    onCustomerInfoChange({
      customerName,
      customerPhone,
      customerEmail,
    });
  };

  const handleAddLineItem = () => {
    const newErrors: typeof errors = {};
    if (!customerName.trim()) {
      newErrors.customerName = 'Customer Name is required';
    }
    if (!selectedItemId) {
      showToast('Please select an item', 'error', 4000);
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fix the errors above', 'error', 4000);
      return;
    }

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    onLineItemAdd(selectedItemId, parseInt(quantity), item.unitPrice);
    setSelectedItemId('');
    setQuantity('1');
    showToast('Item added to invoice', 'success', 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium mb-2">
              Customer Name <span className="text-red-600">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setErrors((prev) => ({ ...prev, customerName: undefined }));
                handleCustomerChange();
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerName ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.customerName}
              aria-describedby={errors.customerName ? 'customerName-error' : undefined}
            />
            {errors.customerName && (
              <p id="customerName-error" className="text-red-600 text-xs mt-1">{errors.customerName}</p>
            )}
          </div>
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              id="customerPhone"
              type="tel"
              placeholder="e.g., +91 98765 43210"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                handleCustomerChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="customerEmail"
              type="email"
              placeholder="e.g., customer@example.com"
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                handleCustomerChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add Items</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="itemSelect" className="block text-sm font-medium mb-2">
                Select Item <span className="text-red-600">*</span>
              </label>
              <SearchableSelect
                items={items}
                selectedItemId={selectedItemId}
                onSelect={setSelectedItemId}
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                Quantity <span className="text-red-600">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrors((prev) => ({ ...prev, quantity: undefined }));
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-invalid={!!errors.quantity}
                aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              />
              {errors.quantity && (
                <p id="quantity-error" className="text-red-600 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddLineItem}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
              >
                Add Item
              </button>
            </div>
          </div>

          {selectedItemId && (
            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded border border-blue-200">
              <p>
                <strong>Category:</strong>{' '}
                {items.find((i) => i.id === selectedItemId)?.category || 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>Current GST Rate:</strong> <span className="font-semibold">{gstPercentage}%</span>
        </p>
      </div>
    </div>
  );
};
