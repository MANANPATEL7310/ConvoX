import {
  Video, Shield, Zap, Users, Globe, MonitorPlay,
  Mic, MicOff, VideoOff, ScreenShare,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════════════════ */
export const FEATURES = [
  { icon: Video,       title: 'Crystal Clear HD',       desc: 'Adaptive 4K video that adjusts to your connection — always sharp, always smooth.',     gradient: 'from-blue-500 to-indigo-600' },
  { icon: Shield,      title: 'End-to-End Encrypted',   desc: 'Military-grade encryption protects every call, message, and file you share.',           gradient: 'from-emerald-500 to-teal-600' },
  { icon: Zap,         title: 'Ultra-Low Latency',      desc: 'WebRTC peer-to-peer keeps your voice under 80 ms — no buffering, no delays.',           gradient: 'from-yellow-500 to-orange-500' },
  { icon: Users,       title: 'Multi-Party Calling',    desc: 'Invite unlimited participants and manage video/audio per user in real time.',            gradient: 'from-purple-500 to-pink-600' },
  { icon: Globe,       title: 'Works Everywhere',       desc: 'No plugin, no install. Runs perfectly on every modern browser and device.',             gradient: 'from-cyan-500 to-blue-600' },
  { icon: MonitorPlay, title: 'Screen Sharing',         desc: 'Share your screen, window, or a browser tab in one click with zero lag.',               gradient: 'from-rose-500 to-red-600' },
];

export const STATS = [
  { value: '10K+',  label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<80ms', label: 'Latency' },
  { value: 'Free',  label: 'Always' },
];

export const TESTIMONIALS = [
  { name: 'Anya Sharma', role: 'Product Designer', stars: 5, text: 'ConvoX replaced Zoom for our entire studio. The call quality and screen sharing are unbelievably smooth.' },
  { name: 'Rahul Menon', role: 'Software Engineer', stars: 5, text: "The WebRTC performance is insane — demoed code with zero lag. Best free alternative out there." },
  { name: 'Priya Nair',  role: 'Marketing Lead',   stars: 5, text: 'No account needed for guests, the interface is clean, and it just works. Highly recommend.' },
];

export const CALL_STEPS = [
  { label: 'Connecting…',  Icon: Video,       status: 'Establishing connection', color: 'from-indigo-600 to-purple-700' },
  { label: 'Connected ✓',  Icon: Users,       status: 'Secure channel active',   color: 'from-emerald-600 to-teal-700' },
  { label: 'Screen Share', Icon: ScreenShare, status: 'Display streaming',       color: 'from-blue-600 to-indigo-700'  },
  { label: 'Recording',    Icon: Mic,         status: 'Audio captured',          color: 'from-rose-600 to-pink-700'    },
];

export const PARTICIPANTS = [
  { name: 'Alex K.',  initial: 'A', bg: 'from-indigo-500 to-blue-600',   muted: false, videoOff: false },
  { name: 'Priya S.', initial: 'P', bg: 'from-purple-500 to-pink-600',   muted: true,  videoOff: false },
  { name: 'Raj M.',   initial: 'R', bg: 'from-teal-500 to-emerald-600',  muted: false, videoOff: true  },
  { name: 'Sara L.',  initial: 'S', bg: 'from-rose-500 to-orange-500',   muted: true,  videoOff: false },
];

/* ═══════════════════════════════════════════════════════════
   THEME HELPERS — one source of truth for every color decision
═══════════════════════════════════════════════════════════ */
export const t = {
  // page & sections
  pageBg:       dark => dark ? 'bg-gray-950'  : 'bg-white',
  sectionAlt:   dark => dark ? 'bg-gray-900'  : 'bg-gray-50',
  sectionGrad:  dark => dark ? 'bg-gray-950'  : 'bg-gradient-to-b from-white to-indigo-50/30',
  heroBg:       dark => dark ? 'bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50',
  // text
  heading:      dark => dark ? 'text-white'       : 'text-gray-900',
  body:         dark => dark ? 'text-gray-400'    : 'text-gray-500',
  muted:        dark => dark ? 'text-gray-600'    : 'text-gray-400',
  // borders / dividers
  border:       dark => dark ? 'border-white/5'   : 'border-gray-100',
  divider:      dark => dark ? 'border-white/10'  : 'border-gray-100',
  // glass
  glass:        dark => dark ? 'dark-glass'        : 'glass-card',
  // card surface
  card:         dark => dark ? 'bg-gray-800/60 border border-white/10' : 'bg-white border border-gray-100',
  // nav ghost text
  navText:      dark => dark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-indigo-600',
  // badge
  badge:        dark => dark ? 'bg-indigo-900/40 border-indigo-700 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700',
  // feature step numbers
  stepNum:      dark => dark ? 'from-indigo-900 to-purple-900' : 'from-indigo-200 to-purple-200',
  // outline CTA button
  outlineBtn:   dark => dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 hover:border-indigo-400 hover:text-indigo-600 bg-white/70',
  // video frame accent (contrasts with theme: orange in light, blue-violet in dark)
  videoFrame:   dark => dark ? 'from-violet-500 via-indigo-400 to-blue-500' : 'from-orange-400 via-rose-400 to-indigo-500',
  videoGlow:    dark => dark ? 'bg-violet-500'  : 'bg-orange-400',
};
