import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override fetch to include Authorization and X-Account-Id headers
const originalFetch = window.fetch;
const getAccountId = () => {
  return localStorage.getItem('currentProfileId') || localStorage.getItem('activeAccountId') || 'default';
};

const wrapFetchConfig = (config?: RequestInit): RequestInit => {
  const token = localStorage.getItem('token');
  const activeAccountId = getAccountId();
  const newConfig = config ? { ...config } : {};
  const existingHeaders = (newConfig.headers || {}) as Record<string, string>;
  const headers: Record<string, string> = {
    ...existingHeaders,
    'X-Account-Id': activeAccountId,
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { ...newConfig, headers };
};

try {
  Object.defineProperty(window, 'fetch', {
    value: async (resource: RequestInfo | URL, config?: RequestInit) => {
      return originalFetch(resource, wrapFetchConfig(config));
    },
    configurable: true,
    writable: true
  });
} catch (e) {
  console.warn('Failed to override window.fetch, using fallback wrapper', e);
  try {
    (window as any).fetch = async (resource: RequestInfo | URL, config?: RequestInit) => {
      return originalFetch(resource, wrapFetchConfig(config));
    };
  } catch (e2) {
    console.error('Critical: Could not override fetch', e2);
  }
}

// Resilient handling for transient network and ping timeout errors
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason || '');
  if (msg.includes('TIMEOUT') || msg.includes('Connection check timed out')) {
    console.warn('[Network] Handled transient timeout rejection gracefully:', msg);
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  const msg = event.message || event.error?.message || '';
  if (msg.includes('TIMEOUT') || msg.includes('Connection check timed out')) {
    console.warn('[Network] Handled transient timeout error gracefully:', msg);
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
