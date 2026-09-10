import './globals.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { DocsPage } from './components/DocsPage.js';
import AdminPage from './pages/AdminPage.js';
import { WalletProvider } from './contexts/WalletContext.js';
import './styles.css';

// Minimal path- and hash-based routing so SPA routes work seamlessly across all static hosts.
const path = window.location.pathname.replace(/\/+$/, '');
const hash = window.location.hash;
const isDocs = path === '/docs' || hash === '#docs';
const isAdmin = path === '/admin' || hash === '#admin';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      {isAdmin ? <AdminPage /> : isDocs ? <DocsPage /> : <App />}
    </WalletProvider>
  </React.StrictMode>,
);
