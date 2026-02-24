import React, { useState, useEffect, useCallback } from 'react';
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
    vehicleNumber?: string;
    vehicleModel?: string;
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
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [errors, setErrors] = useState<{ customerName?: string; quantity?: string }>({});

  // Propagate customer info changes to parent using useEffect to avoid stale state
  useEffect(() => {
    onCustomerInfoChange({
      customerName,
      customerPhone,
      customerEmail,
      vehicleNumber,
      vehicleModel,
    });
  }, [customerName, customerPhone, customerEmail, vehicleNumber, vehicleModel]);

  // When an item is selected, populate the unit price from the item's stored rate
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find((i) => i.id === selectedItemId);
      if (item) {
        setUnitPrice(item.unitPrice.toFixed(2));
      }
    } else {
      setUnitPrice('');
    }
  }, [selectedItemId, items]);

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

    const parsedPrice = parseFloat(unitPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      showToast('Please enter a valid unit price', 'error', 4000);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fix the errors above', 'error', 4000);
      return;
    }

    onLineItemAdd(selectedItemId, parseInt(quantity), parsedPrice);
    setSelectedItemId('');
    setQuantity('1');
    setUnitPrice('');
    showToast('Item added to invoice', 'success', 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-zinc-200">
        <div className="border-b border-zinc-100 pb-4 mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Customer & Vehicle Details</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="customerName" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              placeholder="e.g., Rajesh Kumar"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setErrors((prev) => ({ ...prev, customerName: undefined }));
              }}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ${
                errors.customerName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-200 focus:border-brand-500'
              }`}
              aria-invalid={!!errors.customerName}
              aria-describedby={errors.customerName ? 'customerName-error' : undefined}
            />
            {errors.customerName && (
              <p id="customerName-error" className="text-red-500 text-xs mt-1.5 font-medium">{errors.customerName}</p>
            )}
          </div>
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Phone Number
            </label>
            <input
              id="customerPhone"
              type="tel"
              placeholder="e.g., +91 98765 43210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Email
            </label>
            <input
              id="customerEmail"
              type="email"
              placeholder="e.g., rajesh@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Vehicle No.
            </label>
            <input
              id="vehicleNumber"
              type="text"
              placeholder="e.g., KL-10-AB-1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="vehicleModel" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Vehicle Model
            </label>
            <input
              id="vehicleModel"
              type="text"
              placeholder="e.g., Maruti Swift"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-zinc-200">
        <div className="border-b border-zinc-100 pb-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">Add Line Items</h2>
          </div>
          <div className="bg-brand-50 px-3 py-1 rounded-full border border-brand-100 flex items-center">
            <span className="w-2 h-2 rounded-full bg-brand-500 mr-2"></span>
            <p className="text-xs text-brand-700 font-medium">GST Rate: {gstPercentage}%</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label htmlFor="itemSelect" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Select Item <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                items={items}
                selectedItemId={selectedItemId}
                onSelect={setSelectedItemId}
              />
            </div>

            <div className="w-full sm:w-32">
              <label htmlFor="quantity" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Qty <span className="text-red-500">*</span>
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
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ${
                  errors.quantity ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-200 focus:border-brand-500'
                }`}
                aria-invalid={!!errors.quantity}
                aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              />
            </div>

            <div className="w-full sm:w-36">
              <label htmlFor="unitPrice" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Rate (₹)
              </label>
              <input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
              />
            </div>

            <button
              onClick={handleAddLineItem}
              className="w-full sm:w-auto px-5 py-2 h-[38px] bg-zinc-900 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-zinc-800 transition-all duration-200 ease-out whitespace-nowrap"
            >
              Add Item
            </button>
          </div>

          {errors.quantity && (
            <p id="quantity-error" className="text-red-500 text-xs font-medium mt-1">{errors.quantity}</p>
          )}

          {selectedItemId && (
            <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center text-sm animate-in fade-in duration-200">
              <span className="text-zinc-500 mr-2">Category:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-200 text-zinc-800">
                {items.find((i) => i.id === selectedItemId)?.category || 'N/A'}
              </span>
              <span className="text-zinc-400 mx-3">|</span>
              <span className="text-zinc-500 mr-2">Stored Rate:</span>
              <span className="text-zinc-800 font-medium">
                ₹{items.find((i) => i.id === selectedItemId)?.unitPrice.toFixed(2) || '0.00'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
