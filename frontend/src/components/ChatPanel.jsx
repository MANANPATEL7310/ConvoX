/**
 * ChatPanel — isolated, memoized chat component.
 *
 * Features:
 *  - WhatsApp-style bubbles (own=right/indigo, others=left/gray + avatar + name)
 *  - "Send to" Zoom-style dropdown: Everyone or a specific participant
 *  - Private (direct) messages routed via socket to a single user
 *  - Inline emoji picker (no external library — lightweight grid)
 *  - Animated typing indicator (3 bouncing dots + label)
 *  - Slide-in panel animation, staggered message entry
 *  - Auto-scroll, Enter-to-send, Shift+Enter for newline
 *  - DM label on message bubbles ("Private → Alice" / "Private from Alice")
 *
 * Input state lives here, NOT in VideoMeet, so typing never re-renders videos.
 */

import React, {
  useState, useEffect, useRef, useCallback, memo
} from 'react';
import { Send, X, MessageCircle, Smile, ChevronDown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Emoji data (lightweight — no external lib) ─── */
const EMOJI_CATEGORIES = {
  '😀': ['😀','😂','🤣','😊','😍','🥰','😎','🤔','😅','😭','😤','🥳','😴','🤯','🫠'],
  '👍': ['👍','👎','👏','🙌','🤝','✌️','🤞','💪','🙏','👋','🫶','❤️','🔥','⭐','🎉'],
  '🐶': ['🐶','🐱','🐼','🐨','🦊','🐸','🦁','🐯','🦄','🐙','🦋','🌸','🌈','🍕','☕'],
};

/* ─── Avatar helpers ─── */
const AVATAR_COLORS = [
  'bg-indigo-500','bg-purple-500','bg-emerald-500',
  'bg-rose-500','bg-amber-500','bg-cyan-500','bg-pink-500','bg-teal-500',
];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

/* ─── Typing dots ─── */
function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

/* ─── Single message bubble (memoized) ─── */
const Bubble = memo(({ msg, isMine }) => {
  const color = avatarColor(msg.sender);
  const isDM = !!msg.toName || !!msg.fromName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar — only for others */}
      {!isMine && (
        <div className={`flex-shrink-0 w-7 h-7 rounded-full ${color} flex items-center justify-center text-[10px] font-bold text-white shadow-md`}>
          {initials(msg.sender)}
        </div>
      )}

      <div className={`max-w-[76%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name */}
        {!isMine && (
          <span className="text-[10px] font-semibold text-gray-400 px-1">{msg.sender}</span>
        )}

        {/* DM label */}
        {isDM && (
          <div className={`flex items-center gap-1 text-[9px] font-medium px-1 ${isMine ? 'text-indigo-400' : 'text-purple-400'}`}>
            <Lock className="w-2.5 h-2.5" />
            {isMine ? `Private → ${msg.toName}` : `Private from ${msg.sender}`}
          </div>
        )}

        {/* Bubble */}
        <div className={`px-3 py-2 rounded-2xl text-sm leading-snug break-words shadow-sm ${
          isMine
            ? isDM
              ? 'bg-purple-700/80 text-white rounded-br-sm ring-1 ring-purple-500/40'
              : 'bg-indigo-600 text-white rounded-br-sm'
            : isDM
              ? 'bg-gray-800 text-purple-200 rounded-bl-sm ring-1 ring-purple-500/30'
              : 'bg-gray-700/80 text-gray-100 rounded-bl-sm'
        }`}>
          {msg.data}
        </div>

        {/* Time */}
        <span className="text-[9px] text-gray-600 px-1">{msg.time}</span>
      </div>
    </motion.div>
  );
});
Bubble.displayName = 'Bubble';

/* ─── Main ChatPanel ─── */
const ChatPanel = memo(({
  messages, username, socketRef, socketIdRef,
  userNames = {}, onClose, onNewMessage
}) => {
  const [draft, setDraft]               = useState('');
  const [sendTo, setSendTo]             = useState('everyone'); // 'everyone' | socketId
  const [showSendTo, setShowSendTo]     = useState(false);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [emojiTab, setEmojiTab]         = useState('😀');
  const [typingUsers, setTypingUsers]   = useState([]);
  const [dmMessages, setDmMessages]     = useState([]); // private msgs keyed here

  const bottomRef    = useRef(null);
  const typingTimer  = useRef(null);
  const isTypingRef  = useRef(false);
  const textareaRef  = useRef(null);

  /* All displayed messages = public + DMs merged and sorted by arrival */
  const allMessages = [...messages, ...dmMessages].sort((a, b) => (a._idx ?? 0) - (b._idx ?? 0));

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, dmMessages, typingUsers]);

  /* Socket listeners for typing + private msgs */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleTyping     = (name) => setTypingUsers(p => p.includes(name) ? p : [...p, name]);
    const handleStopTyping = (name) => setTypingUsers(p => p.filter(n => n !== name));
    const handlePrivate    = ({ data, sender, fromSocketId, toSocketId, isMine: mine }) => {
      const toName = toSocketId ? (userNames[toSocketId] || 'Someone') : undefined;
      const fromName = !mine ? sender : undefined;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDmMessages(prev => [...prev, { data, sender, time, toName, fromName, _idx: Date.now() + Math.random() }]);
      if (!mine) onNewMessage?.();
    };

    socket.on('user-typing',       handleTyping);
    socket.on('user-stop-typing',  handleStopTyping);
    socket.on('private-message',   handlePrivate);
    return () => {
      socket.off('user-typing',      handleTyping);
      socket.off('user-stop-typing', handleStopTyping);
      socket.off('private-message',  handlePrivate);
    };
  }, [socketRef, userNames, onNewMessage]);

  /* Draft change → emit typing */
  const handleDraftChange = useCallback((e) => {
    setDraft(e.target.value);
    const socket = socketRef.current;
    if (!socket) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', username);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop-typing', username);
    }, 1500);
  }, [socketRef, username]);

  /* Send */
  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || !socketRef.current) return;

    if (sendTo === 'everyone') {
      socketRef.current.emit('chat-message', text, username);
    } else {
      socketRef.current.emit('private-message', { toSocketId: sendTo, data: text, sender: username });
    }

    setDraft('');
    clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    socketRef.current.emit('stop-typing', username);
    textareaRef.current?.focus();
  }, [draft, socketRef, username, sendTo]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }, [send]);

  const insertEmoji = useCallback((emoji) => {
    setDraft(d => d + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }, []);

  /* Participants for "Send to" dropdown (exclude self) */
  const participants = Object.entries(userNames).filter(
    ([id]) => id !== socketIdRef?.current
  );

  const sendToLabel = sendTo === 'everyone'
    ? 'Everyone'
    : (userNames[sendTo] || 'Direct message');

  /* Typing text */
  const typingLabel = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} & ${typingUsers[1]} are typing`
    : typingUsers.length > 2
    ? 'Several people are typing'
    : null;

  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="w-80 bg-gray-900/95 border-l border-gray-700/50 flex flex-col flex-shrink-0 h-full backdrop-blur-sm"
    >

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-gray-700/60 flex items-center justify-between flex-shrink-0 bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-none">Chat</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{messages.length + dmMessages.length} messages</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">No messages yet</p>
              <p className="text-gray-600 text-xs mt-1">Say hello to the room 👋</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {allMessages.map((msg, i) => (
              <Bubble
                key={msg._idx ?? i}
                msg={msg}
                isMine={msg.sender === username}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingLabel && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 pl-9"
            >
              <div className="bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2">
                <TypingDots />
                <span className="text-[11px] text-gray-400 italic">{typingLabel}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── Send To selector ── */}
      <div className="px-3 pt-2 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => { setShowSendTo(v => !v); setShowEmoji(false); }}
            style={{
              background: sendTo === 'everyone' ? '#1e2538' : '#2d1b4e',
              border: `1px solid ${sendTo === 'everyone' ? '#4b5563' : '#7c3aed55'}`,
              color: '#fff',
              borderRadius: '10px',
              padding: '8px 12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {sendTo !== 'everyone' && <Lock style={{ width: 12, height: 12, color: '#c4b5fd' }} />}
              <span style={{ color: '#9ca3af', fontWeight: 500 }}>To:</span>
              <span style={{ fontWeight: 700, color: sendTo === 'everyone' ? '#fff' : '#ddd6fe' }}>
                {sendToLabel}
              </span>
            </div>
            <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af', transform: showSendTo ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          <AnimatePresence>
            {showSendTo && (
              <motion.div
                initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-0 right-0 bg-[#1e2130] border border-gray-600 rounded-2xl shadow-2xl overflow-hidden z-50 origin-bottom"
              >
                {/* Everyone */}
                <button
                  onClick={() => { setSendTo('everyone'); setShowSendTo(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', fontSize: 12, cursor: 'pointer',
                    background: sendTo === 'everyone' ? 'rgba(99,102,241,0.18)' : 'transparent',
                    color: sendTo === 'everyone' ? '#a5b4fc' : '#f3f4f6',
                    border: 'none', transition: 'background 0.12s',
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>👥</div>
                  <span style={{ fontWeight: 600 }}>Everyone</span>
                  {sendTo === 'everyone' && <span style={{ marginLeft: 'auto', color: '#818cf8', fontWeight: 700 }}>✓</span>}
                </button>

                {/* Divider */}
                {participants.length > 0 && (
                  <div className="px-3 py-1 border-t border-white/10">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Direct message</p>
                  </div>
                )}

                {/* Individual participants */}
                {participants.map(([id, name]) => {
                  const color = avatarColor(name);
                  return (
                  <button
                      key={id}
                      onClick={() => { setSendTo(id); setShowSendTo(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', fontSize: 12, cursor: 'pointer',
                        background: sendTo === id ? 'rgba(124,58,237,0.18)' : 'transparent',
                        color: sendTo === id ? '#ddd6fe' : '#f3f4f6',
                        border: 'none', transition: 'background 0.12s',
                      }}
                    >
                      <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-[9px] font-bold text-white`}>
                        {initials(name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{name}</span>
                      {sendTo === id && (
                        <><Lock style={{ width: 10, height: 10, marginLeft: 4, color: '#c4b5fd' }} /><span style={{ marginLeft: 'auto', color: '#c4b5fd', fontWeight: 700 }}>✓</span></>
                      )}
                    </button>
                  );
                })}

                {participants.length === 0 && (
                  <p className="px-3 py-3 text-[10px] text-gray-500 text-center">No other participants yet</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Emoji picker ── */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="mx-3 mb-1 bg-[#1e2130] border border-gray-600 rounded-2xl shadow-2xl overflow-hidden flex-shrink-0"
          >
            {/* Category tabs */}
            <div className="flex border-b border-gray-600">
              {Object.keys(EMOJI_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => setEmojiTab(cat)}
                  className={`flex-1 py-2.5 text-lg transition-all ${
                    emojiTab === cat ? 'bg-gray-700 shadow-inner' : 'hover:bg-gray-700/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Emoji grid */}
            <div className="grid grid-cols-5 gap-0.5 p-2.5">
              {EMOJI_CATEGORIES[emojiTab].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="text-xl p-2 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input ── */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0">
        {/* Private mode banner */}
        {sendTo !== 'everyone' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 text-[10px] text-purple-400 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2.5 py-1 mb-1.5"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>Private message to <strong>{userNames[sendTo] || 'participant'}</strong></span>
          </motion.div>
        )}

        <div className="flex items-end gap-2">
          {/* Emoji toggle */}
          <button
            onClick={() => { setShowEmoji(v => !v); setShowSendTo(false); }}
            title="Emoji"
            style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 10,
              background: showEmoji ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1f2937',
              border: showEmoji ? '1px solid #818cf8' : '1px solid #374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 17, transition: 'all 0.15s',
              lineHeight: 1,
            }}
          >
            😊
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKey}
            placeholder={sendTo === 'everyone' ? 'Message everyone…' : `Message ${userNames[sendTo] || 'participant'}…`}
            className={`flex-1 bg-gray-800 border rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-1 transition-all max-h-24 ${
              sendTo !== 'everyone'
                ? 'border-purple-700/50 focus:border-purple-500 focus:ring-purple-500/30'
                : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/30'
            }`}
          />

          {/* Send */}
          <button
            onClick={send}
            disabled={!draft.trim()}
            title="Send message"
            style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 10,
              background: draft.trim()
                ? sendTo !== 'everyone'
                  ? 'linear-gradient(135deg,#7c3aed,#9333ea)'
                  : 'linear-gradient(135deg,#4f46e5,#6366f1)'
                : '#1f2937',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: draft.trim() ? 'pointer' : 'not-allowed',
              opacity: draft.trim() ? 1 : 0.35,
              transition: 'all 0.15s',
              transform: 'scale(1)',
            }}
          >
            <span style={{
              fontSize: 16,
              color: '#ffffff',
              display: 'block',
              lineHeight: 1,
              userSelect: 'none',
            }}>➤</span>
          </button>
        </div>
        <p className="text-[9px] text-gray-700 mt-1.5 text-right">Enter to send · Shift+Enter newline</p>
      </div>
    </motion.div>
  );
});

ChatPanel.displayName = 'ChatPanel';
export default ChatPanel;
