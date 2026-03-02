import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MicOff, VideoOff } from 'lucide-react';
import { CALL_STEPS, PARTICIPANTS, t } from '../../lib/landingData';

/* ═══════════════════════════════════════════════════════════
   VIDEO CALL CARD  — cinematic animation with accent frame
═══════════════════════════════════════════════════════════ */
export default function VideoCallCard({ dark }) {
  const [step, setStep]       = useState(0);
  const [talking, setTalking] = useState(0);

  useEffect(() => {
    const si = setInterval(() => setStep(s => (s + 1) % CALL_STEPS.length), 3000);
    const ti = setInterval(() => setTalking(s => (s + 1) % PARTICIPANTS.length), 1800);
    return () => { clearInterval(si); clearInterval(ti); };
  }, []);

  const current = CALL_STEPS[step];

  return (
    <div className="relative w-full select-none">
      {/* ── Animated glow behind card ── */}
      <div className={`absolute -inset-4 rounded-[2.5rem] ${t.videoGlow(dark)} opacity-20 blur-3xl animate-blob`} />
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-500 opacity-15 blur-2xl animate-blob animation-delay-2000" />

      {/* ── Accent frame ring — color matches toggle (contrasts with theme) ── */}
      <div className={`absolute -inset-[3px] rounded-3xl bg-gradient-to-br ${t.videoFrame(dark)} animate-gradient-x`} style={{ backgroundSize: '200% 200%' }} />

      {/* ── White/dark spacer between frame and content ── */}
      <div className={`absolute -inset-[1px] rounded-[calc(1.5rem-2px)] ${dark ? 'bg-gray-950' : 'bg-white'}`} />

      {/* ── Main card body ── */}
      <div className={`relative ${t.glass(dark)} rounded-3xl p-3 shadow-2xl z-10`}>
        {/* Dark inner screen */}
        <div
          className={`bg-gradient-to-br ${current.color} rounded-2xl overflow-hidden transition-colors duration-700 relative`}
          style={{ aspectRatio: '4/3' }}
        >
          {/* 2×2 participant grid */}
          <div className="absolute inset-3 grid grid-cols-2 gap-2">
            {PARTICIPANTS.map((p, i) => (
              <motion.div
                key={p.name}
                animate={i === talking ? { scale: 1.04 } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className={`relative bg-gradient-to-br ${p.bg} rounded-xl flex flex-col items-center justify-center overflow-hidden ${i === talking ? 'ring-2 ring-white/60' : ''}`}
              >
                {p.videoOff ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">{p.initial}</div>
                    <VideoOff className="w-3 h-3 text-white/50" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">{p.initial}</div>
                )}

                {/* Name chip */}
                <div className="absolute bottom-1.5 left-1.5 bg-black/40 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                  <span className="text-white text-[9px] font-medium">{p.name}</span>
                  {p.muted && <MicOff className="w-2 h-2 text-red-400" />}
                </div>

                {/* Speaking pulse */}
                {i === talking && !p.muted && (
                  <div className="absolute inset-0 rounded-xl ring-2 ring-green-400/60 animate-pulse pointer-events-none" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Status overlay */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <motion.div
              key={current.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/10"
            >
              <current.Icon className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-medium">{current.label}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
