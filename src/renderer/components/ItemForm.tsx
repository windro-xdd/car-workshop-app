import React, { useState } from 'react';
import { Item, CreateItemInput } from '@/types';
import { useToast } from './ToastProvider';

interface ItemFormProps {
  onSubmit: (data: CreateItemInput) => void;
  isLoading?: boolean;
}

export const ItemForm: React.FC<ItemFormProps> = ({ onSubmit, isLoading = false }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CreateItemInput>({
    code: '',
    name: '',
    category: '',
    unitPrice: 0,
  });
  const [errors, setErrors] = useState<Partial<CreateItemInput>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'unitPrice' ? parseFloat(value) || 0 : value,
    }));
    // Clear error for this field when user starts typing
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateItemInput> = {};
    if (!formData.code?.trim()) newErrors.code = 'Item Code is required' as any;
    if (!formData.name?.trim()) newErrors.name = 'Item Name is required' as any;
    if (!formData.category?.trim()) newErrors.category = 'Category is required' as any;
    if (!formData.unitPrice || formData.unitPrice <= 0) newErrors.unitPrice = 'Unit Price must be greater than 0' as any;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the errors below', 'error', 4000);
      return;
    }
    onSubmit(formData);
    setFormData({ code: '', name: '', category: '', unitPrice: 0 });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Add New Item</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-2">
            Item Code <span className="text-red-600">*</span>
          </label>
          <input
            id="code"
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., OIL-001"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'code-error' : undefined}
            required
          />
          {errors.code && (
            <p id="code-error" className="text-red-600 text-xs mt-1">{String(errors.code)}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Item Name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Engine Oil 5L"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            required
          />
          {errors.name && (
            <p id="name-error" className="text-red-600 text-xs mt-1">{String(errors.name)}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
            required
          >
            <option value="">Select Category</option>
            <option value="Oil">Oil & Fluids</option>
            <option value="Parts">Auto Parts</option>
            <option value="Service">Service</option>
            <option value="Accessories">Accessories</option>
          </select>
          {errors.category && (
            <p id="category-error" className="text-red-600 text-xs mt-1">{String(errors.category)}</p>
          )}
        </div>

        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium mb-2">
            Unit Price (₹) <span className="text-red-600">*</span>
          </label>
          <input
            id="unitPrice"
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.unitPrice ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.unitPrice}
            aria-describedby={errors.unitPrice ? 'unitPrice-error' : undefined}
            required
          />
          {errors.unitPrice && (
            <p id="unitPrice-error" className="text-red-600 text-xs mt-1">{String(errors.unitPrice)}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? '⏳ Adding...' : 'Add Item'}
      </button>
    </form>
  );
};
