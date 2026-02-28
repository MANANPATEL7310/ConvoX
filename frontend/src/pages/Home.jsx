import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, LogOut, Video, Zap, Shield,
  ArrowRight, Users, Clock, Link as LinkIcon,
  Copy, Check, Sparkles, MonitorPlay, Wifi, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import PageWrapper from '../components/PageWrapper';
import ShareMeetingCard from '../components/ShareMeetingCard';
import ScheduleMeetingCard from '../components/ScheduleMeetingCard';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   QUICK ACTIONS — each becomes a real interactive component
   ═══════════════════════════════════════════════════════════ */
const QUICK_ACTIONS = [
  {
    id: 'new-meeting',
    icon: Video,
    label: 'New Meeting',
    desc: 'Start an instant meeting with a unique room code',
    gradient: 'from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/25',
    ringColor: 'ring-indigo-500/30',
    bgLight: 'bg-indigo-50/80',
    bgDark:  'bg-indigo-500/10',
    accentLight: 'text-indigo-700',
    accentDark: 'text-indigo-300',
  },
  {
    id: 'team-room',
    icon: Users,
    label: 'Team Room',
    desc: 'Create a persistent room and invite your whole team',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/25',
    ringColor: 'ring-emerald-500/30',
    bgLight: 'bg-emerald-50/80',
    bgDark:  'bg-emerald-500/10',
    accentLight: 'text-emerald-700',
    accentDark: 'text-emerald-300',
  },
  {
    id: 'schedule',
    icon: Clock,
    label: 'Schedule',
    desc: 'Plan a future meeting and share the invite link',
    gradient: 'from-orange-500 to-rose-500',
    glow: 'shadow-orange-500/25',
    ringColor: 'ring-orange-500/30',
    bgLight: 'bg-orange-50/80',
    bgDark:  'bg-orange-500/10',
    accentLight: 'text-orange-700',
    accentDark: 'text-orange-300',
  },
  {
    id: 'share-link',
    icon: LinkIcon,
    label: 'Share Link',
    desc: 'Generate a link to share with anyone — no signup needed',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/25',
    ringColor: 'ring-blue-500/30',
    bgLight: 'bg-blue-50/80',
    bgDark:  'bg-blue-500/10',
    accentLight: 'text-blue-700',
    accentDark: 'text-blue-300',
  },
];

/* ── Feature pills for right-side panel ── */
const FEATURES = [
  { icon: Zap,         label: '<80ms latency',
    light: 'bg-yellow-50 border-yellow-200 text-yellow-700',  dark: 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300' },
  { icon: Shield,      label: 'E2E encrypted',
    light: 'bg-emerald-50 border-emerald-200 text-emerald-700', dark: 'bg-emerald-900/20 border-emerald-700/30 text-emerald-300' },
  { icon: Users,       label: 'Up to 100 users',
    light: 'bg-purple-50 border-purple-200 text-purple-700', dark: 'bg-purple-900/20 border-purple-700/30 text-purple-300' },
  { icon: MonitorPlay, label: 'Screen sharing',
    light: 'bg-orange-50 border-orange-200 text-orange-700', dark: 'bg-orange-900/20 border-orange-700/30 text-orange-300' },
  { icon: Video,       label: 'HD video',
    light: 'bg-blue-50 border-blue-200 text-blue-700', dark: 'bg-blue-900/20 border-blue-700/30 text-blue-300' },
];

/* ── Animation helpers ── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ═══════════════════════════════════════════════════════════
   HOME COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  // Share card state: { code, url } when a meeting is generated
  const [shareState, setShareState] = useState(null);
  const [scheduleState, setScheduleState] = useState(null);
  const { user, logout, addToUserHistory } = useAuth();
  const { dark } = useTheme();

  /* ── Join handler ── */
  const handleJoin = useCallback(async () => {
    const code = meetingCode.trim();
    if (!code) { toast.error('Please enter a meeting code'); return; }
    await addToUserHistory(code);
    navigate(`/${code}`);
  }, [meetingCode, addToUserHistory, navigate]);

  const handleKey = e => { if (e.key === 'Enter') handleJoin(); };

  /* ── Quick-action handlers ── */
  const generateRoomCode = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    ).join('-');
  };

  const APP_URL = window.location.origin;

  const handleQuickAction = useCallback(async (id) => {
    switch (id) {
      case 'new-meeting': {
        const code = generateRoomCode();
        // Don't add to history yet — only when user clicks "Join Meeting"
        setShareState({ code, url: `${APP_URL}/${code}` });
        break;
      }
      case 'team-room': {
        const code = `team-${generateRoomCode()}`;
        setShareState({ code, url: `${APP_URL}/${code}` });
        break;
      }
      case 'schedule': {
        const code = generateRoomCode();
        setScheduleState({ code, url: `${APP_URL}/${code}` });
        break;
      }
      case 'share-link': {
        const code = generateRoomCode();
        setShareState({ code, url: `${APP_URL}/${code}` });
        break;
      }
      default: break;
    }
  }, []);

  return (
    <PageWrapper>

      {/* ══════════ NAV ══════════ */}
      <nav className={`relative z-20 backdrop-blur-xl border-b sticky top-0 transition-colors duration-300 ${
        dark ? 'bg-gray-950/70 border-white/[0.06]' : 'bg-white/60 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5"
            >
              {/* Animated logo dot */}
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Video className="w-4 h-4 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-950 animate-pulse" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent select-none tracking-tight">
                ConvoX
              </span>
            </motion.div>

            {/* Nav right */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Button variant="ghost" onClick={() => navigate('/history')}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 h-9 rounded-lg ${
                  dark ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/80'
                }`}>
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button onClick={() => { logout(); navigate('/auth'); }}
                className={`flex items-center gap-1.5 text-sm rounded-lg font-medium px-3 h-9 border transition-all ${
                  dark
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200/60'
                }`}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        <motion.div
          variants={container} initial="hidden" animate="show"
          className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-center min-h-[calc(100vh-8rem)]"
        >

          {/* ─── LEFT COLUMN (3/5) ─── */}
          <div className="lg:col-span-3 flex flex-col gap-8">

            {/* User greeting */}
            {user && (
              <motion.div variants={fadeUp}
                className={`self-start inline-flex items-center gap-2.5 border rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md ${
                  dark
                    ? 'bg-indigo-500/[0.08] border-indigo-500/20 text-indigo-300'
                    : 'bg-indigo-50/80 border-indigo-200/60 text-indigo-700'
                }`}
              >
                {/* Animated avatar circle */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white uppercase shadow-sm">
                  {user.username?.charAt(0) || 'U'}
                </div>
                Welcome back, <span className="font-bold">{user.username}</span>
              </motion.div>
            )}

            {/* Headline */}
            <motion.div variants={fadeUp} className="flex flex-col gap-4">
              <h1 className={`text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.08] ${
                dark ? 'text-white' : 'text-gray-900'
              }`}>
                Start your next
                <br />
                <span className="shimmer-text">video meeting</span>
              </h1>
              <p className={`text-base sm:text-lg max-w-lg leading-relaxed ${
                dark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Connect with anyone, anywhere — crystal-clear video, real-time chat, and screen sharing. All in your browser.
              </p>
            </motion.div>

            {/* ── Join Meeting Card ── */}
            <motion.div variants={fadeUp}
              className={`rounded-2xl p-6 sm:p-8 max-w-xl transition-all ${
                dark ? 'dark-glass' : 'glass-card'
              }`}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                <h3 className={`text-sm font-semibold uppercase tracking-widest ${
                  dark ? 'text-gray-400' : 'text-gray-500'
                }`}>Join a Meeting</h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    value={meetingCode}
                    onChange={e => setMeetingCode(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Enter meeting code…"
                    className={`h-12 text-base rounded-xl transition-all ${
                      dark
                        ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20'
                        : 'bg-white border-gray-200/80 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200'
                    }`}
                  />
                </div>
                <Button onClick={handleJoin} size="lg"
                  className="h-12 px-8 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all rounded-xl whitespace-nowrap">
                  Join Now <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            {/* ── Quick Actions Grid ── */}
            <motion.div variants={fadeUp} className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className={`w-4 h-4 ${dark ? 'text-purple-400' : 'text-purple-500'}`} />
                <p className={`text-xs uppercase tracking-[0.2em] font-semibold ${
                  dark ? 'text-gray-500' : 'text-gray-400'
                }`}>Quick Actions</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button
                    key={action.id}
                    variants={fadeUp}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuickAction(action.id)}
                    className={`group relative flex flex-col gap-4 p-5 rounded-2xl border text-left transition-all overflow-hidden
                      ${dark
                        ? `${action.bgDark} border-white/[0.06] hover:border-white/[0.12]`
                        : `${action.bgLight} border-gray-200/50 hover:border-gray-300/80`
                      }
                      hover:shadow-xl hover:${action.glow}
                    `}
                  >
                    {/* Hover gradient overlay */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />

                    {/* Icon */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg ${action.glow} group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <ArrowRight className={`w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300 ${dark ? 'text-white' : 'text-gray-400'}`} />
                    </div>

                    {/* Label & description */}
                    <div className="relative z-10 flex flex-col gap-1">
                      <span className={`text-sm font-bold tracking-tight ${dark ? action.accentDark : action.accentLight}`}>
                        {action.id === 'share-link' && linkCopied ? (
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                          </span>
                        ) : action.label}
                      </span>
                      <span className={`text-[11px] leading-snug ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {action.desc}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN (2/5) ─── */}
          <motion.div variants={fadeUp} className="lg:col-span-2 hidden lg:flex lg:items-center lg:justify-center">
            <div className="w-full">
              {/* Accent border frame */}
              <div className="relative">
                <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-indigo-500/60 via-purple-500/40 to-pink-500/60 animate-gradient-x" style={{ backgroundSize: '200% 200%' }} />
                <div className={`absolute -inset-[1px] rounded-[calc(1.5rem-1px)] ${dark ? 'bg-gray-950' : 'bg-white'}`} />

                <div className={`relative rounded-3xl p-8 overflow-hidden ${dark ? 'dark-glass' : 'glass-card'}`}>
                  {/* Decorative blobs */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-400 rounded-full opacity-10 -mr-20 -mt-20 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400 rounded-full opacity-10 -ml-16 -mb-16 blur-3xl" />

                  {/* Grid overlay */}
                  <div className="absolute inset-0 rounded-3xl" style={{
                    backgroundImage: dark
                      ? 'linear-gradient(rgba(139,92,246,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.06) 1px,transparent 1px)'
                      : 'linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />

                  <div className="relative z-10 flex flex-col items-center gap-6 text-center">

                    {/* Live badge */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${
                        dark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE NOW
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full border ${
                        dark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      }`}>
                        <Globe className="w-3 h-3" /> Global Network
                      </span>
                    </div>

                    {/* Animated video call icon with signal rings */}
                    <div className="relative">
                      {/* Pulse rings */}
                      <motion.div
                        animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/40 to-purple-600/40"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.35], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30"
                      />
                      <motion.div
                        animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.05, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 rotate-3">
                          <Video className="w-10 h-10 text-white -rotate-3" />
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h3 className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                        Crystal-Clear Calling
                      </h3>
                      <p className={`text-sm max-w-xs mx-auto leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                        HD video, AI noise suppression &amp; adaptive streaming. Built for teams that move fast.
                      </p>
                    </div>

                    {/* Animated signal / quality bars */}
                    <div className={`w-full rounded-xl px-4 py-3 border ${
                      dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50/80 border-gray-100'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                          dark ? 'text-gray-500' : 'text-gray-400'
                        }`}><Wifi className="inline w-3 h-3 mr-1" />Signal Quality</span>
                        <span className="text-[11px] font-bold text-emerald-500">Excellent</span>
                      </div>
                      <div className="flex items-end gap-1 h-8 justify-center">
                        {[40, 60, 75, 90, 100, 90, 75, 55, 80, 95, 100, 85].map((h, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500 to-purple-500 opacity-80"
                            animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.6}%`, `${h}%`] }}
                            transition={{ duration: 1.5 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 }}
                            style={{ minHeight: '4px' }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {FEATURES.map((f, i) => (
                        <motion.span
                          key={f.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.08 }}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${dark ? f.dark : f.light}`}
                        >
                          <f.icon className="w-3 h-3" />{f.label}
                        </motion.span>
                      ))}
                    </div>

                    {/* Live stats bar */}
                    <div className={`w-full pt-5 border-t ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 'HD',   label: 'Video',     from: 'from-indigo-500', to: 'to-purple-500' },
                          { value: '24/7', label: 'Available', from: 'from-emerald-500', to: 'to-teal-500' },
                          { value: 'Free', label: 'Forever',   from: 'from-orange-500', to: 'to-rose-500' },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className={`text-2xl font-black bg-gradient-to-r ${s.from} ${s.to} bg-clip-text text-transparent`}>{s.value}</div>
                            <div className={`text-[10px] font-semibold uppercase tracking-widest mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA button */}
                    <Button onClick={() => handleQuickAction('new-meeting')} size="lg"
                      className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all">
                      <Video className="mr-2 w-4 h-4" /> Start HD Meeting
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* ── Share Meeting Card overlay ── */}
      {shareState && (
        <ShareMeetingCard
          meetingUrl={shareState.url}
          senderName={user?.username || 'Someone'}
          onClose={() => setShareState(null)}
          showJoinBtn={true}
          onJoin={async () => {
            await addToUserHistory(shareState.code);
            navigate(`/${shareState.code}`);
          }}
        />
      )}

      {/* ── Schedule Meeting Card overlay ── */}
      {scheduleState && (
        <ScheduleMeetingCard
          meetingUrl={scheduleState.url}
          meetingCode={scheduleState.code}
          senderName={user?.username || 'Someone'}
          onClose={() => setScheduleState(null)}
          onScheduled={() => setScheduleState(null)}
        />
      )}
    </PageWrapper>
  );
}
