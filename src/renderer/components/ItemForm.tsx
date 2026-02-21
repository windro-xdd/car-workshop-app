import React, { useState, useEffect } from 'react';
import { Item, CreateItemInput } from '@/types';
import { useToast } from './ToastProvider';

interface ItemFormProps {
  onSubmit: (data: CreateItemInput) => void | Promise<void>;
  isLoading?: boolean;
  initialData?: Item;
}

export const ItemForm: React.FC<ItemFormProps> = ({ onSubmit, isLoading = false, initialData }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<CreateItemInput>({
    code: '',
    name: '',
    category: '',
    unitPrice: 0,
  });
  const [errors, setErrors] = useState<Partial<CreateItemInput>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        category: initialData.category,
        unitPrice: initialData.unitPrice,
      });
    }
  }, [initialData]);

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
    if (!initialData) {
      setFormData({ code: '', name: '', category: '', unitPrice: 0 });
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 mb-6">
      <div className="border-b border-zinc-100 pb-4 mb-5">
        <h2 className="text-lg font-semibold text-zinc-900">{initialData ? 'Edit Item' : 'Add New Item'}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Item Code <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., OIL-001"
            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ${
              errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-200 focus:border-brand-500'
            }`}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'code-error' : undefined}
            required
          />
          {errors.code && (
            <p id="code-error" className="text-red-500 text-xs mt-1.5 font-medium">{String(errors.code)}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Engine Oil 5L"
            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ${
              errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-200 focus:border-brand-500'
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            required
          />
          {errors.name && (
            <p id="name-error" className="text-red-500 text-xs mt-1.5 font-medium">{String(errors.name)}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ${
              errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 text-red-900' : 'border-zinc-200 focus:border-brand-500 text-zinc-900'
            }`}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
            required
          >
            <option value="" disabled className="text-zinc-400">Select Category</option>
            <option value="Oil">Oil & Fluids</option>
            <option value="Parts">Auto Parts</option>
            <option value="Service">Service</option>
            <option value="Accessories">Accessories</option>
          </select>
          {errors.category && (
            <p id="category-error" className="text-red-500 text-xs mt-1.5 font-medium">{String(errors.category)}</p>
          )}
        </div>

        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Unit Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            id="unitPrice"
            type="number"
            name="unitPrice"
            value={formData.unitPrice || ''}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ${
              errors.unitPrice ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-200 focus:border-brand-500'
            }`}
            aria-invalid={!!errors.unitPrice}
            aria-describedby={errors.unitPrice ? 'unitPrice-error' : undefined}
            required
          />
          {errors.unitPrice && (
            <p id="unitPrice-error" className="text-red-500 text-xs mt-1.5 font-medium">{String(errors.unitPrice)}</p>
          )}
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-zinc-100 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-brand-700 hover:shadow disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed transition-all duration-200 ease-out"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
           ) : initialData ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
};
