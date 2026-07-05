import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAppStore } from './store'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const ClerkProviderWithTheme = ({ children }: { children: React.ReactNode }) => {
  const theme = useAppStore(state => state.theme);
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{ theme: theme === 'dark' ? dark : undefined }}
    >
      {children}
    </ClerkProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProviderWithTheme>
      <App />
    </ClerkProviderWithTheme>
  </StrictMode>,
)