import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, UserX, Mic, MicOff, Video, VideoOff, Shield, X, Share2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function HostControlPanel({
  waitlist = [],
  participants = [],
  mediaStates = {},
  onAdmit,
  onReject,
  onMuteUser,
  onUnmuteUser,
  onVideoOffUser,
  onVideoOnUser,
  onMuteAll,
  onVideoOffAll,
  onOpenShare,
  onClose,
}) {
  const { dark } = useTheme();

  return (
    <AnimatePresence>
      <motion.div
        key="host-panel"
        initial={{ x: -340, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -340, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute left-4 top-20 h-[70vh] w-[360px] rounded-2xl border shadow-2xl overflow-hidden z-50 ${
          dark
            ? 'bg-gray-900/95 border-white/[0.08] shadow-black/60 backdrop-blur-xl'
            : 'bg-white/95 border-gray-200/80 shadow-gray-400/20 backdrop-blur-xl'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          dark ? 'border-white/[0.06]' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Host Controls</p>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                Waiting room + participants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenShare}
              className={`px-3 h-8 rounded-full text-xs font-semibold flex items-center gap-1 ${
                dark ? 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={onClose}
              className={`px-3 h-8 rounded-full text-xs font-semibold flex items-center gap-1 ${
                dark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(70vh-64px)]">
          {/* Waiting Room (30%) */}
          <div className={`flex-1 basis-1/3 border-b ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className={`w-4 h-4 ${dark ? 'text-amber-300' : 'text-amber-500'}`} />
                <span className={dark ? 'text-white' : 'text-gray-900'}>Waiting Room</span>
              </div>
              {waitlist.length > 1 && (
                <button
                  onClick={() => waitlist.forEach(({ socketId }) => onAdmit(socketId))}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                    dark ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  Admit All ({waitlist.length})
                </button>
              )}
            </div>
            <div className="px-4 pb-3 max-h-full overflow-y-auto">
              {waitlist.length === 0 ? (
                <p className={`text-xs px-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No one is waiting.
                </p>
              ) : (
                waitlist.map(({ socketId, username }) => (
                  <div key={socketId} className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 ${
                    dark ? 'bg-white/[0.04]' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{(username || '?').charAt(0).toUpperCase()}</span>
                      </div>
                      <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{username}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onAdmit(socketId)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReject(socketId)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          dark ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Participants (70%) */}
          <div className="flex-[2] basis-2/3">
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className={`w-4 h-4 ${dark ? 'text-indigo-300' : 'text-indigo-500'}`} />
                <span className={dark ? 'text-white' : 'text-gray-900'}>Participants</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onMuteAll}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                    dark ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  }`}
                >
                  Mute All
                </button>
                <button
                  onClick={onVideoOffAll}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                    dark ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  Stop Video
                </button>
              </div>
            </div>
            <div className="px-4 pb-3 max-h-full overflow-y-auto">
              {participants.length === 0 ? (
                <p className={`text-xs px-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No participants yet.
                </p>
              ) : (
                participants.map((p) => {
                  const state = mediaStates[p.socketId] || {};
                  const audioOn = state.audioEnabled !== false;
                  const videoOn = state.videoEnabled !== false;
                  return (
                    <div key={p.socketId} className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 ${
                      dark ? 'bg-white/[0.04]' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{(p.username || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                            {p.username} {p.isSelf ? '(You)' : ''}
                          </p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className={`inline-flex items-center gap-1 ${audioOn ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {audioOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                              {audioOn ? 'Mic on' : 'Muted'}
                            </span>
                            <span className={`inline-flex items-center gap-1 ${videoOn ? 'text-indigo-300' : 'text-rose-400'}`}>
                              {videoOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                              {videoOn ? 'Video on' : 'Video off'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!p.isSelf && (
                        <div className="flex gap-1.5">
                          {audioOn ? (
                            <button
                              onClick={() => onMuteUser(p.socketId)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                dark ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                              title="Mute"
                            >
                              <MicOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onUnmuteUser(p.socketId)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                dark ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                              title="Unmute"
                            >
                              <Mic className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {videoOn ? (
                            <button
                              onClick={() => onVideoOffUser(p.socketId)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                dark ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              }`}
                              title="Stop video"
                            >
                              <VideoOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onVideoOnUser(p.socketId)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                dark ? 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                              }`}
                              title="Start video"
                            >
                              <Video className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
