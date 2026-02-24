import React, { useState, useEffect, useRef } from 'react';
import { BackupManager } from '../components/BackupManager';
import { useInvoiceStore } from '../store/invoiceStore';
import { useToast } from '../components/ToastProvider';
import { BusinessConfig } from '../../types';

export const SettingsPage: React.FC = () => {
  const { gstPercentage, setGstPercentage } = useInvoiceStore();
  const { showToast } = useToast();
  const [gstInput, setGstInput] = useState(gstPercentage.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Business config state
  const [gstin, setGstin] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [businessConfigLoading, setBusinessConfigLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBusinessConfig();
  }, []);

  const loadBusinessConfig = async () => {
    try {
      const result = await window.electronAPI.getBusinessConfig();
      if (result.success && result.data) {
        setGstin(result.data.gstin || '');
        setLogoPath(result.data.logoPath || '');
        if (result.data.logoPath) {
          loadLogoPreview(result.data.logoPath);
        }
      }
    } catch (err) {
      console.error('Error loading business config:', err);
    }
  };

  const loadLogoPreview = async (path: string) => {
    try {
      const result = await window.electronAPI.readLogoFile(path);
      if (result.success && result.data) {
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(result.data.buffer))
        );
        setLogoPreview(`data:${result.data.mimeType};base64,${base64}`);
      }
    } catch (err) {
      console.error('Error loading logo preview:', err);
    }
  };

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

  const handleGstinSave = async () => {
    setBusinessConfigLoading(true);
    try {
      const result = await window.electronAPI.updateBusinessConfig({
        id: 'default',
        gstin,
        logoPath,
      });

      if (result.success) {
        showToast('GSTIN updated successfully', 'success', 4000);
      } else {
        showToast(`Error: ${result.error}`, 'error', 5000);
      }
    } catch (err) {
      showToast('Failed to update GSTIN', 'error', 5000);
    } finally {
      setBusinessConfigLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG)', 'error', 4000);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file must be less than 2MB', 'error', 4000);
      return;
    }

    setBusinessConfigLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Array.from(new Uint8Array(arrayBuffer));

      const saveResult = await window.electronAPI.saveLogoFile({
        buffer,
        fileName: file.name,
      });

      if (saveResult.success && saveResult.data) {
        const newLogoPath = saveResult.data.logoPath;
        setLogoPath(newLogoPath);

        // Update business config with new logo path
        await window.electronAPI.updateBusinessConfig({
          id: 'default',
          gstin,
          logoPath: newLogoPath,
        });

        // Show preview
        const reader = new FileReader();
        reader.onload = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        showToast('Logo uploaded successfully', 'success', 4000);
      } else {
        showToast(`Error: ${saveResult.error}`, 'error', 5000);
      }
    } catch (err) {
      showToast('Failed to upload logo', 'error', 5000);
      console.error('Logo upload error:', err);
    } finally {
      setBusinessConfigLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    setBusinessConfigLoading(true);
    try {
      await window.electronAPI.updateBusinessConfig({
        id: 'default',
        gstin,
        logoPath: '',
      });
      setLogoPath('');
      setLogoPreview(null);
      showToast('Logo removed', 'success', 4000);
    } catch (err) {
      showToast('Failed to remove logo', 'error', 5000);
    } finally {
      setBusinessConfigLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-zinc-500 mt-1">Configure workshop settings, business details, and system backups</p>
      </div>

      <div className="space-y-6">
        {/* GST Configuration */}
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
              <span className="mr-2">&#10003;</span> GST percentage updated successfully!
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

        {/* Business Details - GSTIN & Logo */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-zinc-200">
          <div className="border-b border-zinc-100 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              Business Details
            </h2>
          </div>

          <div className="space-y-6">
            {/* GSTIN */}
            <div className="max-w-md">
              <label htmlFor="gstin-input" className="block text-sm font-medium text-zinc-700 mb-1.5">
                GSTIN Number
              </label>
              <div className="flex gap-3">
                <input
                  id="gstin-input"
                  type="text"
                  placeholder="e.g., 32AABCU9603R1ZM"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 font-mono"
                  aria-label="GSTIN Number"
                />
                <button
                  onClick={handleGstinSave}
                  disabled={businessConfigLoading}
                  className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-brand-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all duration-200 ease-out"
                >
                  {businessConfigLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">15-character GST Identification Number. This will appear on invoices.</p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">
                Business Logo
              </label>
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Business logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={businessConfigLoading}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all duration-200 ease-out"
                  >
                    {businessConfigLoading ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  {logoPreview && (
                    <button
                      onClick={handleRemoveLogo}
                      disabled={businessConfigLoading}
                      className="px-4 py-2 text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Remove Logo
                    </button>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">PNG or JPG, max 2MB. Appears on invoice PDFs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Manager */}
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
