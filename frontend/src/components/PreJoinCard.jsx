import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, ArrowRight, AlertCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * PreJoinCard — shown to ALL users before they enter the meeting.
 * Shows live camera preview + mic/video toggles.
 *
 * Props:
 *   username   — display name of the current user
 *   onJoin     — callback({ videoEnabled, audioEnabled, stream })
 */
export default function PreJoinCard({ username, onJoin }) {
  const { dark } = useTheme();
  const videoRef          = useRef(null);
  const streamRef         = useRef(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [camError, setCamError]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [micLevel, setMicLevel]         = useState(0);
  const animFrameRef      = useRef(null);
  const analyserRef       = useRef(null);

  /* ── Start camera preview ── */
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        startMicMeter(stream);
      } catch {
        setCamError(true);
      }
    })();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ── Mic level meter ── */
  const startMicMeter = useCallback((stream) => {
    try {
      const ctx      = new AudioContext();
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, avg * 2));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* AudioContext might be blocked */ }
  }, []);

  /* ── Toggle video track ── */
  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return;
    const tracks = streamRef.current.getVideoTracks();
    tracks.forEach(t => { t.enabled = !videoEnabled; });
    setVideoEnabled(v => !v);
  }, [videoEnabled]);

  /* ── Toggle audio track ── */
  const toggleAudio = useCallback(() => {
    if (!streamRef.current) return;
    const tracks = streamRef.current.getAudioTracks();
    tracks.forEach(t => { t.enabled = !audioEnabled; });
    setAudioEnabled(a => !a);
  }, [audioEnabled]);

  /* ── Join ── */
  const handleJoin = useCallback(async () => {
    setLoading(true);
    try {
      // If no stream yet (cam denied), try audio-only
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: audioEnabled });
        streamRef.current = stream;
      }
      onJoin({ videoEnabled, audioEnabled, stream });
    } catch (err) {
      console.error('PreJoinCard join error:', err);
      onJoin({ videoEnabled: false, audioEnabled: false, stream: null });
    }
  }, [videoEnabled, audioEnabled, onJoin]);

  const initial = username?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: dark ? 'rgba(3,7,18,0.97)' : 'rgba(249,250,251,0.98)' }}>

      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-4xl"
      >
        <div className={`rounded-3xl border overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 ${
          dark ? 'bg-gray-900/95 border-white/[0.08]' : 'bg-white border-gray-200'
        }`}>

          {/* ══ LEFT: Camera preview ══ */}
          <div className="relative bg-black aspect-video lg:aspect-auto lg:min-h-[420px] flex items-center justify-center overflow-hidden">
            {!camError ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay muted playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)', opacity: videoEnabled ? 1 : 0 }}
                />
                {/* Video off overlay */}
                {!videoEnabled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                      <span className="text-3xl font-black text-white">{initial}</span>
                    </div>
                    <p className="text-white/60 text-sm font-medium">Camera is off</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <AlertCircle className="w-10 h-10 text-amber-400" />
                <p className="text-white/70 text-sm">Camera not available<br/>You can still join with audio only</p>
              </div>
            )}

            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {/* Username badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-white text-xs font-semibold">{username || 'You'}</span>
            </div>

            {/* Mic level bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: 16,
                    background: audioEnabled && micLevel > (i * 12)
                      ? (micLevel > 70 ? '#ef4444' : '#22c55e')
                      : 'rgba(255,255,255,0.2)',
                  }} />
              ))}
            </div>
          </div>

          {/* ══ RIGHT: Controls ══ */}
          <div className="flex flex-col justify-center p-8 sm:p-10 gap-6">
            {/* Header */}
            <div>
              <h1 className={`text-2xl font-black tracking-tight mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>
                Ready to join?
              </h1>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Set up your camera and microphone before entering.
              </p>
            </div>

            {/* Toggle controls */}
            <div className="space-y-3">
              {/* Video toggle */}
              <div
                className="relative flex items-center justify-between p-4 rounded-2xl transition-all duration-200 overflow-hidden"
                style={{
                  background: dark
                    ? (videoEnabled ? 'rgba(99,102,241,0.1)' : 'rgba(31,41,55,0.6)')
                    : (videoEnabled ? 'rgba(238,242,255,0.95)' : '#f9fafb'),
                  border: dark
                    ? (videoEnabled ? '1px solid rgba(99,102,241,0.28)' : '1px solid rgba(255,255,255,0.06)')
                    : (videoEnabled ? '1.5px solid #c7d2fe' : '1px solid #e5e7eb'),
                  boxShadow: videoEnabled ? (dark ? '0 0 0 1px rgba(99,102,241,0.12)' : '0 0 0 3px rgba(99,102,241,0.07)') : 'none',
                }}
              >
                {/* Ripple flash on toggle */}
                <motion.div
                  key={`vr-${videoEnabled}`}
                  initial={{ opacity: 0.4, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                    background: videoEnabled ? 'rgba(99,102,241,0.18)' : 'rgba(239,68,68,0.1)',
                  }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: videoEnabled ? (dark ? 'rgba(99,102,241,0.28)' : '#e0e7ff') : (dark ? '#374151' : '#f3f4f6'),
                    color: videoEnabled ? (dark ? '#a5b4fc' : '#4f46e5') : (dark ? '#6b7280' : '#9ca3af'),
                    transition: 'all 0.2s',
                  }}>
                    {videoEnabled ? <Video style={{ width: 18, height: 18 }} /> : <VideoOff style={{ width: 18, height: 18 }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: dark ? '#f9fafb' : '#111827', margin: 0 }}>Camera</p>
                    <p style={{ fontSize: 11, margin: 0, color: videoEnabled ? (dark ? '#818cf8' : '#6366f1') : (dark ? '#6b7280' : '#9ca3af') }}>
                      {videoEnabled ? 'On' : 'Off'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleVideo}
                  style={{
                    position: 'relative', width: 50, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: videoEnabled ? '#6366f1' : (dark ? '#374151' : '#cbd5e1'),
                    transition: 'background 0.25s',
                    boxShadow: videoEnabled ? '0 0 0 3px rgba(99,102,241,0.22)' : 'none',
                  }}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 700, damping: 32 }}
                    style={{
                      position: 'absolute', top: 4,
                      left: videoEnabled ? 26 : 4,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </button>
              </div>

              {/* Audio toggle */}
              <div
                className="relative flex items-center justify-between p-4 rounded-2xl transition-all duration-200 overflow-hidden"
                style={{
                  background: dark
                    ? (audioEnabled ? 'rgba(16,185,129,0.09)' : 'rgba(31,41,55,0.6)')
                    : (audioEnabled ? 'rgba(236,253,245,0.95)' : '#f9fafb'),
                  border: dark
                    ? (audioEnabled ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)')
                    : (audioEnabled ? '1.5px solid #a7f3d0' : '1px solid #e5e7eb'),
                  boxShadow: audioEnabled ? (dark ? '0 0 0 1px rgba(16,185,129,0.1)' : '0 0 0 3px rgba(16,185,129,0.07)') : 'none',
                }}
              >
                {/* Ripple flash on toggle */}
                <motion.div
                  key={`ar-${audioEnabled}`}
                  initial={{ opacity: 0.4, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                    background: audioEnabled ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.1)',
                  }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: audioEnabled ? (dark ? 'rgba(16,185,129,0.22)' : '#d1fae5') : (dark ? '#374151' : '#f3f4f6'),
                    color: audioEnabled ? (dark ? '#6ee7b7' : '#059669') : (dark ? '#6b7280' : '#9ca3af'),
                    transition: 'all 0.2s',
                  }}>
                    {audioEnabled ? <Mic style={{ width: 18, height: 18 }} /> : <MicOff style={{ width: 18, height: 18 }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: dark ? '#f9fafb' : '#111827', margin: 0 }}>Microphone</p>
                    <p style={{ fontSize: 11, margin: 0, color: audioEnabled ? (dark ? '#34d399' : '#059669') : (dark ? '#6b7280' : '#9ca3af') }}>
                      {audioEnabled ? 'On — speak to test' : 'Off'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleAudio}
                  style={{
                    position: 'relative', width: 50, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: audioEnabled ? '#10b981' : (dark ? '#374151' : '#cbd5e1'),
                    transition: 'background 0.25s',
                    boxShadow: audioEnabled ? '0 0 0 3px rgba(16,185,129,0.22)' : 'none',
                  }}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 700, damping: 32 }}
                    style={{
                      position: 'absolute', top: 4,
                      left: audioEnabled ? 26 : 4,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Join button */}
            <button
              onClick={handleJoin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 16,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                background: 'linear-gradient(135deg, #6366f1, #9333ea)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <svg className="animate-spin" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Join Meeting <ArrowRight style={{ width: 18, height: 18 }} /></>
              )}
            </button>

            <p className={`text-center text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
              You can change camera and mic settings after joining.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
