import React, { useState } from 'react';
import { BackupManager } from '../components/BackupManager';
import { useInvoiceStore } from '../store/invoiceStore';
import { useToast } from '../components/ToastProvider';

export const SettingsPage: React.FC = () => {
  const { gstPercentage, setGstPercentage } = useInvoiceStore();
  const { showToast } = useToast();
  const [gstInput, setGstInput] = useState(gstPercentage.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGstChange = async () => {
    const newGst = parseFloat(gstInput);
    if (isNaN(newGst) || newGst < 0) {
      showToast('Please enter a valid GST percentage (0-100)', 'error', 4000);
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
        showToast(`GST percentage updated to ${newGst}%`, 'success', 4000);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        showToast(`Error: ${result.error}`, 'error', 5000);
      }
    } catch (err) {
      showToast(`Failed to update GST`, 'error', 5000);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-zinc-500 mt-1">Configure workshop settings and system backups</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-zinc-200">
          <div className="border-b border-zinc-100 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              GST Configuration
            </h2>
          </div>

          {savedSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg shadow-sm text-sm flex items-center">
              <span className="mr-2">✓</span> GST percentage updated successfully!
            </div>
          )}

          <div className="max-w-md">
            <label htmlFor="gst-input" className="block text-sm font-medium text-zinc-700 mb-1.5">
              GST Rate (%) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                id="gst-input"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={gstInput}
                onChange={(e) => setGstInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                aria-label="GST Rate percentage"
              />
              <button
                onClick={handleGstChange}
                className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-brand-700 transition-all duration-200 ease-out"
              >
                Save Changes
              </button>
            </div>
            <p className="text-sm text-zinc-500 mt-2">Current Active Rate: <strong className="text-zinc-900">{gstPercentage}%</strong></p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-zinc-200">
          <div className="border-b border-zinc-100 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
              Database Backups
            </h2>
          </div>
          <BackupManager onBackupCreated={() => {}} />
        </div>
      </div>
    </div>
  );
};
