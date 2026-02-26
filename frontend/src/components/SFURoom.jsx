import React, { useEffect, useState, useCallback } from 'react';
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
import axios from 'axios';
import { toast } from 'sonner';
import { Badge, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';

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
function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera,      withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 64px)' }}>
      <ParticipantTile />
    </GridLayout>
  );
}


export default function SFURoom({
  roomName, username, onEndCall, showChat, onToggleChat, newMessages, chatPanel,
}) {
  const [token,  setToken]  = useState(null);
  const [wsUrl,  setWsUrl]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]  = useState(null);

  /* Fetch LiveKit join token from backend */
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post(
          `${BACKEND_URL}/api/v1/livekit/token`,
          { roomName, participantName: username },
          { withCredentials: true }
        );
        setToken(data.token);
        setWsUrl(data.wsUrl);
      } catch (err) {
        console.error('LK token error:', err);
        setError('Failed to connect to the call server. Falling back to P2P.');
        toast.error('SFU connection failed — you may still be on P2P.');
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [roomName, username]);

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
        video={true}
        audio={true}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        onDisconnected={handleDisconnected}
      >
        <RoomAudioRenderer />

        {/* Video grid */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <VideoGrid />
        </div>

        {/* Bottom control bar — LiveKit built-in + custom End/Chat */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 20,
          background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(12px)',
          borderRadius: 999, padding: '6px 16px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <ControlBar
            style={{ background: 'transparent', border: 'none', padding: 0 }}
            controls={{ microphone: true, camera: true, screenShare: true, leave: false }}
          />

          {/* End Call */}
          <IconButton onClick={onEndCall} style={{ color: '#ef4444' }}>
            <CallEndIcon />
          </IconButton>

          {/* Chat toggle */}
          <Badge badgeContent={newMessages} max={99} color="warning">
            <IconButton onClick={onToggleChat} style={{ color: 'white' }}>
              <ChatIcon />
            </IconButton>
          </Badge>
        </div>
      </LiveKitRoom>

      {/* Chat panel — passed through, same component as P2P mode */}
      {showChat && chatPanel}
    </div>
  );
}
