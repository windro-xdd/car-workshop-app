import React, { useState } from 'react';
import { BackupManager } from '../components/BackupManager';
import { useInvoiceStore } from '../store/invoiceStore';

export const SettingsPage: React.FC = () => {
  const { gstPercentage, setGstPercentage } = useInvoiceStore();
  const [gstInput, setGstInput] = useState(gstPercentage.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGstChange = async () => {
    const newGst = parseFloat(gstInput);
    if (isNaN(newGst) || newGst < 0) {
      alert('Please enter a valid GST percentage');
      return;
    }

    try {
      const result = await window.electronAPI.updateGstConfig({
        id: 'default',
        rate: newGst,
        isActive: true,
      });

      if (result.success) {
        setGstPercentage(newGst);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert(`Failed to update GST: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Settings</h1>
        <p className="text-gray-600 mb-8">Configure workshop settings and backups</p>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">⚙️ GST Configuration</h2>

            {savedSuccess && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                GST percentage updated successfully!
              </div>
            )}

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
              <div className="flex gap-4">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={gstInput}
                  onChange={(e) => setGstInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleGstChange}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Save
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Current: {gstPercentage}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">💾 Database Backups</h2>
            <BackupManager onBackupCreated={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
};
