import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  History, LogOut, Video, Zap, Shield,
  ArrowRight, Users, Clock, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

/* ─── Quick-action cards below the join form ─── */
const QUICK_ACTIONS = [
  { icon: Video,    label: 'New Meeting',  desc: 'Start instantly',   gradient: 'from-indigo-500 to-purple-600' },
  { icon: Users,    label: 'Team Room',    desc: 'Invite your team',  gradient: 'from-emerald-500 to-teal-600'  },
  { icon: Clock,    label: 'Schedule',     desc: 'Plan ahead',        gradient: 'from-orange-500 to-rose-500'   },
  { icon: LinkIcon, label: 'Share Link',   desc: 'Copy & send',       gradient: 'from-blue-500 to-cyan-500'     },
];

/* ─── Right-panel stats ─── */
const STATS = [
  { value: 'HD',   label: 'Quality',   color: 'text-indigo-600' },
  { value: '24/7', label: 'Available', color: 'text-purple-600' },
  { value: 'Free', label: 'Forever',   color: 'text-emerald-600'},
];

export default function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const { user, logout, addToUserHistory } = useAuth();
  const { dark } = useTheme();

  const handleJoin = async () => {
    const code = meetingCode.trim();
    if (!code) { toast.error('Please enter a meeting code'); return; }
    await addToUserHistory(code);
    navigate(`/${code}`);
  };

  const handleKey = e => { if (e.key === 'Enter') handleJoin(); };

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
      dark ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>

      {/* ── Decorative blobs ── */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob animation-delay-2000" />

      {/* ── Chess-box grid (same as landing page) ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: dark
          ? `linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px),
             linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)`
          : `linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),
             linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* ── Frosted-glass overlay ── */}
      <div className={`pointer-events-none absolute inset-0 backdrop-blur-[1px] ${
        dark ? 'bg-gray-950/30' : 'bg-white/20'
      }`} />

      {/* ══════════ NAV ══════════ */}
      <nav className={`relative z-10 backdrop-blur-md border-b sticky top-0 transition-colors duration-300 ${
        dark ? 'bg-gray-900/80 border-white/10' : 'bg-white/70 border-gray-200/60'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <motion.span
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none"
            >
              ConvoX
            </motion.span>

            {/* Nav right */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/history')}
                className={`flex items-center gap-2 font-medium ${
                  dark ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}>
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </Button>

              <Button onClick={() => { logout(); navigate('/auth'); }}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm rounded-lg font-medium">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">

          {/* ─── LEFT COLUMN ─── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-8"
          >
            {/* User greeting badge */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="self-start inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-indigo-600" />
                </span>
                Welcome back, <span className="font-bold">{user.username}</span>
              </motion.div>
            )}

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex flex-col gap-3"
            >
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-[1.1]">
                Start your next<br />
                <span className="shimmer-text">video meeting</span>
              </h1>
              <p className="text-lg text-gray-500 max-w-md leading-relaxed">
                Enter a code to join instantly, or create a new room and invite your team — all in seconds.
              </p>
            </motion.div>

            {/* ── Join card ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card rounded-2xl p-6 sm:p-8 max-w-lg shadow-xl"
            >
              <h3 className="text-base font-semibold text-gray-500 uppercase tracking-widest mb-5">Join a Meeting</h3>

              <div className="flex flex-col gap-3">
                <Input
                  value={meetingCode}
                  onChange={e => setMeetingCode(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Enter meeting code…"
                  className={`h-13 text-base rounded-xl shadow-sm ${
                    dark ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 focus:border-indigo-500'
                  }`}
                />
                <Button onClick={handleJoin} size="lg"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all rounded-xl">
                  Join Now <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              {/* Divider */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-4">Quick Actions</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {QUICK_ACTIONS.map((a, i) => (
                    <motion.button
                      key={a.label}
                      whileHover={{ y: -3, scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border group transition-all ${
                        dark
                          ? 'bg-gray-800/60 border-white/10 hover:border-indigo-500/40 hover:bg-gray-700/60'
                          : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                        <a.icon className="w-4.5 h-4.5 text-white" style={{ width: '1.1rem', height: '1.1rem' }} />
                      </div>
                      <div className="text-center">
                        <div className={`text-xs font-semibold leading-tight ${
                          dark ? 'text-gray-200' : 'text-gray-800'
                        }`}>{a.label}</div>
                        <div className={`text-[10px] leading-tight ${
                          dark ? 'text-gray-500' : 'text-gray-400'
                        }`}>{a.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ─── RIGHT COLUMN ─── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex flex-col gap-6"
          >
            {/* Feature showcase panel */}
            <div className="relative">
              {/* Accent frame matching landing page video card style */}
              <div className="absolute -inset-[3px] rounded-3xl bg-gradient-to-br from-orange-400 via-rose-400 to-indigo-500 animate-gradient-x" style={{ backgroundSize: '200% 200%' }} />
              <div className={`absolute -inset-[1px] rounded-[calc(1.5rem-2px)] ${dark ? 'bg-gray-950' : 'bg-white'}`} />

              <div className={`relative rounded-3xl p-8 sm:p-10 overflow-hidden ${dark ? 'dark-glass' : 'glass-card'}`}>
                {/* Inner decorative blobs */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-200 rounded-full opacity-20 -mr-16 -mt-16 blur-2xl animate-blob" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200 rounded-full opacity-20 -ml-14 -mb-14 blur-2xl animate-blob animation-delay-2000" />

                {/* Inner chess-box grid */}
                <div className="absolute inset-0 rounded-3xl" style={{
                  backgroundImage: dark
                    ? `linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px)`
                    : `linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }} />

                <div className="relative z-10 flex flex-col items-center gap-8 text-center">
                  {/* Animated video icon */}
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl"
                  >
                    <Video className="w-12 h-12 text-white" />
                  </motion.div>

                  <div className="flex flex-col gap-2">
                    <h3 className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Start Video Calling</h3>
                    <p className={`text-base max-w-xs mx-auto leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Enter a meeting code or create your own room to connect instantly.
                    </p>
                  </div>

                  {/* Feature pills */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { icon: Zap,    label: '<80ms latency',   lightBg: 'bg-yellow-50 border-yellow-200 text-yellow-700',  darkBg: 'bg-yellow-900/30 border-yellow-700/40 text-yellow-300' },
                      { icon: Shield, label: 'E2E encrypted',   lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-700', darkBg: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-300' },
                      { icon: Users,  label: 'Unlimited users', lightBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',  darkBg: 'bg-indigo-900/30 border-indigo-700/40 text-indigo-300' },
                    ].map(p => (
                      <span key={p.label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${dark ? p.darkBg : p.lightBg}`}>
                        <p.icon className="w-3 h-3" />{p.label}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className={`grid grid-cols-3 gap-4 w-full pt-6 border-t ${dark ? 'border-white/10' : 'border-gray-100'}`}>
                    {STATS.map(s => (
                      <div key={s.label} className="text-center">
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <div className={`text-xs font-medium uppercase tracking-wide mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
