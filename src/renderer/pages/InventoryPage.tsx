import React, { useEffect, useState } from 'react';
import { ItemForm } from '../components/ItemForm';
import { ItemTable } from '../components/ItemTable';
import { BulkUploadInventory } from '../components/BulkUploadInventory';
import { useItemStore } from '../store/itemStore';
import { useUserStore } from '../store/userStore';
import { useToast } from '../components/ToastProvider';
import { Item, CreateItemInput } from '../../types';

export const InventoryPage: React.FC = () => {
  const { items, loading, error, setItems, setLoading, setError } = useItemStore();
  const { currentUser } = useUserStore();
  const { showToast } = useToast();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const canManageInventory = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getItems();
      if (result.success) {
        setItems(result.data || []);
      } else {
        setError(result.error || 'Failed to load items');
      }
    } catch (err) {
      setError('Error loading items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (data: CreateItemInput) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.createItem(data);
      if (result.success) {
        const item = result.data as Item;
        setItems([...(items || []), item]);
        setError(null);
        showToast('Item added successfully', 'success', 4000);
      } else {
        setError(result.error || 'Failed to add item');
        showToast(result.error || 'Failed to add item', 'error', 5000);
      }
    } catch (err) {
      setError('Error adding item');
      showToast('Error adding item', 'error', 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.deleteItem(id);
      if (result.success) {
        setItems((items || []).filter((item) => item.id !== id));
        setError(null);
        showToast('Item deleted successfully', 'success', 4000);
      } else {
        setError(result.error || 'Failed to delete item');
        showToast(result.error || 'Failed to delete item', 'error', 5000);
      }
    } catch (err) {
      setError('Error deleting item');
      showToast('Error deleting item', 'error', 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = async (item: Item) => {
    setEditingItem(item);
  };

  const handleEditSubmit = async (data: CreateItemInput) => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const result = await window.electronAPI.updateItem({ id: editingItem.id, ...data });
      if (result.success) {
        const updatedItem = result.data as Item;
        setItems((items || []).map(i => i.id === editingItem.id ? updatedItem : i));
        setError(null);
        showToast('Item updated successfully', 'success', 4000);
        setEditingItem(null);
      } else {
        setError(result.error || 'Failed to update item');
        showToast(result.error || 'Failed to update item', 'error', 5000);
      }
    } catch (err) {
      setError('Error updating item');
      showToast('Error updating item', 'error', 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleBulkUpload = async (items: any[]) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.bulkImportItems({
        items,
        filePath: '',
      });

      if (result.success) {
        const importResult = result.data as { success: number; failed: number; errors: string[] };
        if (importResult.success > 0) {
          showToast(`Successfully imported ${importResult.success} items`, 'success', 5000);
          await loadItems();
        }
        if (importResult.failed > 0) {
          const errorMsg = importResult.errors.slice(0, 3).join('; ');
          showToast(
            `${importResult.failed} items failed to import. ${errorMsg}${
              importResult.errors.length > 3 ? '...' : ''
            }`,
            'error',
            5000
          );
        }
      } else {
        setError(result.error || 'Failed to import items');
        showToast(result.error || 'Failed to import items', 'error', 5000);
      }
    } catch (err) {
      setError('Error importing items');
      showToast('Error importing items', 'error', 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Inventory Management</h1>
        <p className="text-sm md:text-base text-zinc-500 mt-1">Manage your workshop items, parts, and services</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm text-sm">
          {error}
        </div>
      )}

      {!canManageInventory && (
        <div className="mb-6 p-4 bg-brand-50 border border-brand-200 text-brand-700 rounded-lg shadow-sm text-sm flex items-center">
          <span className="mr-2">ℹ️</span> You have read-only access to inventory. Only managers and admins can modify items.
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900">Edit Item: {editingItem.name}</h2>
              <button
                onClick={handleCancelEdit}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Close edit modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ItemForm 
              onSubmit={handleEditSubmit} 
              isLoading={loading}
              initialData={editingItem}
            />
            <button
              onClick={handleCancelEdit}
              className="w-full mt-4 px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {canManageInventory && (
          <>
            <BulkUploadInventory onUpload={handleBulkUpload} isLoading={loading} />
            <ItemForm onSubmit={handleAddItem} isLoading={loading} />
          </>
        )}
        <ItemTable
          items={items || []}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          isLoading={loading}
          canDelete={canManageInventory}
        />
      </div>
    </div>
  );
};
