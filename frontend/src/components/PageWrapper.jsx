/**
 * PageWrapper — centralized layout provider for ALL pages.
 *
 * What it handles so every page gets it for free:
 *   • Theme-aware background gradient  (indigo-50→white→purple-50 / gray-950)
 *   • Chess-box grid overlay           (subtle, theme-aware, single opacity value)
 *   • Frosted-glass overlay            (backdrop-blur + semi-transparent wash)
 *   • Decorative animated blobs
 *
 * How to use in any new page:
 *
 *   import PageWrapper from '../components/PageWrapper';
 *
 *   export default function MyPage() {
 *     return (
 *       <PageWrapper>
 *         <nav>...</nav>
 *         <main>...</main>
 *       </PageWrapper>
 *     );
 *   }
 *
 * The ThemeToggle button still lives in each page's navbar because each page
 * has different nav items. But the visual backdrop is 100% centralised here.
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function PageWrapper({ children, className = '' }) {
  const { dark } = useTheme();

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        dark
          ? 'bg-gray-950'
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      } ${className}`}
    >
      {/* ── Decorative ambient blobs (pointer-events-none so they never block clicks) ── */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply opacity-8 blur-3xl animate-blob animation-delay-4000" />

      {/* ── Chess-box grid ─ theme-aware, single source of truth ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: dark
            ? `linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px),
               linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)`
            : `linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
               linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Frosted-glass wash ─ keeps the background looking premium without obscuring content ── */}
      <div
        className={`pointer-events-none absolute inset-0 backdrop-blur-[1px] ${
          dark ? 'bg-gray-950/30' : 'bg-white/20'
        }`}
      />

      {/* ── Page content (relative + z-10 so it sits above all decorative layers) ── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
