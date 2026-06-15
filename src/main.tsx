import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = document.getElementById('root')!;

try {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  root.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;font-family:system-ui,sans-serif">
      <div style="text-align:center;max-width:400px;padding:24px">
        <h1 style="color:#1e293b;font-size:20px;margin-bottom:8px">Gabim i papritur</h1>
        <p style="color:#64748b;font-size:14px;margin-bottom:16px">${err instanceof Error ? err.message : 'Aplikacioni nuk u ngarkua.'}</p>
        <button onclick="caches.keys().then(k=>Promise.all(k.map(n=>caches.delete(n)))).then(()=>location.reload())" style="background:#0d9488;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px">Rifresko faqen</button>
      </div>
    </div>`;
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Regjistro service worker-in. Mos bej reload automatik kur aktivizohet —
    // navigimi eshte network-first dhe asetet kane hash, keshtu qe versioni i ri
    // merret ne navigimin tjeter. Reload-i automatik shkaktonte loop/dridhje.
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
