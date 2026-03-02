import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingHistoryQuery } from '../hooks/api/useMeetings';
import { motion } from 'framer-motion';
import { Home, Video, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import PageWrapper from '../components/PageWrapper';
import UserDropdown from '../components/UserDropdown';

/* ─── animation variants ─── */
const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

/* ─── formatDate helper ─── */
const formatDate = dateStr => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

export default function History() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  
  const { data: meetingsRes } = useMeetingHistoryQuery();
  const meetings = Array.isArray(meetingsRes) ? meetingsRes : [];

  const [weekAgo] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const thisWeekCount = useMemo(
    () => meetings.filter(m => new Date(m.date) > weekAgo).length,
    [meetings, weekAgo],
  );

  /* ── shared theme helpers (same tokens as LandingPage / Home) ── */
  const heading  = dark ? 'text-white'    : 'text-gray-900';
  const body     = dark ? 'text-gray-400' : 'text-gray-500';
  const muted    = dark ? 'text-gray-500' : 'text-gray-400';
  const card     = dark ? 'dark-glass'    : 'glass-card';
  const border   = dark ? 'border-white/10' : 'border-gray-100';
  const navText  = dark ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50';

  return (
    <PageWrapper>

      {/* ════════════ NAV ════════════ */}
      <nav className={`relative z-10 backdrop-blur-md border-b sticky top-0 transition-colors duration-300 ${
        dark ? 'bg-gray-900/80 border-white/10' : 'bg-white/70 border-gray-200/60'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo / title */}
            <motion.span
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none"
            >
              ConvoX
            </motion.span>

            {/* Nav actions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              {/* Centralized theme toggle */}
              <ThemeToggle />

              <Button variant="ghost" onClick={() => navigate('/home')}
                className={`flex items-center gap-2 font-medium ${navText}`}>
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <UserDropdown />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ════════════ MAIN ════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {meetings.length === 0 ? (
          /* ── Empty state ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 max-w-sm mx-auto flex flex-col items-center gap-6"
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 ${
              dark ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-100'
            }`}>
              <Video className={`w-10 h-10 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className={`text-2xl font-black ${heading}`}>No meetings yet</h3>
              <p className={`${body} text-base leading-relaxed`}>
                You haven't joined any meetings. Start your first video call!
              </p>
            </div>
            <Button size="lg" onClick={() => navigate('/home')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:scale-105 transition-all px-8 rounded-xl">
              Start a Meeting <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-10">

            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 flex flex-col gap-2">
              <h1 className={`text-4xl sm:text-5xl font-black ${heading}`}>Meeting History</h1>
              <p className={body}>View and rejoin your past video calls</p>
            </motion.div>

            {/* Meeting cards grid */}
            <motion.div variants={container} initial="hidden" animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((meeting, idx) => (
                <motion.div key={idx} variants={item}>
                  <div
                    onClick={() => navigate(`/${meeting.meetingCode}`)}
                    className={`${card} rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border ${border}`}
                  >
                    {/* Accent bar */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 w-full" />

                    <div className="p-6 flex flex-col gap-4">
                      {/* Card header */}
                      <div className="flex items-center justify-between">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                          dark ? 'bg-indigo-900/40 group-hover:bg-indigo-900/60' : 'bg-indigo-50 group-hover:bg-indigo-100'
                        }`}>
                          <Video className={`w-5 h-5 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <Badge className={`text-[10px] uppercase tracking-wider font-semibold border px-2.5 py-1 ${
                          dark ? 'bg-gray-800/60 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}>
                          Meeting #{idx + 1}
                        </Badge>
                      </div>

                      {/* Meeting code */}
                      <div className="flex flex-col gap-0.5">
                        <p className={`text-[10px] uppercase font-semibold tracking-widest flex items-center gap-1 ${muted}`}>
                          <Video className="w-3 h-3" /> Code
                        </p>
                        <p className={`text-xl font-black truncate group-hover:text-indigo-500 transition-colors ${heading}`}>
                          {meeting.meetingCode}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="flex flex-col gap-0.5">
                        <p className={`text-[10px] uppercase font-semibold tracking-widest flex items-center gap-1 ${muted}`}>
                          <Calendar className="w-3 h-3" /> Date
                        </p>
                        <p className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatDate(meeting.date)}
                        </p>
                      </div>

                      {/* Rejoin CTA */}
                      <div className={`pt-4 border-t flex items-center justify-center gap-2 font-semibold text-sm transition-all group-hover:gap-3 ${border} ${
                        dark ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-indigo-600 group-hover:text-indigo-700'
                      }`}>
                        <span>Rejoin Meeting</span>
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Summary stats card */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className={`${card} rounded-2xl border ${border} overflow-hidden`}>
                {/* Stats top accent */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1 w-full" />
                <div className="p-8">
                  <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${heading}`}>
                    <Clock className={`w-5 h-5 ${muted}`} /> Meeting Summary
                  </h3>
                  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x ${
                    dark ? 'divide-white/10' : 'divide-gray-100'
                  }`}>
                    {[
                      { value: meetings.length, label: 'Total Meetings', color: 'text-indigo-500' },
                      { value: thisWeekCount,   label: 'This Week',      color: 'text-emerald-500' },
                      { value: meetings.length > 0 ? 'Active' : 'None', label: 'Status', color: 'text-purple-500' },
                    ].map(s => (
                      <div key={s.label} className="text-center pt-4 sm:pt-0">
                        <div className={`text-4xl font-black mb-1 ${s.color}`}>{s.value}</div>
                        <div className={`text-xs uppercase tracking-wide font-medium ${muted}`}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </PageWrapper>
  );
}
