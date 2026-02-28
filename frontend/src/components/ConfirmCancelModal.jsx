import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';

export default function ConfirmCancelModal({ open, meetingTitle, onConfirm, onClose, loading }) {
  const { dark } = useTheme();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border ${
            dark
              ? 'bg-gray-900 border-white/[0.08] shadow-black/60'
              : 'bg-white border-gray-200/60 shadow-gray-400/20'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            title="Close"
            className={`absolute right-4 top-4 h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1 ${
              dark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Cancel meeting?</h2>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                This will notify invited participants.
              </p>
            </div>
          </div>

          <p className={`text-sm mb-4 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
            Are you sure you want to cancel
            <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}> {meetingTitle || 'this meeting'} </span>?
          </p>

          <div className="mb-5">
            <label className={`text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Reason for cancellation (optional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={280}
              placeholder="Add a short reason to include in the email..."
              className={`mt-2 w-full min-h-[90px] rounded-xl border px-3 py-2 text-sm outline-none transition-all ${
                dark
                  ? 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-rose-400'
                  : 'bg-white border-gray-200 text-gray-700 placeholder:text-gray-400 focus:border-rose-300'
              }`}
            />
            <p className={`text-[11px] mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              {reason.trim().length}/280 characters
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="secondary"
              className={`flex-1 h-10 rounded-xl text-sm font-semibold ${
                dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Keep Meeting
            </Button>
            <Button
              onClick={() => onConfirm(reason.trim())}
              disabled={loading}
              className="flex-1 h-10 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {loading ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
