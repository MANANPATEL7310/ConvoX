import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { usePublicFeedbackQuery } from '../hooks/api/useFeedback';
import { useAuth } from '../contexts/useAuth';
import UserDropdown from '../components/UserDropdown';
import {
  Video, Shield, Zap, Users, Globe, Star,
  ArrowRight, Check, ChevronDown, Play,
} from 'lucide-react';
import VideoCallCard from '../components/landing/VideoCallCard';
import FeatureCard from '../components/landing/FeatureCard';
import { FEATURES, STATS, TESTIMONIALS, t } from '../lib/landingData';

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: feedbackData } = usePublicFeedbackQuery();
  const realFeedback = feedbackData?.success ? feedbackData.feedbacks : [];

  const displayTestimonials = realFeedback.length > 0 ? realFeedback.map(f => ({
    name: f.name,
    role: "ConvoX User",
    text: f.comment,
    stars: f.rating,
    avatar: f.avatar
  })) : TESTIMONIALS;

  const { scrollY } = useScroll();
  const navBg = useTransform(
    scrollY, [0, 80],
    [dark ? 'rgba(4,4,15,0)' : 'rgba(255,255,255,0)', dark ? 'rgba(4,4,15,0.96)' : 'rgba(255,255,255,0.96)'],
  );
  const navShadow = useTransform(scrollY, [0, 80], ['none', '0 2px 24px rgba(0,0,0,0.12)']);

  return (
    <div className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${t.pageBg(dark)}`}>

      {/* ════════════ NAV ════════════ */}
      <motion.nav style={{ backgroundColor: navBg, boxShadow: navShadow }} className="fixed top-0 inset-x-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none">
              ConvoX
            </motion.span>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <ThemeToggle />

              {user ? (
                <>
                  <Link to="/home">
                    <button className={`h-9 px-[18px] rounded-[10px] font-semibold text-sm transition-all duration-180 whitespace-nowrap ${
                      dark 
                        ? 'border-[1.5px] border-white/14 bg-indigo-500/12 text-indigo-300 hover:bg-indigo-500/22' 
                        : 'border-[1.5px] border-indigo-200 bg-indigo-50/90 text-indigo-700 hover:bg-indigo-100'
                    }`}>
                      Dashboard
                    </button>
                  </Link>
                  <UserDropdown />
                </>
              ) : (
                <>
                  <Link to="/auth" className="hidden sm:block">
                    <button className={`h-9 px-[18px] rounded-[10px] font-semibold text-sm transition-all duration-180 whitespace-nowrap ${
                      dark 
                        ? 'border-[1.5px] border-white/14 bg-indigo-500/12 text-indigo-300 hover:bg-indigo-500/22' 
                        : 'border-[1.5px] border-indigo-200 bg-indigo-50/90 text-indigo-700 hover:bg-indigo-100'
                    }`}>
                      Sign In
                    </button>
                  </Link>
                  <Link to="/auth">
                    <button className="h-9 px-[18px] rounded-[10px] font-semibold text-sm border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white cursor-pointer transition-all duration-180 whitespace-nowrap shadow-[0_2px_10px_rgba(99,102,241,0.32)] flex items-center gap-[5px] hover:scale-105 hover:opacity-90">
                      Get Started <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ════════════ HERO (50/50) ════════════ */}
      <section className={`relative min-h-screen flex items-center overflow-hidden pt-16 ${t.heroBg(dark)}`}>

        {/* Animated blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob animation-delay-4000" />

        {/* ── Chess-box grid ── */}
        <div className={`pointer-events-none absolute inset-0 ${dark ? 'bg-[length:40px_40px] bg-[linear-gradient(rgba(139,92,246,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.07)_1px,transparent_1px)]' : 'bg-[length:40px_40px] bg-[linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)]'}`} />

        {/* ── Frosted-glass overlay ── */}
        <div className={`pointer-events-none absolute inset-0 backdrop-blur-[1px] ${
          dark ? 'bg-gray-950/30' : 'bg-white/20'
        }`} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-6rem)]">

            {/* ─── LEFT ─── */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex flex-col gap-8">

              {/* Badge */}
              <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`self-start inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm font-medium shadow-sm ${t.badge(dark)}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-indigo-600" />
                </span>
                Real-time screen sharing &amp; HD video
              </motion.span>

              {/* Headline + body */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-4">
                <h1 className={`text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] ${t.heading(dark)}`}>
                  Video calls that{' '}
                  <span className="shimmer-text">actually work</span>
                </h1>
                <p className={`text-lg leading-relaxed max-w-md ${t.body(dark)}`}>
                  ConvoX brings people together with crystal-clear HD video, end-to-end encryption, and zero-friction screen sharing — completely free, forever.
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate(user ? '/home' : '/auth')}
                  className="h-12 px-7 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all rounded-xl text-white"
                >
                  {user ? 'Go to Dashboard' : 'Start a Meeting'} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                {!user && (
                  <Link to="/auth">
                    <Button variant="outline" size="lg" className={`h-12 px-7 text-base font-semibold border-2 rounded-xl flex items-center gap-2 transition-all ${t.outlineBtn(dark)}`}>
                      <Play className="w-4 h-4 text-indigo-500" /> Sign In Free
                    </Button>
                  </Link>
                )}
              </motion.div>

              {/* Trust row */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }} className="flex flex-wrap gap-4 text-sm">
                {['No credit card required', 'Free forever', 'No install needed'].map(label => (
                  <span key={label} className={`flex items-center gap-1.5 ${t.body(dark)}`}>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />{label}
                  </span>
                ))}
              </motion.div>

              {/* Mini stats */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className={`flex gap-8 pt-4 border-t ${t.divider(dark)}`}>
                {[{ v: '10K+', l: 'Users' }, { v: '99.9%', l: 'Uptime' }, { v: '<80ms', l: 'Latency' }].map(s => (
                  <div key={s.l}>
                    <div className={`text-2xl font-black ${t.heading(dark)}`}>{s.v}</div>
                    <div className={`text-xs uppercase tracking-wide ${t.muted(dark)}`}>{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ─── RIGHT: Video card ─── */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex items-center justify-center py-8">
              <VideoCallCard dark={dark} />
            </motion.div>

          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer ${t.muted(dark)}`}>
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ════════════ STATS BAR ════════════ */}
      <section className={`border-y py-12 ${t.border(dark)} ${t.sectionAlt(dark)}`}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">{s.value}</div>
              <div className={`text-sm font-medium uppercase tracking-wide ${t.muted(dark)}`}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section className={`py-24 ${t.sectionGrad(dark)}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Section header with proper vertical/horizontal flow ── */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-16 flex flex-col items-center gap-3">
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm">Everything you need</p>
            <h2 className={`text-4xl sm:text-5xl font-black ${t.heading(dark)}`}>Built for real conversations</h2>
            <p className={`text-lg leading-relaxed ${t.body(dark)}`}>
              Every feature is crafted to make your meetings feel effortless — whether it's a quick chat or an all-day session.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} dark={dark} />)}
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className={`py-24 ${t.sectionAlt(dark)}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-xl mx-auto text-center mb-16 flex flex-col items-center gap-3">
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm">Simple by design</p>
            <h2 className={`text-4xl sm:text-5xl font-black ${t.heading(dark)}`}>Up and running in seconds</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Sign Up',      desc: 'Create a free account in under 30 seconds. No credit card, no setup hassle.' },
              { step: '02', title: 'Create a Room', desc: 'Hit "Start a Meeting" and share your unique code with anyone, anywhere.'       },
              { step: '03', title: 'Connect',       desc: "Your guest opens the link — no install, no plugin. Full HD video instantly."  },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center flex flex-col items-center gap-3">
                <div className={`text-6xl font-black bg-gradient-to-br ${t.stepNum(dark)} bg-clip-text text-transparent select-none`}>{item.step}</div>
                <h3 className={`text-xl font-bold ${t.heading(dark)}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed max-w-xs ${t.body(dark)}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section className={`py-24 ${dark ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-xl mx-auto text-center mb-16 flex flex-col items-center gap-3">
            <p className="text-indigo-600 font-semibold uppercase tracking-widest text-sm">What people say</p>
            <h2 className={`text-4xl sm:text-5xl font-black ${t.heading(dark)}`}>Loved by thousands</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTestimonials.slice(0, 3).map((item, i) => (
              <motion.div key={item.name + i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${t.glass(dark)} rounded-2xl p-8 flex flex-col gap-4`}>
                <div className="flex gap-1">
                  {Array(item.stars).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className={`text-sm leading-relaxed italic ${t.body(dark)}`}>"{item.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {item.name[0]?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <div>
                    <div className={`font-semibold text-sm ${t.heading(dark)}`}>{item.name}</div>
                    <div className={`text-xs ${t.muted(dark)}`}>{item.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CTA BANNER ════════════ */}
      <section className={`py-24 ${t.sectionAlt(dark)}`}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 sm:p-16 shadow-2xl text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full border-4 border-white/10 animate-spin-slow" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 w-72 h-72 rounded-full border-4 border-white/10 animate-spin-slow [animation-direction:reverse]" />
            <div className="relative z-10 flex flex-col items-center gap-6">
              <h2 className="text-3xl sm:text-5xl font-black text-white">Ready to connect?</h2>
              <p className="text-indigo-100 text-lg max-w-md">Join ConvoX today — it's free forever. No credit card required.</p>
              <Button
                size="lg"
                onClick={() => navigate(user ? '/home' : '/auth')}
                className="h-14 px-10 text-lg font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl hover:scale-105 transition-all rounded-2xl flex items-center gap-2"
              >
                {user ? 'Go to Dashboard' : 'Create Free Account'} <ArrowRight className="w-5 h-5" />
              </Button>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-indigo-100">
                {['No credit card', 'Free unlimited calls', 'Works in your browser'].map(label => (
                  <span key={label} className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-300" />{label}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className={`border-t py-10 ${t.border(dark)} ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ConvoX</span>
          <p className={`text-sm text-center ${t.muted(dark)}`}>&copy; {new Date().getFullYear()} ConvoX &middot; Bringing people together, one call at a time.</p>
          <div className={`flex gap-4 text-sm ${t.muted(dark)}`}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="hover:text-indigo-500 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
