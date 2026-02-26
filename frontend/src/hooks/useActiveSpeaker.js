/**
 * useActiveSpeaker — P2P active speaker detection
 *
 * Monitors audio levels of each remote MediaStream using the Web Audio API.
 * Returns a Set of socketIds that are currently speaking above the threshold.
 *
 * @param {Array<{id: string, stream: MediaStream}>} remoteStreams
 * @param {Object} options
 * @param {number} [options.threshold=12]    RMS dB threshold to consider "speaking"
 * @param {number} [options.intervalMs=100]  How often to poll audio levels (ms)
 * @param {number} [options.smoothing=0.8]   AnalyserNode smoothingTimeConstant
 */
import { useEffect, useRef, useState } from 'react';

export function useActiveSpeaker(remoteStreams, {
  threshold = 12,
  intervalMs = 100,
  smoothing = 0.8,
} = {}) {
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());
  // Map of socketId → { context, analyser, source, interval }
  const analysersRef = useRef({});

  useEffect(() => {
    const currentIds = new Set(remoteStreams.map(r => r.id));
    const trackedIds = new Set(Object.keys(analysersRef.current));

    // ── Remove stale analysers for peers who left ──
    for (const id of trackedIds) {
      if (!currentIds.has(id)) {
        const { context, interval } = analysersRef.current[id];
        clearInterval(interval);
        try { context.close(); } catch (_) {}
        delete analysersRef.current[id];
      }
    }

    // ── Add analysers for newly joined peers ──
    for (const { id, stream } of remoteStreams) {
      if (analysersRef.current[id]) continue; // already tracking
      if (!stream || stream.getAudioTracks().length === 0) continue;

      try {
        const context  = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = smoothing;

        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);

        const interval = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);

          // Calculate RMS (root mean square) amplitude
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128; // range -1..1
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const db  = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

          const isSpeaking = db > -threshold;

          setActiveSpeakers(prev => {
            const wasSpeaking = prev.has(id);
            if (isSpeaking === wasSpeaking) return prev; // no change, avoid re-render
            const next = new Set(prev);
            if (isSpeaking) next.add(id);
            else            next.delete(id);
            return next;
          });
        }, intervalMs);

        analysersRef.current[id] = { context, analyser, source, interval };
      } catch (err) {
        console.warn(`useActiveSpeaker: could not analyse stream for ${id}`, err);
      }
    }
  }, [remoteStreams, threshold, intervalMs, smoothing]);

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      for (const { context, interval } of Object.values(analysersRef.current)) {
        clearInterval(interval);
        try { context.close(); } catch (_) {}
      }
      analysersRef.current = {};
    };
  }, []);

  return activeSpeakers;
}
