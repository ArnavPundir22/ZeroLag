import { useEffect, useState } from 'react';
import { useUser } from '@clerk/react';
import { useSyncContext } from './useSyncEngine';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useUser();
  const { supabaseClient, isOffline } = useSyncContext();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('zerolag_push_subscribed') === 'true' && Notification.permission === 'granted';
    }
    return false;
  });

  const requestPermissionAndSubscribe = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications are not supported in this browser.');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicVapidKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.warn('VITE_WEB_PUSH_PUBLIC_KEY environment variable is not defined.');
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      setIsSubscribed(true);
      localStorage.setItem('zerolag_push_subscribed', 'true');

      if (supabaseClient && user) {
        const { error } = await supabaseClient
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscription.toJSON(),
          }, {
            onConflict: 'user_id,subscription'
          });

        if (error) {
          console.error('Failed to sync push subscription with Supabase (Check if the push_subscriptions table has been created):', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user && supabaseClient && !isOffline && ('serviceWorker' in navigator)) {
      if (Notification.permission === 'granted' || Notification.permission === 'default') {
        requestPermissionAndSubscribe();
      } else {
        setIsSubscribed(false);
        localStorage.removeItem('zerolag_push_subscribed');
      }
    }
  }, [user, supabaseClient, isOffline]);

  return {
    permission,
    isSubscribed,
    requestPermissionAndSubscribe,
  };
}
