/**
 * ChatPanel — completely self-contained chat component.
 *
 * WHY isolated: The parent VideoMeet holds WebRTC state (peer connections,
 * remote streams, etc.).  If the message input lived there, every keystroke
 * would call setState → re-render the whole tree → blink / re-create videos.
 *
 * By keeping the input state (draft, typingUsers) inside this component the
 * parent is only re-rendered when a complete message arrives, not on every key.
 */

import React, {
  useState, useEffect, useRef, useCallback, memo
} from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── helper: generate a stable avatar colour from a username string ─── */
const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-rose-500',   'bg-amber-500',  'bg-cyan-500',
];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/* ─── Typing indicator dots ─── */
function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

/* ─── Single message bubble ─── */
const Bubble = memo(({ msg, isMine }) => {
  const color = avatarColor(msg.sender);
  return (
    <div className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar — only for others */}
      {!isMine && (
        <div className={`flex-shrink-0 w-7 h-7 rounded-full ${color} flex items-center justify-center text-[10px] font-bold text-white`}>
          {initials(msg.sender)}
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name — always show for others, never for self */}
        {!isMine && (
          <span className="text-[10px] font-semibold text-gray-400 px-1">{msg.sender}</span>
        )}

        {/* Bubble */}
        <div className={`px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
          isMine
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-gray-700 text-gray-100 rounded-bl-sm'
        }`}>
          {msg.data}
        </div>

        {/* Timestamp */}
        <span className="text-[9px] text-gray-600 px-1">{msg.time}</span>
      </div>
    </div>
  );
});
Bubble.displayName = 'Bubble';

/* ─── Main ChatPanel component ─── */
const ChatPanel = memo(({ messages, username, socketRef, onClose, onNewMessage }) => {
  const [draft, setDraft]           = useState('');
  const [typingUsers, setTypingUsers] = useState([]); // names of users currently typing
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  /* Auto-scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  /* Listen for typing events from other users */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleTyping = (name) => {
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    };
    const handleStopTyping = (name) => {
      setTypingUsers((prev) => prev.filter((n) => n !== name));
    };

    socket.on('user-typing', handleTyping);
    socket.on('user-stop-typing', handleStopTyping);
    return () => {
      socket.off('user-typing', handleTyping);
      socket.off('user-stop-typing', handleStopTyping);
    };
  }, [socketRef]);

  /* Emit typing / stop-typing */
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

  /* Send message */
  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('chat-message', text, username);
    setDraft('');
    // Cancel typing indicator immediately on send
    clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    socketRef.current?.emit('stop-typing', username);
  }, [draft, socketRef, username]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }, [send]);

  /* Build typing label */
  const typingLabel = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
    : typingUsers.length > 2
    ? 'Several people are typing'
    : null;

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700/50 flex flex-col flex-shrink-0 h-full">

      {/* ── Header ── */}
      <div className="px-4 py-3.5 border-b border-gray-700/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">In-call chat</h3>
          {messages.length > 0 && (
            <span className="text-[10px] bg-indigo-600 text-white rounded-full px-1.5 py-0.5 font-medium">
              {messages.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <MessageCircle className="w-10 h-10 text-gray-600" />
            <p className="text-gray-500 text-sm">No messages yet.<br />Say hello 👋</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <Bubble key={i} msg={msg} isMine={msg.sender === username} />
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingLabel && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-2 pl-1"
            >
              <TypingDots />
              <span className="text-[11px] text-gray-500 italic">{typingLabel}…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-700/60 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKey}
            placeholder="Message…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all max-h-28 scrollbar-thin"
            style={{ overflowY: draft.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5 text-right">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
export default ChatPanel;
