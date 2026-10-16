import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker in production mode (when compiled sw.js and precache manifest exist)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    registerSW({
      immediate: true,
      onOfflineReady() {
        console.log('🌸 [Tulizaana PWA] Application parée pour le fonctionnement hors-ligne.');
      },
      onNeedRefresh() {
        console.log('🌸 [Tulizaana PWA] Nouvelle version disponible, mise à jour automatique.');
      },
    });
  } catch (err) {
    console.debug('PWA Service Worker registration not available in this environment:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
