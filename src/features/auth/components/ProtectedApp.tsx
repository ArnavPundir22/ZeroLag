import React, { useEffect } from 'react';
import { useUser } from '@clerk/react';
import { useAppStore } from '../../../store';
import { DatabaseProvider } from '../../../db/DatabaseProvider';
import { LoginScreen } from './LoginScreen';

const SignedIn = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return isSignedIn ? <>{children}</> : null;
};

const SignedOut = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return !isSignedIn ? <>{children}</> : null;
};

export const ProtectedApp = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const isOffline = useAppStore(state => state.isOffline);
  const setIsOffline = useAppStore(state => state.setIsOffline);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('zerolag_offline_user_id', user.id);
    } else if (isLoaded && !isSignedIn && !isOffline) {
      localStorage.removeItem('zerolag_offline_user_id');
    }
  }, [user?.id, isLoaded, isSignedIn, isOffline]);

  const offlineUserId = localStorage.getItem('zerolag_offline_user_id');

  if (isOffline && offlineUserId) {
    return (
      <DatabaseProvider offlineUserId={offlineUserId}>
        {children}
      </DatabaseProvider>
    );
  }

  if (!isLoaded) {
    return <div className="h-screen w-screen flex items-center justify-center text-text-secondary">Loading...</div>;
  }

  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
        <DatabaseProvider>
          {children}
        </DatabaseProvider>
      </SignedIn>
    </>
  );
};
