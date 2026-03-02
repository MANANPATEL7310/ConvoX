import React from 'react';
import { motion } from 'framer-motion';

export default function QuickActionCard({ action, onClick, dark }) {
  const Icon = action.icon;
  
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative group p-6 rounded-3xl text-left transition-all duration-300 overflow-hidden border ${
        dark 
          ? 'bg-gray-800/40 border-white/5 hover:border-white/10' 
          : 'bg-white border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 ${
          dark ? action.bgDark : action.bgLight
        }`}>
          <Icon className={`w-7 h-7 ${dark ? action.accentDark : action.accentLight}`} strokeWidth={1.5} />
        </div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 ${
          dark ? 'bg-white/10' : 'bg-gray-100'
        }`}>
          <svg className={`w-4 h-4 ${dark ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className={`font-semibold text-lg md:text-xl mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
          {action.label}
        </h3>
        <p className={`text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          {action.desc}
        </p>
      </div>
    </motion.button>
  );
}
