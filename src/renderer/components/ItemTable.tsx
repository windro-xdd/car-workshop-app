import React from 'react';
import { Item } from '@/types';

interface ItemTableProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const ItemTable: React.FC<ItemTableProps> = ({
  items,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading items...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items found. Add an item to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Category
            </th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
              Unit Price (₹)
            </th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              <td className="px-6 py-3 text-sm text-gray-900 font-mono">{item.code}</td>
              <td className="px-6 py-3 text-sm text-gray-900">{item.name}</td>
              <td className="px-6 py-3 text-sm text-gray-700">{item.category}</td>
              <td className="px-6 py-3 text-sm text-gray-900 text-right font-semibold">
                ₹{item.unitPrice.toFixed(2)}
              </td>
              <td className="px-6 py-3 text-center">
                <button
                  onClick={() => onEdit(item)}
                  className="mr-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete "${item.name}"?`,
                      )
                    ) {
                      onDelete(item.id);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
