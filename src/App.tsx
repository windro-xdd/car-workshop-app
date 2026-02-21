import React, { useEffect, useState } from 'react';
import { InventoryPage } from './renderer/pages/InventoryPage';
import { InvoicePage } from './renderer/pages/InvoicePage';
import { SettingsPage } from './renderer/pages/SettingsPage';
import { ReportingPage } from './renderer/pages/ReportingPage';
import { LoginPage } from './renderer/pages/LoginPage';
import { useUserStore } from './renderer/store/userStore';
import { ToastProvider } from './renderer/components/ToastProvider';
import { ModalProvider } from './renderer/components/ModalProvider';
import './index.css';

type Page = 'inventory' | 'invoice' | 'settings' | 'reporting';

const App: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useUserStore();
  const [currentPage, setCurrentPage] = useState<Page>('inventory');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <ToastProvider>
      <ModalProvider>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-blue-600">🚗</div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Kripa Car Care</h1>
                </div>

                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                  aria-label="Toggle menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? '✕' : '☰'}
                </button>

                <div className="hidden md:flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCurrentPage('inventory');
                        setIsMenuOpen(false);
                      }}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        currentPage === 'inventory'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      📦 Inventory
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage('invoice');
                        setIsMenuOpen(false);
                      }}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        currentPage === 'invoice'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      📄 Invoices
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage('settings');
                        setIsMenuOpen(false);
                      }}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        currentPage === 'settings'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage('reporting');
                        setIsMenuOpen(false);
                      }}
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

              {isMenuOpen && (
                <div className="md:hidden mt-4 space-y-2 pb-4">
                  <button
                    onClick={() => {
                      setCurrentPage('inventory');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
                      currentPage === 'inventory'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    📦 Inventory
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('invoice');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
                      currentPage === 'invoice'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    📄 Invoices
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('settings');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
                      currentPage === 'settings'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('reporting');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
                      currentPage === 'reporting'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    📊 Reports
                  </button>
                  <hr className="my-2" />
                  <div className="px-4 py-2 text-sm text-gray-700">
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>

          {currentPage === 'inventory' && <InventoryPage />}
          {currentPage === 'invoice' && <InvoicePage />}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'reporting' && <ReportingPage />}
        </div>
      </ModalProvider>
    </ToastProvider>
  );
};

export default App;
