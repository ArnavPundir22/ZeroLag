import React from 'react';
import type { PresenceUser } from '../../../hooks/useMultiplayer';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveCursorsProps {
  onlineUsers: Record<string, PresenceUser>;
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({ onlineUsers }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {Object.values(onlineUsers).map((user) => {
          if (!user.cursor) return null;

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: user.cursor.x,
                y: user.cursor.y,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                x: { type: 'spring', damping: 30, mass: 0.8, stiffness: 400 },
                y: { type: 'spring', damping: 30, mass: 0.8, stiffness: 400 },
                opacity: { duration: 0.2 }
              }}
              className="absolute top-0 left-0 flex flex-col items-start drop-shadow-md"
              style={{
                // Offset slightly so the SVG tip aligns with the actual cursor
                marginLeft: '-2px',
                marginTop: '-2px',
              }}
            >
              <svg
                width="24"
                height="36"
                viewBox="0 0 24 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
              >
                <path
                  d="M5.65376 2.13815L2.39276 33.0039C2.20306 34.7997 4.29828 35.8361 5.67484 34.6288L12.3965 28.735C12.8398 28.346 13.4338 28.1754 14.0205 28.2687L22.2573 29.5786C24.0379 29.8618 25.3274 27.973 24.3683 26.4862L10.3703 4.79339C9.41872 3.31828 7.21447 3.37703 6.34005 4.8967L5.65376 2.13815Z"
                  fill={user.color}
                />
                <path
                  d="M5.65376 2.13815L2.39276 33.0039C2.20306 34.7997 4.29828 35.8361 5.67484 34.6288L12.3965 28.735C12.8398 28.346 13.4338 28.1754 14.0205 28.2687L22.2573 29.5786C24.0379 29.8618 25.3274 27.973 24.3683 26.4862L10.3703 4.79339C9.41872 3.31828 7.21447 3.37703 6.34005 4.8967L5.65376 2.13815Z"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              <div
                className="mt-1 px-2 py-1 bg-surface text-white text-[10px] font-bold rounded-lg rounded-tl-none whitespace-nowrap overflow-hidden shadow-lg border border-white/10"
                style={{ backgroundColor: user.color }}
              >
                {user.name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
