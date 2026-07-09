import React from 'react';
import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';
import { useAppStore } from '../store';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
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
