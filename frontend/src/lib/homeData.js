import {
  Video, Zap, Shield, Users, Clock, Link as LinkIcon, MonitorPlay,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   QUICK ACTIONS
═══════════════════════════════════════════════════════════ */
export const QUICK_ACTIONS = [
  {
    id: 'new-meeting',
    icon: Video,
    label: 'New Meeting',
    desc: 'Start an instant meeting with a unique room code',
    gradient: 'from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/25',
    ringColor: 'ring-indigo-500/30',
    bgLight: 'bg-indigo-50/80',
    bgDark:  'bg-indigo-500/10',
    accentLight: 'text-indigo-700',
    accentDark: 'text-indigo-300',
  },
  {
    id: 'team-room',
    icon: Users,
    label: 'Team Room',
    desc: 'Create a persistent room and invite your whole team',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/25',
    ringColor: 'ring-emerald-500/30',
    bgLight: 'bg-emerald-50/80',
    bgDark:  'bg-emerald-500/10',
    accentLight: 'text-emerald-700',
    accentDark: 'text-emerald-300',
  },
  {
    id: 'schedule',
    icon: Clock,
    label: 'Schedule',
    desc: 'Plan a future meeting and share the invite link',
    gradient: 'from-orange-500 to-rose-500',
    glow: 'shadow-orange-500/25',
    ringColor: 'ring-orange-500/30',
    bgLight: 'bg-orange-50/80',
    bgDark:  'bg-orange-500/10',
    accentLight: 'text-orange-700',
    accentDark: 'text-orange-300',
  },
  {
    id: 'share-link',
    icon: LinkIcon,
    label: 'Share Link',
    desc: 'Generate a link to share with anyone — no signup needed',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/25',
    ringColor: 'ring-blue-500/30',
    bgLight: 'bg-blue-50/80',
    bgDark:  'bg-blue-500/10',
    accentLight: 'text-blue-700',
    accentDark: 'text-blue-300',
  },
];

/* ── Feature pills for right-side panel ── */
export const FEATURES = [
  { icon: Zap,         label: '<80ms latency',
    light: 'bg-yellow-50 border-yellow-200 text-yellow-700',  dark: 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300' },
  { icon: Shield,      label: 'E2E encrypted',
    light: 'bg-emerald-50 border-emerald-200 text-emerald-700', dark: 'bg-emerald-900/20 border-emerald-700/30 text-emerald-300' },
  { icon: Users,       label: 'Up to 100 users',
    light: 'bg-purple-50 border-purple-200 text-purple-700', dark: 'bg-purple-900/20 border-purple-700/30 text-purple-300' },
  { icon: MonitorPlay, label: 'Screen sharing',
    light: 'bg-orange-50 border-orange-200 text-orange-700', dark: 'bg-orange-900/20 border-orange-700/30 text-orange-300' },
  { icon: Video,       label: 'HD video',
    light: 'bg-blue-50 border-blue-200 text-blue-700', dark: 'bg-blue-900/20 border-blue-700/30 text-blue-300' },
];
