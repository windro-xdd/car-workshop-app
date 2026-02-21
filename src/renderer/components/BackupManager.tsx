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

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electronAPI.createBackup();
      if (result.success) {
        setSuccess(`Backup created: ${result.data?.fileName}`);
        onBackupCreated();
        await loadBackups();
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
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Database Backups</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <button
          onClick={handleCreateBackup}
          disabled={isLoading}
          className="mb-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
        >
          {isLoading ? 'Creating Backup...' : '💾 Create New Backup'}
        </button>

        {backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No backups found. Create your first backup now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-4">Backup File</th>
                  <th className="text-center py-3 px-4">Date</th>
                  <th className="text-right py-3 px-4">Size</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.filePath} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{backup.fileName}</td>
                    <td className="text-center py-3 px-4 text-sm">{formatDate(backup.createdAt)}</td>
                    <td className="text-right py-3 px-4 text-sm">{formatFileSize(backup.size)}</td>
                    <td className="text-center py-3 px-4 space-x-2">
                      <button
                        onClick={() => handleRestoreBackup(backup.filePath, backup.fileName)}
                        disabled={isLoading}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition text-sm disabled:opacity-50"
                        title="Restore this backup"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.filePath, backup.fileName)}
                        disabled={isLoading}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm disabled:opacity-50"
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

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Backup Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Create regular backups to prevent data loss</li>
          <li>Store backups in a safe location (external drive recommended)</li>
          <li>Before restoring, a backup of current data will be created automatically</li>
          <li>Backups are stored in: Documents/Workshop Backups</li>
        </ul>
      </div>
    </div>
  );
};
