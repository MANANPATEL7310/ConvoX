import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  useIsSpeaking,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { toast } from 'sonner';
import { useGenerateSFUTokenMutation } from '../hooks/api/useMeetings';
import { Badge, IconButton, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CallEndIcon from '@mui/icons-material/CallEnd';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PanToolIcon from '@mui/icons-material/PanTool';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import SubtitlesOffIcon from '@mui/icons-material/SubtitlesOff';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

/* ── Pulsing green ring shown on a speaking participant tile ── */
const speakingRingStyle = {
  position: 'absolute',
  inset: 0,
  borderRadius: 6,
  pointerEvents: 'none',
  zIndex: 10,
  boxShadow: 'inset 0 0 0 3px #22c55e, inset 0 0 24px rgba(34,197,94,0.35)',
  animation: 'sfuSpeakPulse 1s ease-in-out infinite alternate',
};

/* ── Single participant tile with speaking indicator ── */
function SpeakingParticipantTile({ participant }) {
  const isSpeaking = useIsSpeaking(participant);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ParticipantTile participant={participant} style={{ width: '100%', height: '100%' }} />

      {/* Green ring when speaking */}
      {isSpeaking && <div style={speakingRingStyle} />}

      {/* Mic badge */}
      {isSpeaking && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          width: 22, height: 22, borderRadius: '50%',
          background: '#22c55e', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 11,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

/* ── Custom video grid that fills the same layout as the P2P view ── */
function VideoGrid({ pinnedSid, onTogglePin }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera,      withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const cameraTracks = tracks.filter(t => t.source === Track.Source.Camera);
  const pinnedTrack = pinnedSid ? cameraTracks.find(t => t.participant.sid === pinnedSid) : null;
  const lastClickRef = useRef({ time: 0, sid: null });

  useEffect(() => {
    if (pinnedSid && !pinnedTrack) onTogglePin?.(null);
  }, [pinnedSid, pinnedTrack, onTogglePin]);

  if (pinnedTrack) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 6, padding: 6, background: '#0a0a0f' }}>
        <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
          <div
            onDoubleClick={() => onTogglePin?.(null)}
            style={{ width: '100%', height: '100%' }}
            title="Double-click to unpin"
          >
            <ParticipantTile trackRef={pinnedTrack} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{
            position: 'absolute', top: 12, left: 12,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(99,102,241,0.85)', color: 'white',
            fontSize: 12, fontWeight: 700,
          }}>
            📌 Pinned
          </div>
          <button
            onClick={() => onTogglePin?.(null)}
            style={{
              position: 'absolute', top: 12, right: 12,
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(15,23,42,0.75)', color: '#e5e7eb',
              border: '1px solid rgba(255,255,255,0.15)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Unpin
          </button>
        </div>
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', paddingBottom: 80 }}>
          {cameraTracks.filter(t => t.participant.sid !== pinnedSid).map((track) => (
            <div
              key={track.publication?.trackSid || track.participant.sid}
              style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#111827', aspectRatio: '16 / 9' }}
              onDoubleClick={() => onTogglePin?.(track.participant.sid)}
              title="Double-click to pin"
            >
              <ParticipantTile trackRef={track} style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleParticipantClick = (evt) => {
    if (!evt?.participant?.sid) return;
    const now = Date.now();
    if (lastClickRef.current.sid === evt.participant.sid && (now - lastClickRef.current.time) < 350) {
      onTogglePin?.(evt.participant.sid);
      lastClickRef.current = { time: 0, sid: null };
      return;
    }
    lastClickRef.current = { time: now, sid: evt.participant.sid };
  };

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 64px)' }}>
      <ParticipantTile onParticipantClick={handleParticipantClick} />
    </GridLayout>
  );
}


export default function SFURoom({
  roomName, username, videoEnabled, audioEnabled, onEndCall, showChat, onToggleChat, newMessages, chatPanel,
  isHost, waitlistCount, onToggleShareCard, onToggleAdmitPanel,
  onSendReaction, onToggleRaiseHand, isHandRaised, reactionOptions = [],
  captionsEnabled, onToggleCaptions, isRecording, onToggleRecording,
}) {
  const [token,  setToken]  = useState(null);
  const [wsUrl,  setWsUrl]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]  = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [pinnedSid, setPinnedSid] = useState(null);

  const { mutateAsync: generateToken } = useGenerateSFUTokenMutation();

  /* Fetch LiveKit join token from backend */
  useEffect(() => {
    let active = true;
    const fetchToken = async () => {
      try {
        setLoading(true);
        const data = await generateToken({
          roomName,
          participantName: username,
        });
        if (!active) return;
        setToken(data.token);
        setWsUrl(data.wsUrl);
      } catch (err) {
        if (!active) return;
        console.error('LK token error:', err);
        setError('Failed to connect to the call server. Falling back to P2P.');
        toast.error('SFU connection failed — you may still be on P2P.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchToken();
    return () => { active = false; };
  }, [roomName, username, generateToken]);

  const handleDisconnected = useCallback(() => {
    toast.info('Disconnected from SFU room.');
    onEndCall?.();
  }, [onEndCall]);

  /* Loading state */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, background: '#0f0f13', gap: 16 }}>
        <Loader2 style={{ width: 40, height: 40, color: '#6366f1', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Connecting to HD call server…</p>
      </div>
    );
  }

  /* Error state — let parent fall back */
  if (error || !token) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, background: '#0f0f13', gap: 12 }}>
        <p style={{ color: '#f87171', fontSize: 14 }}>{error || 'Could not get call token.'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', background: '#0f0f13', position: 'relative', overflow: 'hidden' }}>

      {/* Inject speaking ring animation for SFU mode */}
      <style>{`
        @keyframes sfuSpeakPulse {
          from {
            box-shadow: inset 0 0 0 2px #22c55e, inset 0 0 8px rgba(34,197,94,0.2);
            opacity: 0.8;
          }
          to {
            box-shadow: inset 0 0 0 3px #4ade80, inset 0 0 28px rgba(74,222,128,0.45);
            opacity: 1;
          }
        }
      `}</style>

      <LiveKitRoom
        serverUrl={wsUrl}
        token={token}
        connect={true}
        video={videoEnabled}
        audio={audioEnabled}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        onDisconnected={handleDisconnected}
      >
        <RoomAudioRenderer />

        {/* Video grid */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <VideoGrid pinnedSid={pinnedSid} onTogglePin={setPinnedSid} />
        </div>

        {/* Bottom control bar — primary actions only */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, zIndex: 20,
          background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(12px)',
          borderRadius: 30, padding: '6px 16px',
          border: '1px solid rgba(255,255,255,0.08)',
          width: '95%', maxWidth: 500
        }}>
          <ControlBar
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            controls={{ microphone: true, camera: true, screenShare: true, leave: false }}
          />

          {/* End Call */}
          <Tooltip title="End call" enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
            <IconButton onClick={onEndCall} style={{ color: '#ef4444' }}>
              <CallEndIcon />
            </IconButton>
          </Tooltip>

          {/* Chat toggle */}
          <Tooltip title="Open chat" enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
            <Badge badgeContent={newMessages} max={99} color="warning">
              <IconButton onClick={onToggleChat} style={{ color: 'white' }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </Tooltip>

          {/* Waiting room badge — host only */}
          {isHost && (
            <Tooltip title="Waiting room" enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
              <Badge badgeContent={waitlistCount} max={99} color="error">
                <IconButton
                  onClick={onToggleAdmitPanel}
                  style={{ color: waitlistCount > 0 ? '#fbbf24' : 'white' }}
                >
                  {/* Person queue icon */}
                  <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }} fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </IconButton>
              </Badge>
            </Tooltip>
          )}

        </div>

        {/* Side control bar — secondary actions */}
        <div className="absolute top-4 right-2 sm:right-4 md:right-[18px] md:top-1/2 md:-translate-y-1/2 flex flex-row md:flex-col gap-2 items-center z-20 bg-gray-900/90 backdrop-blur-md rounded-2xl py-1.5 px-2 md:py-2.5 md:px-2 border border-white/10 shadow-xl max-w-[95vw] overflow-visible">
          {isHost && (
            <Tooltip title={isRecording ? 'Stop recording' : 'Start recording'} enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
              <IconButton
                onClick={onToggleRecording}
                style={{ color: isRecording ? '#ef4444' : 'white' }}
              >
                <FiberManualRecordIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Captions */}
          <Tooltip title={captionsEnabled ? 'Turn off captions' : 'Turn on captions'} enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
            <IconButton
              onClick={onToggleCaptions}
              style={{ color: captionsEnabled ? '#a5b4fc' : 'white' }}
            >
              {captionsEnabled ? <SubtitlesIcon /> : <SubtitlesOffIcon />}
            </IconButton>
          </Tooltip>

          {/* Reactions */}
          <div style={{ position: 'relative' }}>
            <Tooltip title="Send reaction" enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
              <IconButton
                onClick={() => setShowReactionPicker((p) => !p)}
                style={{ color: 'white' }}
              >
                <EmojiEmotionsIcon />
              </IconButton>
            </Tooltip>
            {showReactionPicker && (
              <div
                style={{
                  position: 'absolute',
                  right: 46,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 999,
                  padding: '6px 10px',
                  display: 'flex',
                  gap: 8,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                  zIndex: 30,
                }}
              >
                {(reactionOptions.length ? reactionOptions : ['👍','🎉','❤️']).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { setShowReactionPicker(false); onSendReaction?.(emoji); }}
                    style={{
                      fontSize: 20,
                      lineHeight: '20px',
                      padding: '2px 4px',
                      borderRadius: 8,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Raise hand */}
          <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'} enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
            <IconButton
              onClick={onToggleRaiseHand}
              style={{ color: isHandRaised ? '#f59e0b' : 'white' }}
            >
              {isHandRaised ? <PanToolIcon /> : <PanToolOutlinedIcon />}
            </IconButton>
          </Tooltip>

          {/* Share button — host only */}
          {isHost && (
            <Tooltip title="Invite participants" enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
              <IconButton
                onClick={onToggleShareCard}
                style={{ color: '#a78bfa' }}
              >
                <PersonAddIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </LiveKitRoom>

      {/* Chat panel — passed through, same component as P2P mode */}
      {showChat && chatPanel}
    </div>
  );
}
