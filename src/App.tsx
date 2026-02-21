import React, { useEffect, useState } from 'react';
import { InventoryPage } from './renderer/pages/InventoryPage';
import { InvoicePage } from './renderer/pages/InvoicePage';
import { SettingsPage } from './renderer/pages/SettingsPage';
import { ReportingPage } from './renderer/pages/ReportingPage';
import { LoginPage } from './renderer/pages/LoginPage';
import { useUserStore } from './renderer/store/userStore';
import { ToastProvider } from './renderer/components/ToastProvider';
import { ModalProvider } from './renderer/components/ModalProvider';
import kripaLogo from './assets/kripa-logo.png';
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
        <div className="flex h-screen bg-zinc-50 overflow-hidden">
          {isMenuOpen && (
            <div 
              className="fixed inset-0 bg-zinc-900/50 z-40 md:hidden transition-opacity" 
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="h-16 flex items-center px-6 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src={kripaLogo} alt="Kripa Car Care" className="w-8 h-8" />
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Kripa Car Care</h1>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="md:hidden ml-auto p-2 text-zinc-400 hover:text-zinc-600 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              <button
                onClick={() => {
                  setCurrentPage('inventory');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'inventory'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Inventory
              </button>
              <button
                onClick={() => {
                  setCurrentPage('invoice');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'invoice'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoices
              </button>
              <button
                onClick={() => {
                  setCurrentPage('settings');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'settings'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <button
                onClick={() => {
                  setCurrentPage('reporting');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'reporting'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Reports
              </button>
            </div>

            <div className="p-4 border-t border-zinc-100 shrink-0">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                  <span className="text-zinc-600 font-semibold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-zinc-500 capitalize truncate">{currentUser.role}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Logout"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>

          <main className="flex-1 flex flex-col min-w-0 bg-zinc-50/50 overflow-hidden">
            <div className="md:hidden h-16 border-b border-zinc-200 bg-white flex items-center px-4 shrink-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 rounded-md"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-2 text-lg font-bold text-zinc-900 tracking-tight">Kripa Car Care</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {currentPage === 'inventory' && <InventoryPage />}
              {currentPage === 'invoice' && <InvoicePage />}
              {currentPage === 'settings' && <SettingsPage />}
              {currentPage === 'reporting' && <ReportingPage />}
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  );
};

export default App;
