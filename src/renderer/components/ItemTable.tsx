import React, { useState } from 'react';
import { Item } from '../../types';
import { useModal } from './ModalProvider';

interface ItemTableProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  canDelete?: boolean;
}

export const ItemTable: React.FC<ItemTableProps> = ({
  items,
  onEdit,
  onDelete,
  isLoading = false,
  canDelete = true,
}) => {
  const { openModal } = useModal();

  const handleDeleteClick = async (item: Item) => {
    const confirmed = await openModal(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        isDangerous: true,
      }
    );
    if (confirmed) {
      onDelete(item.id);
    }
  };
  if (isLoading) {
    return <div className="text-center py-8 text-zinc-500">Loading items...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No items found. Add an item to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-200">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Unit Price (₹)</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-zinc-50/50 transition-colors duration-150 ease-in-out bg-white"
              >
                <td className="px-6 py-4 text-sm text-zinc-900 font-mono">{item.code}</td>
                <td className="px-6 py-4 text-sm text-zinc-900 font-medium">{item.name}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-900 text-right font-semibold">
                  {item.unitPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                   <button
                     onClick={() => onEdit(item)}
                     className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-zinc-600 bg-transparent hover:text-brand-600 hover:bg-brand-50 transition-colors duration-150"
                     aria-label={`Edit ${item.name}`}
                   >
                     Edit
                   </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-zinc-500 bg-transparent hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                      aria-label={`Delete ${item.name}`}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
