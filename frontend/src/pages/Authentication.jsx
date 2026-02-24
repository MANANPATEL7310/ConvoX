import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/useAuth";
import { toast } from "sonner";
import { User, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

const Authentication = () => {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValue] = useState({ password: "", username: "", name: "" });
  const { password, username, name } = inputValue;
  const { login, register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValue(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(username, password);
        toast.success("Welcome back!");
      } else {
        await register(name, username, password);
        toast.success("Account created!");
      }
      setTimeout(() => navigate("/home"), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  /* ── shared color tokens ── */
  const card     = dark ? "bg-gray-900/80 border-white/10 backdrop-blur-xl" : "bg-white/80 border-gray-100/80 backdrop-blur-xl";
  const label    = dark ? "text-gray-400" : "text-gray-600";
  const inputCls = dark
    ? "bg-gray-800/70 border-gray-700 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
    : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-100";
  const footerBg = dark ? "bg-gray-800/60 border-white/10" : "bg-gray-50 border-gray-100";
  const footerText = dark ? "text-gray-400" : "text-gray-500";
  const dividerColor = dark ? "border-white/10" : "border-gray-200";
  const dividerText  = dark ? "text-gray-500"  : "text-gray-400";

  return (
    <PageWrapper>
      {/* ── Floating nav bar with back link + theme toggle ── */}
      <nav className={`relative z-10 backdrop-blur-md border-b sticky top-0 transition-colors duration-300 ${
        dark ? "bg-gray-900/80 border-white/10" : "bg-white/70 border-gray-200/60"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/">
              <motion.span
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none"
              >
                ConvoX
              </motion.span>
            </Link>
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <ThemeToggle />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ── Main centred auth card ── */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-2`}>
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
              {isLogin ? "Sign in to your ConvoX account" : "Create your account in seconds"}
            </p>
          </div>

          {/* Card */}
          <div className={`rounded-2xl border shadow-2xl overflow-hidden ${card}`}>
            {/* Accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Tab switcher */}
            <div className={`flex border-b ${dividerColor}`}>
              {["Sign In", "Sign Up"].map((t, i) => {
                const active = (i === 0) === isLogin;
                return (
                  <button
                    key={t}
                    onClick={() => setIsLogin(i === 0)}
                    className={`flex-1 py-3 text-sm font-semibold transition-all ${
                      active
                        ? "text-indigo-600 border-b-2 border-indigo-500"
                        : dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                    className="space-y-1.5"
                  >
                    <label className={`block text-xs font-semibold uppercase tracking-widest ${label}`}>Full Name</label>
                    <input
                      type="text" name="name" value={name} onChange={handleChange}
                      required={!isLogin} placeholder="John Doe"
                      className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm focus:ring-2 ${inputCls}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className={`block text-xs font-semibold uppercase tracking-widest ${label}`}>Username</label>
                <div className="relative">
                  <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="text" name="username" value={username} onChange={handleChange}
                    required placeholder="Enter your username"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all text-sm focus:ring-2 ${inputCls}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`block text-xs font-semibold uppercase tracking-widest ${label}`}>Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={password}
                    onChange={handleChange} required placeholder="Enter your password"
                    className={`w-full pl-10 pr-11 py-3 border rounded-xl outline-none transition-all text-sm focus:ring-2 ${inputCls}`}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider + Google */}
            <div className="px-6 sm:px-8 pb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex-1 border-t ${dividerColor}`} />
                <span className={`text-[10px] uppercase tracking-widest font-medium ${dividerText}`}>or</span>
                <div className={`flex-1 border-t ${dividerColor}`} />
              </div>
              <button
                onClick={() => toast.info("Google Auth coming soon!")}
                className={`w-full border rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-3 ${
                  dark
                    ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
            </div>

            {/* Footer toggle */}
            <div className={`py-4 px-6 sm:px-8 border-t text-center text-sm ${footerBg} ${footerText}`}>
              {isLogin ? (
                <>Don't have an account?{" "}
                  <button onClick={() => setIsLogin(false)} className="text-indigo-500 font-semibold hover:text-indigo-400 hover:underline">Sign up</button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button onClick={() => setIsLogin(true)} className="text-indigo-500 font-semibold hover:text-indigo-400 hover:underline">Sign in</button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Authentication;
