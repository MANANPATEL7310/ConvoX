import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/useAuth";
import { toast } from "sonner";
import { User, Lock, Eye, EyeOff, Video, ArrowRight, Sparkles, Shield, Zap, Users, Mail } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

/* ─── small password strength helper ─── */
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  return score; // 0-4
}
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

/* ─── slide variants ─── */
const slide = {
  initial: (d) => ({ opacity: 0, x: d * 28 }),
  animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit:    (d) => ({ opacity: 0, x: d * -28, transition: { duration: 0.22 } }),
};

/* ─── left-panel feature bullets ─── */
const FEATURES = [
  { icon: Zap,     text: 'Instant HD meetings, zero setup' },
  { icon: Shield,  text: 'End-to-end encrypted by default' },
  { icon: Users,   text: 'P2P up to 4 · SFU for 100+' },
  { icon: Video,   text: 'Screen share, chat & active speaker' },
];

const Authentication = () => {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const [isLogin, setIsLogin]               = useState(true);
  const [showPassword, setShowPassword]     = useState(false);
  const [inputValue, setInputValue]         = useState({ password: '', username: '', name: '', email: '' });
  const { password, username, name, email }        = inputValue;
  const { login, register }                 = useAuth();
  const [loading, setLoading]               = useState(false);
  const [focusedField, setFocusedField]     = useState(null);

  const pwStrength = password.length ? getStrength(password) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValue(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
        toast.success('Welcome back! 👋');
      } else {
        await register(name, username, email, password);
        toast.success('Account created! 🎉');
      }
      setTimeout(() => navigate('/home'), 700);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ─── theme tokens ─── */
  const inputBase = `w-full border rounded-xl outline-none text-sm transition-all duration-200 focus:ring-2`;
  const inputTheme = dark
    ? 'bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20'
    : 'bg-gray-50   border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-100';

  return (
    <PageWrapper>
      {/* ── Sticky nav ── */}
      <nav className={`relative z-20 backdrop-blur-xl border-b sticky top-0 transition-colors duration-300 ${
        dark ? 'bg-gray-950/70 border-white/[0.06]' : 'bg-white/60 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Video className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ConvoX
                </span>
              </motion.div>
            </Link>
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              <ThemeToggle />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-5xl"
        >
          {/* ── Two-column grid ── */}
          <div className={`rounded-3xl border shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 ${
            dark
              ? 'bg-gray-900/90 border-white/[0.08] shadow-black/60 backdrop-blur-2xl'
              : 'bg-white/90   border-gray-200/60   shadow-gray-400/20 backdrop-blur-2xl'
          }`}>

            {/* ══ LEFT: Branding panel ══ */}
            <div className={`hidden lg:flex flex-col justify-between p-10 relative overflow-hidden ${
              dark
                ? 'bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-gray-900/80'
                : 'bg-gradient-to-br from-indigo-600  via-purple-600  to-pink-600'
            }`}>
              {/* decorative circles */}
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />

              {/* Logo */}
              <div>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-black text-white tracking-tight">ConvoX</span>
                </div>

                <h2 className="text-3xl font-black text-white leading-tight mb-4">
                  {isLogin ? 'Great to see\nyou again 👋' : 'Start for free\ntoday 🚀'}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  {isLogin
                    ? 'Sign in and jump back into your meetings, teams, and conversations.'
                    : 'Create your account and start connecting with your team in seconds.'}
                </p>
              </div>

              {/* Feature list */}
              <div className="space-y-3 mt-10">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/80 font-medium">{text}</span>
                  </div>
                ))}
              </div>

              {/* Bottom badge */}
              <div className="mt-10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/50 font-medium">Trusted by thousands of teams</span>
              </div>
            </div>

            {/* ══ RIGHT: Form panel ══ */}
            <div className="flex flex-col justify-center p-8 sm:p-10">

              {/* Tab switcher */}
              <div className={`flex rounded-xl p-1 mb-8 gap-1 ${
                dark ? 'bg-gray-800/60' : 'bg-gray-100/80'
              }`}>
                {[['Sign In', true], ['Sign Up', false]].map(([tabLabel, isLoginTab]) => (
                  <button
                    key={tabLabel}
                    type="button"
                    onClick={() => { setIsLogin(isLoginTab); setInputValue({ password: '', username: '', name: '', email: '' }); setShowPassword(false); }}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: isLogin === isLoginTab
                        ? 'linear-gradient(135deg, #6366f1, #9333ea)'
                        : 'transparent',
                      color: isLogin === isLoginTab
                        ? '#fff'
                        : dark ? '#9ca3af' : '#6b7280',
                      boxShadow: isLogin === isLoginTab ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                    }}
                  >
                    {tabLabel}
                  </button>
                ))}
              </div>

              {/* Heading */}
              <AnimatePresence mode="wait">
                <motion.div key={isLogin ? 'l' : 'r'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mb-7">
                  <h1 className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                    {isLogin ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isLogin ? 'Enter your credentials to continue' : 'Fill in the details below to get started'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait" initial={false}>
                  {!isLogin && (
                    <motion.div key="name" custom={1} variants={slide} initial="initial" animate="animate" exit="exit" className="space-y-1.5">
                      <label className={`block text-xs font-bold uppercase tracking-widest ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Full Name
                      </label>
                      <div className="relative">
                        <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${focusedField === 'name' ? 'text-indigo-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input type="text" name="name" value={name} onChange={handleChange}
                          onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                          required={!isLogin} placeholder="John Doe"
                          className={`${inputBase} pl-10 pr-4 py-3 ${inputTheme}`} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold uppercase tracking-widest ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Username
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${focusedField === 'username' ? 'text-indigo-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input type="text" name="username" value={username} onChange={handleChange}
                      onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)}
                      required placeholder="your_username"
                      className={`${inputBase} pl-10 pr-4 py-3 ${inputTheme}`} />
                  </div>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {!isLogin && (
                    <motion.div key="email" custom={1} variants={slide} initial="initial" animate="animate" exit="exit" className="space-y-1.5">
                      <label className={`block text-xs font-bold uppercase tracking-widest ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Email
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${focusedField === 'email' ? 'text-indigo-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input type="email" name="email" value={email} onChange={handleChange}
                          onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                          required={!isLogin} placeholder="you@example.com"
                          className={`${inputBase} pl-10 pr-4 py-3 ${inputTheme}`} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-bold uppercase tracking-widest ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Password
                    </label>
                    {isLogin && (
                      <span
                        style={{ fontSize: 11, color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => toast.info('Forgot password coming soon!')}
                      >
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${focusedField === 'password' ? 'text-indigo-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                      required placeholder="Enter your password"
                      className={`${inputBase} pl-10 pr-12 py-3 ${inputTheme}`} />
                    {/* Eye toggle — inline style to prevent MUI override */}
                    <span
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: dark ? '#6b7280' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        lineHeight: 1,
                      }}
                    >
                      {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </span>
                  </div>

                  {/* Password strength bar */}
                  <AnimatePresence>
                    {!isLogin && password.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{ background: i <= pwStrength ? strengthColor[pwStrength] : dark ? '#374151' : '#e5e7eb' }} />
                          ))}
                        </div>
                        <p className="text-[11px] font-medium" style={{ color: strengthColor[pwStrength] }}>
                          {strengthLabel[pwStrength]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    marginTop: 8,
                    borderRadius: 12,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    background: 'linear-gradient(135deg, #6366f1, #9333ea)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {isLogin ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className={`flex-1 border-t ${dark ? 'border-white/[0.08]' : 'border-gray-200'}`} />
                  <span className={`text-[10px] uppercase tracking-widest font-semibold ${dark ? 'text-gray-600' : 'text-gray-400'}`}>or</span>
                  <div className={`flex-1 border-t ${dark ? 'border-white/[0.08]' : 'border-gray-200'}`} />
                </div>

                {/* Google SSO */}
                <button
                  type="button"
                  onClick={() => { window.location.href = `${BACKEND_URL}/api/v1/auth/google`; }}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 12,
                    border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
                    background: dark ? 'rgba(255,255,255,0.04)' : '#fff',
                    color: dark ? '#d1d5db' : '#374151',
                    fontWeight: 600,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>

              {/* Footer toggle */}
              <p className={`text-center text-sm mt-6 ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span
                  onClick={() => { setIsLogin(!isLogin); setInputValue({ password: '', username: '', name: '' }); setShowPassword(false); }}
                  style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isLogin ? 'Sign up for free' : 'Sign in'}
                </span>
              </p>

              {/* Trust badge */}
              <div className={`mt-6 pt-4 border-t flex items-center justify-center gap-2 ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <Sparkles className={`w-3 h-3 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                <span className={`text-[11px] font-medium ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Your data is encrypted end-to-end
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Authentication;
