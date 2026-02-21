import React, { useState, useEffect } from 'react';

interface Backup {
  fileName: string;
  filePath: string;
  size: number;
  createdAt: Date;
}

interface BackupManagerProps {
  onBackupCreated: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ onBackupCreated }) => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const result = await window.electronAPI.listBackups();
      if (result.success) {
        setBackups((result.data || []).map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
        })));
      } else {
        setError(result.error || 'Failed to load backups');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading backups');
    }
  };

  const handleCreateBackup = async (customPath = false) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electronAPI.createBackup(customPath ? { customPath: true } : undefined);
      if (result.success) {
        setSuccess(`Backup saved: ${result.data?.fileName}`);
        onBackupCreated();
        await loadBackups();
      } else if (result.error === 'Backup cancelled') {
        // User cancelled the dialog, no error to show
      } else {
        setError(result.error || 'Failed to create backup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupPath: string, fileName: string) => {
    if (!window.confirm(`Restore from backup: ${fileName}? This will replace current data.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electronAPI.restoreBackup(backupPath);
      if (result.success) {
        setSuccess('Backup restored successfully. Please refresh the application.');
      } else {
        setError(result.error || 'Failed to restore backup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error restoring backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupPath: string, fileName: string) => {
    if (!window.confirm(`Delete backup: ${fileName}? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.deleteBackup(backupPath);
      if (result.success) {
        setSuccess(`Backup deleted: ${fileName}`);
        await loadBackups();
      } else {
        setError(result.error || 'Failed to delete backup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting backup');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg shadow-sm text-sm flex items-center">
            <span className="mr-2">✓</span> {success}
          </div>
        )}

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => handleCreateBackup(false)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed transition-all duration-200 ease-out font-medium text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
            </svg>
            {isLoading ? 'Creating...' : 'Quick Backup'}
          </button>
          <button
            onClick={() => handleCreateBackup(true)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-white text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed transition-all duration-200 ease-out font-medium text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2-2H8L6 7H5a2 2 0 00-2 0z"></path>
            </svg>
            Save As...
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <svg className="mx-auto h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-zinc-900">No backups</h3>
            <p className="mt-1 text-sm text-zinc-500">Get started by creating your first backup.</p>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200">
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Backup File</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Size</th>
                  <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {backups.map((backup) => (
                  <tr key={backup.filePath} className="hover:bg-zinc-50/50 transition-colors duration-150 ease-in-out bg-white">
                    <td className="px-6 py-4 text-sm text-zinc-900 font-mono">{backup.fileName}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500 text-center">{formatDate(backup.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500 text-right">{formatFileSize(backup.size)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleRestoreBackup(backup.filePath, backup.fileName)}
                        disabled={isLoading}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-brand-600 bg-transparent hover:bg-brand-50 transition-colors duration-150 disabled:opacity-50"
                        title="Restore this backup"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.filePath, backup.fileName)}
                        disabled={isLoading}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-zinc-500 bg-transparent hover:text-red-600 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
                        title="Delete this backup"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-brand-50/50 border border-brand-100 p-5 rounded-xl flex gap-3 items-start">
        <svg className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 className="font-semibold text-brand-900 text-sm mb-1">Backup Tips</h3>
          <ul className="text-sm text-brand-700/80 space-y-1 list-disc list-inside">
            <li>Create regular backups to prevent data loss</li>
            <li>Store backups in a safe location (external drive recommended)</li>
            <li>Before restoring, a backup of current data will be created automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
