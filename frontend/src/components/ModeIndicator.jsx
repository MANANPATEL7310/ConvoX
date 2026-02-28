/**
 * ModeIndicator — small badge showing current meeting architecture.
 *
 * Green  "P2P · N users"   → direct peer-to-peer (≤2 people)
 * Indigo "SFU · N users"   → LiveKit selective forwarding (3+ people)
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Zap } from 'lucide-react';

export default function ModeIndicator({ mode, participantCount }) {
  const isSFU = mode === 'sfu';

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        background: isSFU
          ? 'linear-gradient(135deg, rgba(79,70,229,0.25), rgba(139,92,246,0.25))'
          : 'rgba(16,185,129,0.15)',
        border: `1px solid ${isSFU ? 'rgba(99,102,241,0.5)' : 'rgba(16,185,129,0.4)'}`,
        color: isSFU ? '#a5b4fc' : '#6ee7b7',
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
      }}
    >
      {isSFU
        ? <Zap  style={{ width: 11, height: 11 }} />
        : <Users style={{ width: 11, height: 11 }} />
      }
      <span>{isSFU ? 'SFU' : 'P2P'}</span>
      <span style={{ opacity: 0.6 }}>·</span>
      <span>{participantCount} {participantCount === 1 ? 'user' : 'users'}</span>
    </motion.div>
  );
}
