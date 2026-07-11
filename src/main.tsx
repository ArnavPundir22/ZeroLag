import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Automatic Data Reset for v4 Launch
if (localStorage.getItem('zerolag_reset_epoch') !== 'v4') {
  localStorage.removeItem('last_sync_timestamp');
  localStorage.removeItem('zerolag_local_ops');
  localStorage.setItem('zerolag_reset_epoch', 'v4');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)