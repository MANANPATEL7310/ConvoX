import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Video, Shield, Zap, Users, Globe, Star,
  ArrowRight, Check, ChevronDown, Play, MonitorPlay,
  Sun, Moon, Mic, MicOff, VideoOff, ScreenShare,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Video, title: 'Crystal Clear HD',
    desc: 'Adaptive 4K video that adjusts to your connection — always sharp, always smooth.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Shield, title: 'End-to-End Encrypted',
    desc: 'Military-grade encryption protects every call, message, and file you share.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Zap, title: 'Ultra-Low Latency',
    desc: 'WebRTC peer-to-peer keeps your voice under 80 ms — no buffering, no delays.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users, title: 'Multi-Party Calling',
    desc: 'Invite unlimited participants and manage video/audio per user in real time.',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    icon: Globe, title: 'Works Everywhere',
    desc: 'No plugin, no install. Runs perfectly on every modern browser and device.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: MonitorPlay, title: 'Screen Sharing',
    desc: 'Share your screen, window, or a browser tab in one click with zero lag.',
    gradient: 'from-rose-500 to-red-600',
  },
];

const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<80ms', label: 'Latency' },
  { value: 'Free', label: 'Always' },
];

const TESTIMONIALS = [
  {
    name: 'Anya Sharma', role: 'Product Designer', stars: 5,
    text: 'ConvoX replaced Zoom for our entire studio. The call quality and screen sharing are unbelievably smooth.',
  },
  {
    name: 'Rahul Menon', role: 'Software Engineer', stars: 5,
    text: "The WebRTC performance is insane — I've demoed code with zero lag. Best free alternative out there.",
  },
  {
    name: 'Priya Nair', role: 'Marketing Lead', stars: 5,
    text: 'No account needed for guests, the interface is clean, and it just works. Highly recommend.',
  },
];

/* ── Cinematic Video Animation Data ── */
const CALL_STEPS = [
  { label: 'Connecting…', icon: Video, color: 'from-indigo-600 to-purple-700', status: 'Establishing connection' },
  { label: 'Connected ✓', icon: Users, color: 'from-emerald-600 to-teal-700', status: 'Secure channel active' },
  { label: 'Screen Share', icon: ScreenShare, color: 'from-blue-600 to-indigo-700', status: 'Display streaming' },
  { label: 'Recording',  icon: Mic,  color: 'from-rose-600 to-pink-700',  status: 'Audio captured' },
];

const PARTICIPANTS = [
  { name: 'Alex K.', initial: 'A', bg: 'from-indigo-500 to-blue-600',   muted: false, videoOff: false },
  { name: 'Priya S.', initial: 'P', bg: 'from-purple-500 to-pink-600',  muted: true,  videoOff: false },
  { name: 'Raj M.',   initial: 'R', bg: 'from-teal-500 to-emerald-600', muted: false, videoOff: true  },
  { name: 'Sara L.',  initial: 'S', bg: 'from-rose-500 to-orange-500',  muted: true,  videoOff: false },
];

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

/** Dark / light toggle button */
function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      className={`
        relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${dark ? 'bg-indigo-600' : 'bg-gray-200'}
      `}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`
          absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md
          ${dark ? 'bg-white translate-x-7' : 'bg-white translate-x-0'}
        `}
      >
        {dark
          ? <Moon className="w-3.5 h-3.5 text-indigo-600" />
          : <Sun className="w-3.5 h-3.5 text-yellow-500" />}
      </motion.span>
    </button>
  );
}

/** Animated video call card in the hero */
function VideoCallCard() {
  const [step, setStep]     = useState(0);
  const [talking, setTalking] = useState(0);

  useEffect(() => {
    const si = setInterval(() => setStep(s => (s + 1) % CALL_STEPS.length), 3000);
    const ti = setInterval(() => setTalking(s => (s + 1) % PARTICIPANTS.length), 1800);
    return () => { clearInterval(si); clearInterval(ti); };
  }, []);

  const current = CALL_STEPS[step];

  return (
    <div className="relative w-full select-none">
      {/* Glow rings */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-500 opacity-20 blur-2xl animate-blob" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-pink-400 to-indigo-400 opacity-10 blur-3xl animate-blob animation-delay-2000" />

      {/* Main card */}
      <div className="relative glass-card dark:dark-glass rounded-3xl p-3 shadow-2xl ring-1 ring-indigo-100 dark:ring-white/10">
        {/* Dark header bar */}
        <div className={`bg-gradient-to-br ${current.color} rounded-2xl overflow-hidden transition-all duration-700`} style={{ aspectRatio: '4/3' }}>

          {/* ── 2×2 participant grid ── */}
          <div className="absolute inset-3 grid grid-cols-2 gap-2">
            {PARTICIPANTS.map((p, i) => (
              <motion.div
                key={p.name}
                animate={i === talking ? { scale: 1.03, ring: '2px' } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className={`
                  relative bg-gradient-to-br ${p.bg} rounded-xl flex flex-col items-center justify-center overflow-hidden
                  ${i === talking ? 'ring-2 ring-white/70' : ''}
                `}
              >
                {/* Avatar */}
                {p.videoOff ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                      {p.initial}
                    </div>
                    <VideoOff className="w-3 h-3 text-white/50" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {p.initial}
                  </div>
                )}

                {/* Name chip */}
                <div className="absolute bottom-1.5 left-1.5 bg-black/40 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                  <span className="text-white text-[9px] font-medium">{p.name}</span>
                  {p.muted && <MicOff className="w-2 h-2 text-red-400" />}
                </div>

                {/* "Speaking" pulse */}
                {i === talking && !p.muted && (
                  <div className="absolute inset-0 rounded-xl ring-2 ring-green-400/60 animate-pulse pointer-events-none" />
                )}
              </motion.div>
            ))}
          </div>

          {/* ── LIVE badge ── */}
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>

          {/* ── Status pill (cycles with CALL_STEPS) ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10"
            >
              <current.icon className="w-3 h-3" />
              {current.status}
            </motion.div>
          </AnimatePresence>

          {/* ── Control bar ── */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 z-10">
            {[
              { Icon: Mic, active: true },
              { Icon: Video, active: true },
              { Icon: ScreenShare, active: false },
            ].map(({ Icon, active }, i) => (
              <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${active ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center cursor-pointer ml-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.32.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating info badges ── */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-4 -left-4 glass-card dark:dark-glass rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 z-20"
      >
        <span className="text-green-500 text-sm leading-none">●</span> {PARTICIPANTS.length} participants
      </motion.div>
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 glass-card dark:dark-glass rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 z-20"
      >
        <Zap className="w-3.5 h-3.5 text-yellow-500" /> 42 ms latency
      </motion.div>
    </div>
  );
}

/** Single feature card */
function FeatureCard({ feature, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass-card dark:dark-glass rounded-2xl p-7 flex flex-col gap-4 group cursor-default"
    >
      {/* Icon badge */}
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
        <feature.icon className="w-5 h-5 text-white" />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{feature.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(
    scrollY, [0, 80],
    [dark ? 'rgba(10,10,20,0)' : 'rgba(255,255,255,0)', dark ? 'rgba(10,10,20,0.97)' : 'rgba(255,255,255,0.97)'],
  );
  const navShadow = useTransform(scrollY, [0, 80], ['none', '0 2px 20px rgba(0,0,0,0.1)']);

  /* Apply/remove .dark class on <html> */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${dark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>

      {/* ════════════════════════════════
          STICKY NAV
      ════════════════════════════════ */}
      <motion.nav
        style={{ backgroundColor: navBg, boxShadow: navShadow }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <motion.span
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none"
            >
              ConvoX
            </motion.span>

            {/* Nav actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />

              <Link to="/auth">
                <Button variant="ghost" className={`font-medium ${dark ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-indigo-600'}`}>
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all px-5">
                  Get Started <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ════════════════════════════════
          HERO  (50/50 split)
      ════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background */}
        <div className={`absolute inset-0 ${dark ? 'bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`} />

        {/* Animated blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob animation-delay-4000" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-6rem)]">

            {/* ─── LEFT: Text content ─── */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col gap-8"
            >
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="self-start inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-indigo-600" />
                </span>
                Real-time screen sharing &amp; HD video
              </motion.span>

              {/* Headline + subtext */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex flex-col gap-4"
              >
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05]">
                  Video calls that{' '}
                  <span className="shimmer-text">actually work</span>
                </h1>
                <p className={`text-lg leading-relaxed max-w-md ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  ConvoX brings people together with crystal-clear HD video, end-to-end encryption, and zero-friction screen sharing — completely free, forever.
                </p>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                className="flex flex-wrap gap-3"
              >
                <Link to="/home">
                  <Button size="lg" className="h-12 px-7 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all rounded-xl text-white">
                    Start a Meeting <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className={`h-12 px-7 text-base font-semibold border-2 rounded-xl transition-all flex items-center gap-2 ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 hover:border-indigo-400 hover:text-indigo-600 bg-white/70'}`}>
                    <Play className="w-4 h-4 text-indigo-500" />
                    Sign In Free
                  </Button>
                </Link>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
                className="flex flex-wrap gap-4 text-sm"
              >
                {['No credit card required', 'Free forever', 'No install needed'].map(t => (
                  <span key={t} className={`flex items-center gap-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />{t}
                  </span>
                ))}
              </motion.div>

              {/* Mini stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className={`flex gap-8 pt-4 border-t ${dark ? 'border-white/10' : 'border-gray-100'}`}
              >
                {[{ v: '10K+', l: 'Users' }, { v: '99.9%', l: 'Uptime' }, { v: '<80ms', l: 'Latency' }].map(s => (
                  <div key={s.l}>
                    <div className="text-2xl font-black">{s.v}</div>
                    <div className={`text-xs uppercase tracking-wide ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ─── RIGHT: Video call animation ─── */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex items-center justify-center py-8"
            >
              <VideoCallCard />
            </motion.div>

          </div>
        </div>

        {/* Scroll arrow */}
        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer ${dark ? 'text-gray-600' : 'text-gray-400'}`}
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ════════════════════════════════
          STATS BAR
      ════════════════════════════════ */}
      <section className={`border-y py-12 ${dark ? 'border-white/5 bg-gray-900' : 'border-gray-100 bg-white'}`}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {s.value}
              </div>
              <div className={`text-sm font-medium uppercase tracking-wide ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════
          FEATURES
      ════════════════════════════════ */}
      <section className={`py-24 ${dark ? 'bg-gray-950' : 'bg-gradient-to-b from-white to-indigo-50/30'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header — fixed alignment */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-16 flex flex-col gap-4"
          >
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm">Everything you need</p>
            <h2 className="text-4xl sm:text-5xl font-black">Built for real conversations</h2>
            <p className={`text-lg leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Every feature is crafted to make your meetings feel effortless — whether it's a quick chat or an all-day session.
            </p>
          </motion.div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════ */}
      <section className={`py-24 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto text-center mb-16 flex flex-col gap-3"
          >
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm">Simple by design</p>
            <h2 className="text-4xl sm:text-5xl font-black">Up and running in seconds</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create a free account in under 30 seconds. No credit card, no setup hassle.' },
              { step: '02', title: 'Create a Room', desc: 'Hit "Start a Meeting" and share your unique code with anyone, anywhere.' },
              { step: '03', title: 'Connect', desc: 'Your guest opens the link — no install, no plugin. Full HD video instantly.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center flex flex-col items-center gap-3"
              >
                <div className="text-6xl font-black bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-900 dark:to-purple-900 bg-clip-text text-transparent select-none">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className={`text-sm leading-relaxed max-w-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════ */}
      <section className={`py-24 ${dark ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto text-center mb-16 flex flex-col gap-3"
          >
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm">What people say</p>
            <h2 className="text-4xl sm:text-5xl font-black">Loved by thousands</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card dark:dark-glass rounded-2xl p-8 flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`text-sm leading-relaxed italic ${dark ? 'text-gray-300' : 'text-gray-600'}`}>"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          CTA BANNER
      ════════════════════════════════ */}
      <section className={`py-24 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 sm:p-16 shadow-2xl text-center"
          >
            {/* Spinning rings */}
            <div className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full border-4 border-white/10 animate-spin-slow" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 w-72 h-72 rounded-full border-4 border-white/10 animate-spin-slow" style={{ animationDirection: 'reverse' }} />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <h2 className="text-3xl sm:text-5xl font-black text-white">Ready to connect?</h2>
              <p className="text-indigo-100 text-lg max-w-md">
                Join ConvoX today — it's free forever. No credit card required.
              </p>
              <Link to="/auth">
                <Button size="lg" className="h-14 px-10 text-lg font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl hover:scale-105 transition-all rounded-2xl flex items-center gap-2">
                  Create Free Account <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-indigo-100">
                {['No credit card', 'Free unlimited calls', 'Works in your browser'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-300" />{t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer className={`border-t py-10 ${dark ? 'border-white/5 bg-gray-950' : 'border-gray-100 bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ConvoX
          </span>
          <p className={`text-sm text-center ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
            &copy; {new Date().getFullYear()} ConvoX &middot; Bringing people together, one call at a time.
          </p>
          <div className={`flex gap-4 text-sm ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="hover:text-indigo-500 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
