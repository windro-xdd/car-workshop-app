import React, { useState } from 'react';
import { InventoryPage } from './renderer/pages/InventoryPage';
import { InvoicePage } from './renderer/pages/InvoicePage';
import { SettingsPage } from './renderer/pages/SettingsPage';
import { ReportingPage } from './renderer/pages/ReportingPage';
import './index.css';

type Page = 'inventory' | 'invoice' | 'settings' | 'reporting';

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
               <button
                 onClick={() => setCurrentPage('settings')}
                 className={`px-6 py-2 rounded-lg font-semibold transition ${
                   currentPage === 'settings'
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                 }`}
               >
                 ⚙️ Settings
               </button>
               <button
                 onClick={() => setCurrentPage('reporting')}
                 className={`px-6 py-2 rounded-lg font-semibold transition ${
                   currentPage === 'reporting'
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                 }`}
               >
                 📊 Reports
               </button>
            </div>
          </div>
        </div>
      </nav>

      {currentPage === 'inventory' && <InventoryPage />}
      {currentPage === 'invoice' && <InvoicePage />}
      {currentPage === 'settings' && <SettingsPage />}
      {currentPage === 'reporting' && <ReportingPage />}
    </div>
  );
};

export default App;
