import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Automatically reload the page when a new version of the app is deployed
// This prevents the "missing CSS" caching issues in production.
registerSW({
  immediate: true,
  onNeedRefresh() {
    // A new update is available, force the browser to reload and get the new CSS/JS
    window.location.reload();
  }
});

// Automatic Data Reset for v4 Launch
if (localStorage.getItem('zerolag_reset_epoch') !== 'v4') {
  localStorage.removeItem('last_sync_timestamp');
  localStorage.removeItem('zerolag_local_ops');
  localStorage.setItem('zerolag_reset_epoch', 'v4');
  localStorage.setItem('v4_update_msg_shown', 'false');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)