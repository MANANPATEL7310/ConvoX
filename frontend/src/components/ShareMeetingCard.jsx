import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Send, X, Mail, Link as LinkIcon, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { useSendMeetingInvitesMutation } from '../hooks/api/useMeetings';

/**
 * ShareMeetingCard — Premium meeting share modal
 *
 * Props:
 *   meetingUrl   — full meeting URL to share
 *   senderName   — current user's display name
 *   onClose      — callback to dismiss the card
 *   onJoin       — (optional) callback when user clicks "Join Meeting" (only for host on Home page)
 *   showJoinBtn  — whether to show a "Join Meeting" CTA
 */
export default function ShareMeetingCard({ meetingUrl, senderName, onClose, onJoin, showJoinBtn = false }) {
  const { dark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState([]);
  
  const sendInvitesMutation = useSendMeetingInvitesMutation();
  const sending = sendInvitesMutation.isPending;

  /* ── Copy URL ── */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      toast.success('Meeting link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy — try manually.');
    }
  }, [meetingUrl]);

  /* ── Add email chip ── */
  const addEmail = useCallback(() => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (emails.includes(trimmed)) {
      toast.error('Email already added');
      return;
    }

    setEmails(prev => [...prev, trimmed]);
    setEmailInput('');
  }, [emailInput, emails]);

  const handleEmailKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  };

  const removeEmail = (email) => {
    setEmails(prev => prev.filter(e => e !== email));
  };

  /* ── Send invites ── */
  const handleSendInvites = useCallback(async () => {
    if (emails.length === 0) {
      toast.error('Add at least one email address');
      return;
    }

    try {
      const data = await sendInvitesMutation.mutateAsync({
        meetingUrl,
        emails,
        senderName,
      });

      const sent = data.results?.filter(r => r.status === 'sent').length || 0;
      const failed = data.results?.filter(r => r.status === 'failed').length || 0;

      if (sent > 0) toast.success(`${sent} invite${sent > 1 ? 's' : ''} sent!`);
      if (failed > 0) toast.error(`${failed} email${failed > 1 ? 's' : ''} failed.`);

      // Clear only the sent ones
      const failedEmails = data.results?.filter(r => r.status === 'failed').map(r => r.email) || [];
      setEmails(failedEmails);
    } catch (err) {
      console.error('Send invite error:', err);
      toast.error('Failed to send invites. Check SMTP configuration.');
    }
  }, [emails, meetingUrl, senderName, sendInvitesMutation]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl border overflow-hidden ${
            dark
              ? 'bg-gray-900 border-white/[0.08] shadow-black/50'
              : 'bg-white border-gray-200/60 shadow-gray-300/30'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Close / Cancel button — Max visibility */}
          <button
            onClick={onClose}
            title="Cancel"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              height: 36,
              padding: '0 16px',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              zIndex: 50,
              border: dark ? '1px solid #4b5563' : '1px solid #e5e7eb',
              background: dark ? '#1f2937' : '#ffffff',
              color: dark ? '#f9fafb' : '#111827',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? '#374151' : '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = dark ? '#1f2937' : '#ffffff'}
          >
            <X style={{ width: 16, height: 16, stroke: dark ? '#f9fafb' : '#111827' }} />
            Cancel
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                Share Meeting
              </h2>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                Invite others via link or email
              </p>
            </div>
          </div>

          {/* ── Section 1: Copy URL ── */}
          <div className={`rounded-xl p-4 border mb-5 ${
            dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50/80 border-gray-100'
          }`}>
            <p className={`text-[11px] uppercase tracking-widest font-semibold mb-2.5 flex items-center gap-1.5 ${
              dark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <LinkIcon className="w-3 h-3" /> Meeting Link
            </p>
            <div className="flex gap-2">
              <div className={`flex-1 text-sm font-mono px-3 py-2.5 rounded-lg border truncate select-all ${
                dark
                  ? 'bg-gray-800 border-gray-700 text-indigo-300'
                  : 'bg-white border-gray-200 text-indigo-600'
              }`}>
                {meetingUrl}
              </div>
              <Button
                onClick={handleCopy}
                className={`px-4 h-[42px] rounded-lg font-semibold text-sm transition-all ${
                  copied
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                }`}
              >
                {copied ? <><Check className="w-4 h-4 mr-1" /> Copied</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
              </Button>
            </div>
          </div>

          {/* ── Section 2: Email invites ── */}
          <div className={`rounded-xl p-4 border ${
            dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50/80 border-gray-100'
          }`}>
            <p className={`text-[11px] uppercase tracking-widest font-semibold mb-2.5 flex items-center gap-1.5 ${
              dark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <Mail className="w-3 h-3" /> Email Invites
            </p>

            {/* Email chips */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {emails.map(email => (
                  <span
                    key={email}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      dark
                        ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className={`ml-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        dark ? 'hover:bg-white/20' : 'hover:bg-indigo-200'
                      }`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Email input */}
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKey}
                placeholder="Enter email address…"
                type="email"
                className={`h-10 text-sm rounded-lg ${
                  dark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                    : 'bg-white border-gray-200'
                }`}
              />
              <Button onClick={addEmail} variant="outline"
                className={`h-10 px-3 rounded-lg text-sm font-medium ${
                  dark
                    ? 'border-gray-700 text-gray-300 hover:bg-white/[0.06]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Add
              </Button>
            </div>

            <p className={`text-[10px] mt-2 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
              Press Enter or comma to add. We'll send a branded invite email to each recipient.
            </p>

            {/* Send button */}
            {emails.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <Button
                  onClick={handleSendInvites}
                  disabled={sending}
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all disabled:opacity-60"
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send {emails.length} Invite{emails.length > 1 ? 's' : ''}</>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* ── Join button (shown on Home page after generating code) ── */}
          {showJoinBtn && onJoin && (
            <Button
              onClick={onJoin}
              size="lg"
              className="w-full h-12 mt-5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Join Meeting <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
