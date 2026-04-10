import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override fetch to include Authorization header
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    value: async (resource: RequestInfo | URL, config?: RequestInit) => {
      const token = localStorage.getItem('token');
      const activeAccountId = localStorage.getItem('activeAccountId');
      
      if (token) {
        const newConfig = config || {};
        const headers = {
          ...(newConfig.headers || {}),
          'Authorization': `Bearer ${token}`
        } as Record<string, string>;
        
        if (activeAccountId) {
          headers['X-Account-Id'] = activeAccountId;
        }
        return originalFetch(resource, { ...newConfig, headers });
      }
      
      return originalFetch(resource, config);
    },
    configurable: true,
    writable: true
  });
} catch (e) {
  console.warn('Failed to override window.fetch, using fallback wrapper', e);
  // Fallback if defineProperty fails
  try {
    (window as any).fetch = async (resource: RequestInfo | URL, config?: RequestInit) => {
      const token = localStorage.getItem('token');
      const activeAccountId = localStorage.getItem('activeAccountId');
      
      if (token) {
        const newConfig = config || {};
        const headers = {
          ...(newConfig.headers || {}),
          'Authorization': `Bearer ${token}`
        } as Record<string, string>;
        
        if (activeAccountId) {
          headers['X-Account-Id'] = activeAccountId;
        }
        return originalFetch(resource, { ...newConfig, headers });
      }
      
      return originalFetch(resource, config);
    };
  } catch (e2) {
    console.error('Critical: Could not override fetch', e2);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
