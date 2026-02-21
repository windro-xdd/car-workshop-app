import React, { useState } from 'react';
import { InventoryPage } from './renderer/pages/InventoryPage';
import { InvoicePage } from './renderer/pages/InvoicePage';
import './index.css';

type Page = 'inventory' | 'invoice';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('inventory');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">🚗</div>
              <h1 className="text-2xl font-bold text-gray-900">Kripa Car Care</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage('inventory')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  currentPage === 'inventory'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                📦 Inventory
              </button>
              <button
                onClick={() => setCurrentPage('invoice')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  currentPage === 'invoice'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                📄 Invoices
              </button>
            </div>
          </div>
        </div>
      </nav>

      {currentPage === 'inventory' && <InventoryPage />}
      {currentPage === 'invoice' && <InvoicePage />}
    </div>
  );
};

export default App;
