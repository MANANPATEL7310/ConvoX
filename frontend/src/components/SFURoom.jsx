/**
 * SFURoom — LiveKit-powered video conference component.
 *
 * Used when participant count crosses P2P_THRESHOLD (5 users).
 * Fetches a signed token from the backend, then connects to the LiveKit SFU.
 *
 * Props:
 *   roomName       — derived from window.location.href (same as P2P roomPath)
 *   username       — current user's display name
 *   onEndCall      — callback when user clicks "End Call"
 *   showChat       — whether the chat panel is open
 *   onToggleChat   — toggle chat panel
 *   newMessages    — unread message badge count
 *   chatPanel      — the <ChatPanel /> element (passed through, stays rendered)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';

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
