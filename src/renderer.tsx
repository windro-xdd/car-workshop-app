import React from 'react';
import ReactDOM from 'react-dom/client';
import { InventoryPage } from './renderer/pages/InventoryPage';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <InventoryPage />
  </React.StrictMode>,
);
