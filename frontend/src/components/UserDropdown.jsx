import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, History, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 pl-2 pr-3 py-1.5 h-10 rounded-full border transition-all ${
          dark 
            ? 'bg-gray-900/50 hover:bg-gray-800 border-white/[0.08] text-white' 
            : 'bg-white hover:bg-gray-50 border-gray-200/80 text-gray-900 shadow-sm'
        }`}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden ring-2 ring-background">
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user.username?.charAt(0) || 'U'
          )}
        </div>
        <span className="text-sm font-semibold truncate max-w-[100px]">{user.name || user.username}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-50 overflow-hidden ${
              dark 
                ? 'bg-gray-900 border-white/[0.08] shadow-black/60' 
                : 'bg-white border-gray-200/60 shadow-gray-400/20'
            }`}
          >
            <div className={`px-4 py-3 border-b flex flex-col ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
              <span className={`text-sm font-bold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{user.name || user.username}</span>
              <span className={`text-xs truncate mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email || '@' + user.username}</span>
            </div>
            
            <div className="p-1.5 flex flex-col gap-0.5">
              <button
                onClick={() => { setOpen(false); navigate('/profile'); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                  dark ? 'text-gray-300 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
              
              <button
                onClick={() => { setOpen(false); navigate('/history'); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                  dark ? 'text-gray-300 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <History className="w-4 h-4" />
                Meeting History
              </button>
            </div>
            
            <div className={`p-1.5 border-t ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
              <button
                onClick={() => { setOpen(false); logout(); navigate('/auth'); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                  dark 
                    ? 'text-red-400 hover:bg-red-500/10' 
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
