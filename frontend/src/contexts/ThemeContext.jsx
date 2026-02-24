import React, { createContext, useContext, useState, useEffect } from 'react';

/* ─── Context ─── */
const ThemeContext = createContext(null);

/* ─── Provider ─── */
export function ThemeProvider({ children }) {
  // Read saved preference from localStorage, default to 'light'
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('convox-theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Apply .dark on <html> and persist whenever dark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('convox-theme', dark ? 'dark' : 'light');
    } catch { /* ignore */ }
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─── Hook ─── */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
