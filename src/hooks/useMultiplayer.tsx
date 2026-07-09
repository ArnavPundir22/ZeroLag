import { useEffect, useState, useRef } from 'react';
import { useSyncContext } from './useSyncEngine';
import { useUser } from '@clerk/react';
import { useAppStore } from '../store';

export type CursorPosition = {
  x: number;
  y: number;
};

export type PresenceUser = {
  id: string;
  name: string;
  avatarUrl: string;
  color: string;
  cursor?: CursorPosition;
};

// Generates a random vibrant color based on a string (e.g., user id)
const getUserColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 60%)`;
};

export const useMultiplayer = () => {
  const { supabaseClient, isOffline } = useSyncContext();
  const { user } = useUser();
  const currentBoardId = useAppStore(state => state.currentBoardId);

  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>({});
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    if (!supabaseClient || isOffline || !currentBoardId || !user) {
      setOnlineUsers({});
      return;
    }

    const roomId = `presence:board:${currentBoardId}`;
    const channel = supabaseClient.channel(roomId, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    const userColor = getUserColor(user.id);
    const userInfo: PresenceUser = {
      id: user.id,
      name: user.fullName || user.firstName || 'Anonymous',
      avatarUrl: user.imageUrl || '',
      color: userColor,
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: Record<string, PresenceUser> = {};
        for (const id in state) {
          if (id !== user.id) {
             users[id] = state[id][0] as unknown as PresenceUser;
          }
        }
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id) {
          setOnlineUsers(prev => ({ ...prev, [key]: newPresences[0] as unknown as PresenceUser }));
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        setOnlineUsers(prev => {
          if (!prev[payload.userId]) return prev;
          return {
            ...prev,
            [payload.userId]: {
              ...prev[payload.userId],
              cursor: { x: payload.x, y: payload.y },
            },
          };
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userInfo);
        }
      });

    channelRef.current = channel;

    // Throttle the broadcast to avoid hitting limits
    let lastTime = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime > 50) { // 20 updates per second max
        if (channelRef.current && channelRef.current.state === 'joined') {
          channelRef.current.send({
            type: 'broadcast',
            event: 'cursor-move',
            payload: {
              userId: user.id,
              x: e.clientX,
              y: e.clientY,
            },
          });
        }
        lastTime = now;
      }
    };

    window.addEventListener('mousemove', throttledMouseMove);

    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      supabaseClient.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabaseClient, isOffline, currentBoardId, user]);

  return { onlineUsers };
};
