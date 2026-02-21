import React, { useEffect } from 'react';
import { ItemForm } from '../components/ItemForm';
import { ItemTable } from '../components/ItemTable';
import { useItemStore } from '../store/itemStore';
import { useUserStore } from '../store/userStore';
import { Item, CreateItemInput } from '../../types';

export const InventoryPage: React.FC = () => {
  const { items, loading, error, setItems, setLoading, setError } = useItemStore();
  const { currentUser } = useUserStore();
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
        alert('Item added successfully');
      } else {
        setError(result.error || 'Failed to add item');
      }
    } catch (err) {
      setError('Error adding item');
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
        alert('Item deleted successfully');
      } else {
        setError(result.error || 'Failed to delete item');
      }
    } catch (err) {
      setError('Error deleting item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: Item) => {
    alert(`Edit feature coming soon for: ${item.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mb-8">Manage your workshop items and services</p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!canManageInventory && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            📖 You have read-only access to inventory. Only managers and admins can add or delete items.
          </div>
        )}

        {canManageInventory && <ItemForm onSubmit={handleAddItem} isLoading={loading} />}
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
