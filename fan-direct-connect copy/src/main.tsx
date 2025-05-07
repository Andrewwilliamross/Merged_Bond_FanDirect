
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add cache-busting meta tags dynamically
const addCacheBustingHeaders = () => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Cache-Control';
  meta.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(meta);
  
  const pragma = document.createElement('meta');
  pragma.httpEquiv = 'Pragma';
  pragma.content = 'no-cache';
  document.head.appendChild(pragma);
  
  const expires = document.createElement('meta');
  expires.httpEquiv = 'Expires';
  expires.content = '0';
  document.head.appendChild(expires);
};

// Execute cache-busting function
addCacheBustingHeaders();

// Force reload if we detect a stale version based on timestamp
const APP_VERSION = Date.now().toString();
const storedVersion = localStorage.getItem('app_version');
const storedDomain = localStorage.getItem('app_domain');
const currentDomain = window.location.hostname;
const hasQuerryParams = window.location.search.includes('cache_bust');

// Only clear cache if version/domain changed AND we're not already in a reload cycle
if ((storedVersion && storedVersion !== APP_VERSION || 
    (storedDomain && storedDomain !== currentDomain)) && 
    !hasQuerryParams) {
  
  // Clear any stored data that might be causing issues
  console.log('Clearing cache due to version or domain change');
  localStorage.clear(); // Clear ALL localStorage
  sessionStorage.clear();
  
  // Store new version and domain information
  localStorage.setItem('app_version', APP_VERSION);
  localStorage.setItem('app_domain', currentDomain);
  
  // Force hard reload to bypass browser cache, only once
  window.location.href = window.location.href + (window.location.search ? '&' : '?') + 'cache_bust=' + Date.now();
} else {
  // Just update the stored version/domain without reloading
  localStorage.setItem('app_version', APP_VERSION);
  localStorage.setItem('app_domain', currentDomain);
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there is a div with id 'root' in your HTML.");
}

const root = createRoot(rootElement);
root.render(<App />);
