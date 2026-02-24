import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Video, Shield, Zap, Users, Globe, Star,
  ArrowRight, Check, ChevronDown, Play, MonitorPlay
} from 'lucide-react';

/* ─── tiny data ─────────────────────────────────────────── */
const features = [
  {
    icon: Video,
    title: 'Crystal Clear HD',
    desc: 'Adaptive 4K video that adjusts to your connection speed automatically — always sharp.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'End-to-End Encrypted',
    desc: 'Military-grade encryption ensures every call, message, and file is protected at all times.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Zap,
    title: 'Ultra-Low Latency',
    desc: 'WebRTC peer-to-peer architecture means your voice reaches the other end in under 80 ms.',
    color: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: Users,
    title: 'Multi-Party Calling',
    desc: 'Invite unlimited participants to a room and manage video/audio tracks per user.',
    color: 'from-purple-500 to-pink-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    desc: 'No plugin, no install. Works beautifully on every modern browser and device.',
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
  },
  {
    icon: MonitorPlay,
    title: 'Screen Sharing',
    desc: 'Share your entire screen, a single window, or a browser tab — one click, zero lag.',
    color: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
  },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 80ms', label: 'Latency' },
  { value: 'Free', label: 'Always' },
];

const testimonials = [
  {
    name: 'Anya Sharma',
    role: 'Product Designer',
    text: 'ConvoX replaced Zoom for our entire studio. The call quality and screen sharing are unbelievably smooth.',
    stars: 5,
  },
  {
    name: 'Rahul Menon',
    role: 'Software Engineer',
    text: "The WebRTC performance is insane. I've demoed code with zero lag — it's the best free alternative out there.",
    stars: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Marketing Lead',
    text: 'No account needed for guests, the interface is clean, and it just works. Highly recommend.',
    stars: 5,
  },
];

/* ─── component ─────────────────────────────────────────── */
export default function LandingPage() {
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)']);
  const navShadow = useTransform(scrollY, [0, 80], ['none', '0 2px 20px rgba(0,0,0,0.1)']);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 60));
    return unsub;
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">

      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <motion.nav
        style={{ backgroundColor: navBg, boxShadow: navShadow }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.span
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none"
            >
              ConvoX
            </motion.span>

            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Link to="/auth">
                <Button variant="ghost" className={`font-medium transition-colors ${scrolled ? 'text-gray-700' : 'text-gray-800'} hover:text-indigo-600`}>
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg hover:scale-105 transition-all px-5">
                  Get Started <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />

        {/* Animated blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply opacity-20 filter blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply opacity-20 filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply opacity-15 filter blur-3xl animate-blob animation-delay-4000" />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-indigo-600" />
            </span>
            Now with real-time screen sharing &amp; HD video
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.05] mb-6"
          >
            Video calls that{' '}
            <span className="shimmer-text">actually work</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-xl sm:text-2xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ConvoX brings people together with crystal-clear HD video, end-to-end encryption, and zero-friction screen sharing — completely free, forever.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/home">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all rounded-2xl">
                Start a Meeting  <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-gray-200 hover:border-indigo-400 hover:text-indigo-600 rounded-2xl bg-white/70 backdrop-blur-sm transition-all flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-500" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Preview card */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 80 }}
            className="relative mx-auto max-w-4xl"
          >
            <div className="glass-card rounded-3xl p-3 shadow-2xl ring-1 ring-indigo-100">
              <div className="bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden">
                {/* Fake video grid */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-4 opacity-80">
                  {['bg-indigo-800', 'bg-purple-800', 'bg-blue-800', 'bg-pink-800'].map((c, i) => (
                    <div key={i} className={`${c} rounded-xl flex items-center justify-center animate-float`} style={{ animationDelay: `${i * 0.3}s` }}>
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white/70" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Controls bar */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-full px-6 py-3">
                  {[Video, Shield, MonitorPlay].map((Icon, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer transition-colors">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.32.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z"/></svg>
                  </div>
                </div>

                {/* "Live" chip */}
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>

            {/* Floating badges around card */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -left-4 glass-card rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-gray-700 flex items-center gap-2 hidden sm:flex">
              <span className="text-green-500 text-base">●</span> 3 participants
            </motion.div>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -right-4 glass-card rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-gray-700 flex items-center gap-2 hidden sm:flex">
              <Zap className="w-3.5 h-3.5 text-yellow-500" /> 42 ms latency
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 flex flex-col items-center gap-1 cursor-pointer"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
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
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-white to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-3">Everything you need</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Built for real conversations</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Every feature is crafted to make your meetings feel effortless, whether it's a quick chat or an all-day session.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="glass-card rounded-2xl p-7 group cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${f.color}`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-3">Simple by design</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900">Up and running in seconds</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create a free account in under 30 seconds. No credit card, no setup hassle.' },
              { step: '02', title: 'Create a Room', desc: 'Hit "Start a Meeting" and share your unique 6-character code with anyone.' },
              { step: '03', title: 'Connect', desc: 'Your guest clicks the link — no install, no plugin. Full HD video instantly.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < 2 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-indigo-200 to-purple-200" />}
                <div className="text-6xl font-black bg-gradient-to-br from-indigo-100 to-purple-100 bg-clip-text text-transparent mb-4 select-none">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-3">What people say</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900">Loved by thousands</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card rounded-2xl p-8"
              >
                <div className="flex gap-1 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 sm:p-16 shadow-2xl"
          >
            {/* Spin-ring decoration */}
            <div className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full border-4 border-white/10 animate-spin-slow" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 w-80 h-80 rounded-full border-4 border-white/10 animate-spin-slow" style={{ animationDirection: 'reverse' }} />

            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 relative z-10">
              Ready to connect?
            </h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-xl mx-auto relative z-10">
              Join ConvoX today — it's free forever. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-10 text-lg font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl hover:scale-105 transition-all rounded-2xl flex items-center gap-2">
                  Create Free Account <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-indigo-100 relative z-10">
              {['No credit card', 'Free unlimited calls', 'Cancel anytime'].map(t => (
                <span key={t} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ConvoX
          </span>
          <p className="text-gray-500 text-sm text-center">
            &copy; {new Date().getFullYear()} ConvoX · Bringing people together, one call at a time.
          </p>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
