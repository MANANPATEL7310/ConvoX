import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UserX, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * HostAdmitPanel — slide-in panel for the host to manage the waiting room.
 *
 * Props:
 *   waitlist       — [{ socketId, username }]
 *   onAdmit        — (socketId) => void
 *   onReject       — (socketId) => void
 *   onClose        — () => void
 */
export default function HostAdmitPanel({ waitlist = [], onAdmit, onReject, onClose }) {
  const { dark } = useTheme();

  return (
    <AnimatePresence>
      <motion.div
        key="host-admit-panel"
        initial={{ x: 340, opacity: 0 }}
        animate={{ x: 0,   opacity: 1 }}
        exit={{   x: 340, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute right-4 bottom-24 w-80 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
          dark
            ? 'bg-gray-900/95 border-white/[0.08] shadow-black/60 backdrop-blur-xl'
            : 'bg-white/95      border-gray-200/80  shadow-gray-400/20 backdrop-blur-xl'
        }`}
      >
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          dark ? 'border-white/[0.06]' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Waiting Room</p>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {waitlist.length} {waitlist.length === 1 ? 'person' : 'people'} waiting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
              background: dark ? '#1f2937' : '#f9fafb',
              color: dark ? '#9ca3af' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Waitlist */}
        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence>
            {waitlist.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center"
              >
                <Users className={`w-8 h-8 mx-auto mb-3 ${dark ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`text-sm ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                  No one is waiting right now
                </p>
              </motion.div>
            ) : (
              waitlist.map(({ socketId, username }) => {
                const initial = username?.charAt(0)?.toUpperCase() || '?';
                return (
                  <motion.div
                    key={socketId}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{   opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-center justify-between px-5 py-3.5 border-b last:border-b-0 ${
                      dark ? 'border-white/[0.04]' : 'border-gray-50'
                    }`}
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-sm font-bold text-white">{initial}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                          {username}
                        </p>
                        <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Waiting to join
                        </p>
                      </div>
                    </div>

                    {/* Admit / Reject buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Admit */}
                      <button
                        onClick={() => onAdmit(socketId)}
                        title="Admit"
                        style={{
                          width: 32, height: 32,
                          borderRadius: 10,
                          border: 'none',
                          background: 'rgba(34,197,94,0.15)',
                          color: '#22c55e',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
                      >
                        <Check style={{ width: 15, height: 15 }} />
                      </button>

                      {/* Reject */}
                      <button
                        onClick={() => onReject(socketId)}
                        title="Remove"
                        style={{
                          width: 32, height: 32,
                          borderRadius: 10,
                          border: 'none',
                          background: 'rgba(239,68,68,0.12)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                      >
                        <UserX style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer: admit all */}
        {waitlist.length > 1 && (
          <div className={`px-5 py-3 border-t ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            <button
              onClick={() => waitlist.forEach(({ socketId }) => onAdmit(socketId))}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(34,197,94,0.25)',
                transition: 'all 0.2s',
              }}
            >
              Admit All ({waitlist.length})
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
