import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemeToggle — shared across all pages.
 * In light mode: renders a dark pill (visually contrasts against light bg).
 * In dark mode:  renders a white pill (visually contrasts against dark bg).
 */
export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`
        relative flex items-center gap-2 px-3 py-1.5 rounded-full border-2 font-semibold text-xs
        transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${dark
          ? 'bg-white text-gray-900 border-white/80 shadow-md'   /* light pill on dark bg */
          : 'bg-gray-900 text-white border-gray-900 shadow-md'   /* dark pill on light bg */
        }
      `}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={dark ? 'sun' : 'moon'}
          initial={{ rotate: -60, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0,   opacity: 1, scale: 1   }}
          exit={{    rotate:  60, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.22 }}
        >
          {dark
            ? <Sun  className="w-3.5 h-3.5 text-yellow-500" />
            : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
        </motion.div>
      </AnimatePresence>
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
