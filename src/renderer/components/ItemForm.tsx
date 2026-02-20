import React, { useState } from 'react';
import { Item, CreateItemInput } from '@/types';

interface ItemFormProps {
  onSubmit: (data: CreateItemInput) => void;
  isLoading?: boolean;
}

export const ItemForm: React.FC<ItemFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<CreateItemInput>({
    code: '',
    name: '',
    category: '',
    unitPrice: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'unitPrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.category) {
      alert('Please fill all required fields');
      return;
    }
    onSubmit(formData);
    setFormData({ code: '', name: '', category: '', unitPrice: 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Add New Item</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Item Code *</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., OIL-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Item Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Engine Oil 5L"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Category</option>
            <option value="Oil">Oil & Fluids</option>
            <option value="Parts">Auto Parts</option>
            <option value="Service">Service</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Unit Price (₹) *</label>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Adding...' : 'Add Item'}
      </button>
    </form>
  );
};
