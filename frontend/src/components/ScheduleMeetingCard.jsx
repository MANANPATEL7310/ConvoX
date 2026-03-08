import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X, Mail, CalendarClock, Users, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { useCreateScheduledMeetingMutation, useUpdateScheduledMeetingMutation } from '../hooks/api/useMeetings';

const IST_OFFSET_MINUTES = 330;

const pad = (value) => String(value).padStart(2, '0');

const formatIstInput = (date = new Date()) => {
  const utcMs = date.getTime();
  const istMs = utcMs + IST_OFFSET_MINUTES * 60000;
  const ist = new Date(istMs);
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
};

const parseIstInputToUtc = (value) => {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  if ([year, month, day, hour, minute].some(Number.isNaN)) return null;
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60000;
  return new Date(utcMs);
};

export default function ScheduleMeetingCard({
  meetingUrl,
  meetingCode,
  senderName,
  hostEmailDefault,
  mode = 'create',
  meetingId,
  initialTitle,
  initialScheduledFor,
  initialAttendees,
  onClose,
  onScheduled,
}) {
  const { dark } = useTheme();
  const [copied, setCopied] = useState(false);
  
  const createMeetingMutation = useCreateScheduledMeetingMutation();
  const updateMeetingMutation = useUpdateScheduledMeetingMutation();
  const sending = createMeetingMutation.isPending || updateMeetingMutation.isPending;

  const [title, setTitle] = useState(() => {
    if (initialTitle) return initialTitle;
    return senderName ? `${senderName}'s meeting` : '';
  });
  const [hostEmail, setHostEmail] = useState(hostEmailDefault || '');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState(() => initialAttendees || []);

  const timezone = 'IST (Asia/Kolkata)';

  const [scheduledFor, setScheduledFor] = useState(() => {
    if (initialScheduledFor) {
      return formatIstInput(new Date(initialScheduledFor));
    }
    const defaultDate = new Date(Date.now() + 30 * 60 * 1000);
    return formatIstInput(defaultDate);
  });

  const minDateTime = useMemo(() => formatIstInput(new Date()), []);

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

  const handleSchedule = useCallback(async () => {
    if (!scheduledFor) {
      toast.error('Choose a date and time');
      return;
    }

    const parsedDate = parseIstInputToUtc(scheduledFor);
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      toast.error('Please enter a valid date and time');
      return;
    }

    if (parsedDate <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!hostEmail.trim() || !emailRegex.test(hostEmail.trim())) {
      toast.error('Enter a valid host email for reminders');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        scheduledFor: parsedDate.toISOString(),
        timezone: 'Asia/Kolkata',
        hostEmail: hostEmail.trim(),
        attendees: emails,
      };

      if (mode === 'edit' && meetingId) {
        const data = await updateMeetingMutation.mutateAsync({ id: meetingId, payload });
        toast.success('Meeting updated.');
        onScheduled?.(data.meeting);
      } else {
        const createPayload = { ...payload, meetingCode, meetingUrl };
        const data = await createMeetingMutation.mutateAsync(createPayload);
        toast.success('Meeting scheduled. Reminders will be sent by email.');
        // React Query invalidates caching natively, we retain onScheduled to close UX seamlessly
        onScheduled?.(data.meeting);
      }

      onClose();
    } catch (err) {
      console.error('Schedule meeting error:', err);
      toast.error('Failed to schedule meeting. Please try again.');
    }
  }, [scheduledFor, hostEmail, title, meetingCode, meetingUrl, timezone, emails, onScheduled, onClose, mode, meetingId, updateMeetingMutation, createMeetingMutation]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

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
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500" />

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

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <CalendarClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                Schedule Meeting
              </h2>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                Set the time and send reminders
              </p>
            </div>
          </div>

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
                  ? 'bg-gray-800 border-gray-700 text-orange-300'
                  : 'bg-white border-gray-200 text-orange-600'
              }`}>
                {meetingUrl}
              </div>
              <Button
                onClick={handleCopy}
                className={`px-4 h-[42px] rounded-lg font-semibold text-sm transition-all ${
                  copied
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white shadow-lg shadow-orange-500/20'
                }`}
              >
                {copied ? <><Check className="w-4 h-4 mr-1" /> Copied</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
              </Button>
            </div>
          </div>

          <div className={`rounded-xl p-4 border mb-5 ${
            dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50/80 border-gray-100'
          }`}>
            <p className={`text-[11px] uppercase tracking-widest font-semibold mb-2.5 flex items-center gap-1.5 ${
              dark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <CalendarClock className="w-3 h-3" /> Meeting Details
            </p>

            <div className="space-y-3">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Meeting title (optional)"
                className={dark ? 'bg-gray-900 border-gray-700 text-white' : ''}
              />

              <div>
                <label className={`text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Date and time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  min={minDateTime}
                  onChange={e => setScheduledFor(e.target.value)}
                  className={dark ? 'bg-gray-900 border-gray-700 text-white' : ''}
                />
                <p className={`text-[11px] mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Time zone: {timezone}. All reminders follow IST.
                </p>
                <p className={`text-[11px] mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Early joiners will wait in the waiting room until you admit them.
                </p>
              </div>

              <div>
                <label className={`text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Host email (required for reminders)
                </label>
                <Input
                  type="email"
                  value={hostEmail}
                  onChange={e => setHostEmail(e.target.value)}
                  placeholder="host@email.com"
                  className={dark ? 'bg-gray-900 border-gray-700 text-white' : ''}
                />
                <p className={`text-[10px] mt-1 ${dark ? 'text-orange-400/80' : 'text-orange-600/80'}`}>
                  Host and attendees should check their Spam/Junk folder for reminders.
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${
            dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50/80 border-gray-100'
          }`}>
            <p className={`text-[11px] uppercase tracking-widest font-semibold mb-2.5 flex items-center gap-1.5 ${
              dark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <Users className="w-3 h-3" /> Attendees (optional)
            </p>

            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {emails.map(email => (
                  <span
                    key={email}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      dark
                        ? 'bg-orange-500/15 border-orange-500/25 text-orange-300'
                        : 'bg-orange-50 border-orange-200 text-orange-700'
                    }`}
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className={`ml-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        dark ? 'hover:bg-white/20' : 'hover:bg-orange-200'
                      }`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKey}
                  placeholder="Add attendee email"
                  className={dark ? 'bg-gray-900 border-gray-700 text-white' : ''}
                />
              </div>
              <Button
                onClick={addEmail}
                variant="secondary"
                className={`px-4 h-[42px] rounded-lg font-semibold text-sm ${
                  dark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Mail className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSchedule}
              disabled={sending}
              className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {mode === 'edit' ? 'Saving...' : 'Scheduling...'}</>
              ) : (
                mode === 'edit' ? 'Save Changes' : 'Schedule Meeting'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
