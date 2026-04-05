import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override fetch to include Authorization header
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  const token = localStorage.getItem('token');
  const activeAccountId = localStorage.getItem('activeAccountId');
  
  if (token) {
    const newConfig = config || {};
    newConfig.headers = {
      ...newConfig.headers,
      'Authorization': `Bearer ${token}`
    };
    if (activeAccountId) {
      newConfig.headers['X-Account-Id'] = activeAccountId;
    }
    return originalFetch(resource, newConfig);
  }
  
  return originalFetch(...args);
};

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
