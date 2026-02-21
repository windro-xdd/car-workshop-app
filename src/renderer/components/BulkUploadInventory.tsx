import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface BulkUploadInventoryProps {
  onUpload: (items: any[]) => Promise<void>;
  isLoading: boolean;
}

export const BulkUploadInventory: React.FC<BulkUploadInventoryProps> = ({
  onUpload,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as any[]);
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (err) {
          reject(new Error(`Excel parsing error: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const parseTSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        delimiter: '\t',
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as any[]);
        },
        error: (error) => {
          reject(new Error(`TSV parsing error: ${error.message}`));
        },
      });
    });
  };

  const parseJSON = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            resolve(data);
          } else {
            reject(new Error('JSON file must contain an array of objects'));
          }
        } catch (err) {
          reject(new Error(`JSON parsing error: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadProgress('Parsing file...');

    try {
      let parsedData: any[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        parsedData = await parseCSV(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        parsedData = await parseExcel(file);
      } else if (fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
        parsedData = await parseTSV(file);
      } else if (fileName.endsWith('.json')) {
        parsedData = await parseJSON(file);
      } else {
        throw new Error('Unsupported file format. Supported: CSV, XLSX, XLS, TSV, JSON');
      }

      if (parsedData.length === 0) {
        throw new Error('File is empty or contains no data');
      }

      setUploadProgress(`Found ${parsedData.length} items. Uploading...`);
      await onUpload(parsedData);
      setUploadProgress(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setUploadProgress(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Bulk Upload Inventory</h3>
        <p className="text-sm text-zinc-600">
          Import items from CSV, Excel, TSV, or JSON files
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {uploadProgress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg">
          {uploadProgress}
        </div>
      )}

      <div className="space-y-4">
        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-brand-400 hover:bg-brand-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg
            className="w-8 h-8 mx-auto mb-2 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <p className="text-zinc-700 font-medium mb-1">Click to upload or drag file</p>
          <p className="text-xs text-zinc-500">CSV, XLSX, XLS, TSV, or JSON (Max 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.tsv,.txt,.json"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />
        </div>

        <div className="bg-zinc-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-zinc-900 mb-2">Required Columns:</h4>
          <ul className="text-sm text-zinc-600 space-y-1">
            <li>code - Item code/SKU</li>
            <li>name - Item name</li>
            <li>category - Item category</li>
            <li>unitPrice - Price per unit (number)</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Example CSV Format:</h4>
          <code className="text-xs text-blue-800 bg-white p-2 rounded block overflow-x-auto">
            code,name,category,unitPrice{'\n'}
            OIL-001,Synthetic Oil 5W30,Lubricants,450.00{'\n'}
            FILTER-001,Air Filter,Filters,120.00{'\n'}
            BRAKE-001,Brake Pads Set,Brakes,1200.00
          </code>
        </div>
      </div>
    </div>
  );
};
