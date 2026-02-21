import React, { useEffect, useState } from 'react';
import { InventoryPage } from './renderer/pages/InventoryPage';
import { InvoicePage } from './renderer/pages/InvoicePage';
import { SettingsPage } from './renderer/pages/SettingsPage';
import { ReportingPage } from './renderer/pages/ReportingPage';
import { LoginPage } from './renderer/pages/LoginPage';
import { useUserStore } from './renderer/store/userStore';
import './index.css';

type Page = 'inventory' | 'invoice' | 'settings' | 'reporting';

const App: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useUserStore();
  const [currentPage, setCurrentPage] = useState<Page>('inventory');

  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">🚗</div>
              <h1 className="text-2xl font-bold text-gray-900">Kripa Car Care</h1>
            </div>
            <div className="flex items-center space-x-4">
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
              <div className="border-l pl-4 flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  Logout
                </button>
              </div>
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
