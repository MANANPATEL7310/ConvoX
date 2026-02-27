import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * WaitingRoomScreen — shown to participants while waiting for host to admit them.
 *
 * Props:
 *   username   — current user's display name
 *   hostName   — host's name (optional)
 *   rejected   — boolean, true when host rejected this user
 *   onLeave    — callback when user decides to leave
 */
export default function WaitingRoomScreen({ username, rejected, onLeave }) {
  const { dark } = useTheme();
  const initial = username?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: dark ? 'rgba(3,7,18,0.98)' : 'rgba(249,250,251,0.99)' }}>

      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl transition-colors duration-500 ${
          rejected ? 'bg-red-600/10' : 'bg-indigo-600/10'
        }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`relative w-full max-w-md mx-4 rounded-3xl border p-10 text-center shadow-2xl ${
          dark ? 'bg-gray-900/95 border-white/[0.08]' : 'bg-white/95 border-gray-200'
        }`}
      >
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r ${
          rejected ? 'from-red-500 via-rose-500 to-pink-500' : 'from-indigo-500 via-purple-500 to-pink-500'
        }`} />

        <AnimatePresence mode="wait">
          {rejected ? (
            /* ── Rejected state ── */
            <motion.div key="rejected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center border-2 border-red-500/30">
                <WifiOff className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className={`text-xl font-black mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                  Entry Denied
                </h2>
                <p className={`text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  The host has declined your request to join this meeting.
                </p>
              </div>
              <button
                onClick={onLeave}
                style={{
                  padding: '12px 32px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                Leave Meeting
              </button>
            </motion.div>
          ) : (
            /* ── Waiting state ── */
            <motion.div key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5"
            >
              {/* Pulsing avatar */}
              <div className="relative">
                {/* Outer rings */}
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
                    animate={{ scale: 1 + i * 0.35, opacity: [0.6, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: 'easeOut',
                    }}
                  />
                ))}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <span className="text-3xl font-black text-white">{initial}</span>
                </div>
              </div>

              {/* ConvoX logo */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Video className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  ConvoX
                </span>
              </div>

              <div>
                <h2 className={`text-xl font-black mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                  Waiting to be admitted
                </h2>
                <p className={`text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  The host has been notified of your request.<br />
                  Please wait while they let you in.
                </p>
              </div>

              {/* Animated dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-500"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>

              {/* Status pill */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold ${
                dark
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}>
                <Wifi className="w-3 h-3" />
                Connected · Awaiting host approval
              </div>

              <button
                onClick={onLeave}
                style={{
                  padding: '10px 28px',
                  borderRadius: 12,
                  border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                  background: 'transparent',
                  color: dark ? '#9ca3af' : '#6b7280',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Leave
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
