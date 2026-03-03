/**
 * PageWrapper — centralized layout provider for ALL pages.
 *
 * Provides these automatically to every page that uses it:
 *   • Theme-aware background gradient
 *   • Chess-box grid overlay  (single source of truth — change opacity here once)
 *   • Frosted-glass overlay
 *   • Decorative animated blobs
 *
 * Usage in any page:
 *
 *   import PageWrapper from '../components/PageWrapper';
 *
 *   export default function MyPage() {
 *     return (
 *       <PageWrapper>
 *         <nav>…</nav>
 *         <main>…</main>
 *       </PageWrapper>
 *     );
 *   }
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function PageWrapper({ children, className = '' }) {
  const { dark } = useTheme();

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
        dark
          ? 'bg-gray-950'
          : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      } ${className}`}
    >
      {/* ── Decorative ambient blobs ── */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply opacity-10 blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply opacity-8 blur-3xl animate-blob animation-delay-4000" />

      {/* ── Chess-box grid — single source of truth for all pages ── */}
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



      {/* Page content — sits on top of all decorative layers */}
      {children}
    </div>
  );
}

