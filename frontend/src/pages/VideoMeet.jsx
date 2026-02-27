import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../contexts/useAuth';
import styles from "../styles/videoComponent.module.css";
import { toast } from "sonner";
import ChatPanel from '../components/ChatPanel';
import SFURoom from '../components/SFURoom';
import ModeIndicator from '../components/ModeIndicator';
import { useMeetingMode } from '../hooks/useMeetingMode';
import { useActiveSpeaker } from '../hooks/useActiveSpeaker';
import ShareMeetingCard from '../components/ShareMeetingCard';
import PreJoinCard from '../components/PreJoinCard';
import WaitingRoomScreen from '../components/WaitingRoomScreen';
import HostAdmitPanel from '../components/HostAdmitPanel';

const SERVER_URL = "http://localhost:8000";
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  // Refs for proper cleanup and state management
  const socketRef      = useRef(null);
  const peersRef       = useRef({});
  const localStreamRef = useRef(null);   // active camera stream (never the screen)
  const cameraStreamRef = useRef(null);  // always the camera, even during screen share
  const screenStreamRef = useRef(null);  // screen share stream while active
  const localVideoRef  = useRef(null);
  const socketIdRef    = useRef(null);

  // State for UI
  const [remoteStreams,  setRemoteStreams]  = useState([]);
  const [userNames,      setUserNames]     = useState({});
  const [messages,       setMessages]      = useState([]);
  const [showModal,      setModal]         = useState(false);
  const [newMessages,    setNewMessages]   = useState(0);
  const [videoEnabled,   setVideoEnabled]  = useState(true);
  const [audioEnabled,   setAudioEnabled]  = useState(true);
  const [screenSharing,  setScreenSharing] = useState(false);
  const [lobbyUsername,  setLobbyUsername] = useState("");
  const [isConnected,    setIsConnected]   = useState(false);
  // activeSharingId: 'local' = self sharing | socketId = remote peer sharing | null = nobody
  const [activeSharingId, setActiveSharingId] = useState(null);
  // Host role — only the host sees the "Share" button
  const [isHost, setIsHost] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  // ── Waiting room state ──
  // phase: 'prejoin' | 'waiting' | 'rejected' | 'in-meeting'
  const [phase, setPhase] = useState('prejoin');
  const [waitlist, setWaitlist] = useState([]);     // host only
  const [showAdmitPanel, setShowAdmitPanel] = useState(false);
  const prejoinMediaRef = useRef({ videoEnabled: true, audioEnabled: true, stream: null });

  const { user } = useAuth();

  // Use derived state for display username
  const username = user?.username || lobbyUsername;
  const shouldShowLobby = !user?.username && !isConnected;

  // ── Hybrid architecture mode (P2P | SFU) ──
  const { mode, participantCount, upgrading } = useMeetingMode(socketRef);

  // ── Active speaker detection (P2P mode only) ──
  const activeSpeakers = useActiveSpeaker(remoteStreams);

  // Derive a stable room name from the URL for LiveKit room identity
  const roomName = window.location.href;

  // Network connection monitoring
  useEffect(() => {
    const handleOffline = () => toast.error("You are offline. Connection lost.");
    const handleOnline = () => toast.success("Back online. Meeting should resume normally.");
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  /* -------------------- MEDIA -------------------- */

  const getLocalMedia = useCallback(async (constraints = { video: true, audio: true }) => {
    if (localStreamRef.current) {
      // Check if current stream meets constraints
      const hasVideo = localStreamRef.current.getVideoTracks().length > 0;
      const hasAudio = localStreamRef.current.getAudioTracks().length > 0;
      
      // Return existing stream if it meets requirements
      if ((!constraints.video || hasVideo) && (!constraints.audio || hasAudio)) {
        return localStreamRef.current;
      }
      
      // Stop current stream if it doesn't meet requirements
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Update video/audio states
      setVideoEnabled(constraints.video && stream.getVideoTracks().length > 0);
      setAudioEnabled(constraints.audio && stream.getAudioTracks().length > 0);

      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Failed to access camera/microphone. Please allow browser permissions and try again.");
      throw error;
    }
  }, []);

  /**
   * startScreenShare — properly handles screen share:
   * - Keeps camera stream alive (no hall-of-mirrors)
   * - Replaces ONLY the video track in each peer connection
   * - Local corner still shows camera, not the screen
   */
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false, // no system audio — avoids duplicate audio track bug
      });

      screenStreamRef.current = screenStream;
      // Save camera ref so we can restore it
      cameraStreamRef.current = localStreamRef.current;

      // ── Replace video track in every peer connection ──
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(pc => {
        if (pc.signalingState === 'closed') return;
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenVideoTrack);
        }
        // NOTE: intentionally NOT adding audio — camera mic stays active
      });

      // ── Local corner keeps showing camera (no mirror) ──
      // localVideoRef already has cameraStream — do NOT change it

      // Handle browser's built-in "Stop sharing" button
      screenVideoTrack.onended = () => stopScreenShare();

      setScreenSharing(true);
      setActiveSharingId('local');
      socketRef.current?.emit('screen-share-toggled', { sharing: true });
      toast.success('Screen sharing started');

      return screenStream;
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('getDisplayMedia error:', err);
        toast.error('Could not share screen.');
      }
      throw err;
    }
  }, []);

  /**
   * stopScreenShare — restores camera track to all peers
   */
  const stopScreenShare = useCallback(() => {
    const cameraStream = cameraStreamRef.current;
    if (!cameraStream) return;

    // Stop all screen tracks
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;

    const cameraVideoTrack = cameraStream.getVideoTracks()[0];
    if (cameraVideoTrack) {
      Object.values(peersRef.current).forEach(pc => {
        if (pc.signalingState === 'closed') return;
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) videoSender.replaceTrack(cameraVideoTrack);
      });
    }

    // Restore local stream pointer
    localStreamRef.current = cameraStream;

    setScreenSharing(false);
    setActiveSharingId(null);
    socketRef.current?.emit('screen-share-toggled', { sharing: false });
    toast.info('Screen sharing stopped');
  }, []);

  /* -------------------- PEER CONNECTION -------------------- */

  const createPeerConnection = useCallback((socketId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    // Enhanced codec configuration for higher quality
    pc.setConfiguration({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ],
      // Enable higher bitrate and better codecs
      sdpSemantics: 'unified-plan'
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("signal", socketId, {
          ice: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStreams((prev) => {
          if (prev.find((v) => v.id === socketId)) {
            return prev;
          }
          return [...prev, { id: socketId, stream: stream }];
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log(`Connection with ${socketId} failed`);
      }
    };

    peersRef.current[socketId] = pc;
    return pc;
  }, []);

  /* -------------------- MEDIA CONTROLS -------------------- */

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled;
        videoTracks[0].enabled = enabled;
        setVideoEnabled(enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks[0].enabled = enabled;
        setAudioEnabled(enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      stopScreenShare();
    } else {
      try {
        await startScreenShare();
      } catch (_) { /* user cancelled or error already toasted */ }
    }
  }, [screenSharing, startScreenShare, stopScreenShare]);

  const endCall = useCallback(() => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Navigate away
    window.location.href = "/home";
  }, []);

  /* -------------------- CHAT -------------------- */

  const addMessage = useCallback((data, sender, socketIdSender) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender, data, time }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  }, []);

  /* -------------------- WAITING ROOM HANDLERS -------------------- */

  const handleAdmitUser = useCallback((socketId) => {
    socketRef.current?.emit('admit-user', { socketId });
  }, []);

  const handleRejectUser = useCallback((socketId) => {
    socketRef.current?.emit('reject-user', { socketId });
  }, []);

  /**
   * connectToMeeting — called after admitted event (or instantly for host).
   * Applies pre-chosen media settings then emits join-call.
   */
  const connectToMeeting = useCallback(async () => {
    const { videoEnabled: v, audioEnabled: a, stream } = prejoinMediaRef.current;
    try {
      let s = stream;
      if (!s) {
        s = await navigator.mediaDevices.getUserMedia({ video: v, audio: a });
      }
      localStreamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;

      // Apply pre-join toggle state to tracks
      s.getVideoTracks().forEach(t => { t.enabled = v; });
      s.getAudioTracks().forEach(t => { t.enabled = a; });
      setVideoEnabled(v);
      setAudioEnabled(a);

      socketRef.current?.emit('join-call', window.location.href, username);
      setPhase('in-meeting');
    } catch (err) {
      console.error('connectToMeeting error:', err);
    }
  }, [username]);

  /* -------------------- SOCKET -------------------- */

  useEffect(() => {
    if (shouldShowLobby) return;
    if (phase === 'prejoin') return; // wait for PreJoinCard "Join" click

    const socket = io(SERVER_URL, { secure: false, withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', async () => {
      socketIdRef.current = socket.id;
      // Emit waiting-room-join instead of join-call directly
      socket.emit('waiting-room-join', window.location.href, username);
    });

    // ── Participant: server confirmed they are in the waiting room ──
    socket.on('in-waiting-room', () => {
      setPhase('waiting');
    });

    // ── User got admitted (host's signal, or auto for first user) ──
    socket.on('admitted', async () => {
      await connectToMeeting();
    });

    // ── User got rejected ──
    socket.on('rejected', () => {
      setPhase('rejected');
    });

    // ── Host: updated waitlist ──
    socket.on('waiting-room-update', ({ waitlist: wl }) => {
      setWaitlist(wl);
      // Auto-open the panel when anyone is waiting (stale-closure safe)
      if (wl.length > 0) setShowAdmitPanel(true);
    });

    // ── In-meeting users: notification that someone is waiting ──
    socket.on('waiting-room-notification', ({ username: wUsername, count }) => {
      toast(`👋 ${wUsername} is waiting to join`, {
        description: count > 1 ? `${count} people in waiting room` : undefined,
        duration: 6000,
      });
    });

    socket.on('role-assigned', ({ role }) => {
      setIsHost(role === 'host');
      if (role === 'host') toast.success('You are the host of this meeting');
    });

    socket.on('user-joined', async (id, clients, usernames) => {
      // Update usernames
      if (usernames) {
        setUserNames(usernames);
      }

      for (const clientId of clients) {
        if (clientId !== socket.id && !peersRef.current[clientId]) {
          const pc = createPeerConnection(clientId);
          await getLocalMedia();
          const stream = localStreamRef.current;

          // Check for existing tracks to prevent duplicates
          const existingKinds = pc.getSenders().map(s => s.track?.kind).filter(Boolean);
          
          stream.getTracks().forEach((track) => {
            if (!existingKinds.includes(track.kind)) {
              pc.addTrack(track, stream);
            }
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('signal', clientId, JSON.stringify({ sdp: pc.localDescription }));
        }
      }
    });

    socket.on('signal', async (fromId, message) => {
      try {
        console.log('Received signal from:', fromId, message);
        const data = typeof message === 'string' ? JSON.parse(message) : message;
        let pc = peersRef.current[fromId];
        if (!pc) {
          console.log('Creating new peer connection for:', fromId);
          pc = createPeerConnection(fromId);
        }

        if (data.sdp) {
          console.log('Processing SDP:', data.sdp.type, 'State:', pc.signalingState);
          // Check if we can set remote description based on current state
          if (pc.signalingState === 'stable' && data.sdp.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Remote description set for offer');
            
            // Process any queued ICE candidates
            if (pc.iceCandidatesQueue && pc.iceCandidatesQueue.length > 0) {
              for (const candidate of pc.iceCandidatesQueue) {
                await pc.addIceCandidate(candidate);
              }
              pc.iceCandidatesQueue = [];
            }
            
            await getLocalMedia();
            const stream = localStreamRef.current;
            
            // Check for existing tracks to prevent duplicates
            const existingKinds = pc.getSenders().map(s => s.track?.kind).filter(Boolean);
            
            stream.getTracks().forEach((track) => {
              if (!existingKinds.includes(track.kind)) {
                pc.addTrack(track, stream);
              }
            });

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('Answer created and set');

            socket.emit('signal', fromId, JSON.stringify({ sdp: pc.localDescription }));
          } else if (pc.signalingState === 'have-remote-offer' && data.sdp.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Remote description set for answer');
            
            // Process any queued ICE candidates
            if (pc.iceCandidatesQueue && pc.iceCandidatesQueue.length > 0) {
              for (const candidate of pc.iceCandidatesQueue) {
                await pc.addIceCandidate(candidate);
              }
              pc.iceCandidatesQueue = [];
            }
          } else if (pc.signalingState === 'have-local-offer' && data.sdp.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Remote description set for answer (have-local-offer state)');
            
            // Process any queued ICE candidates
            if (pc.iceCandidatesQueue && pc.iceCandidatesQueue.length > 0) {
              for (const candidate of pc.iceCandidatesQueue) {
                await pc.addIceCandidate(candidate);
              }
              pc.iceCandidatesQueue = [];
            }
          } else if (pc.signalingState === 'stable' && data.sdp.type === 'answer') {
            // Ignore answer when in stable state (already processed)
            console.log('Ignoring answer in stable state');
          } else {
            console.log('Ignoring SDP', data.sdp.type, 'in state', pc.signalingState);
          }
        }

        if (data.ice) {
          // Only add ICE candidates if we have a remote description
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(data.ice));
            console.log('ICE candidate added');
          } else {
            // Queue ICE candidates if remote description is not set yet
            if (!pc.iceCandidatesQueue) {
              pc.iceCandidatesQueue = [];
            }
            pc.iceCandidatesQueue.push(new RTCIceCandidate(data.ice));
            console.log('ICE candidate queued');
          }
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });

    socket.on('user-left', (socketId) => {
      const pc = peersRef.current[socketId];
      if (pc) {
        pc.close();
        delete peersRef.current[socketId];
      }
      
      setRemoteStreams((prev) => prev.filter((v) => v.id !== socketId));
      
      // Remove username
      setUserNames(prev => {
        const newNames = { ...prev };
        delete newNames[socketId];
        return newNames;
      });
    });

    socket.on('chat-message', addMessage);

    // ── Screen share presence: update layout when a remote peer starts/stops sharing ──
    socket.on('screen-share-toggled', ({ sharingSocketId, sharing }) => {
      setActiveSharingId(sharing ? sharingSocketId : null);
    });

    socket.on('disconnect', () => {
      toast.error("Lost connection to the meeting server.");
    });

    /* ---------------- CLEANUP ---------------- */
    return () => {
      socket?.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, [shouldShowLobby, username, phase, getLocalMedia, createPeerConnection, addMessage, connectToMeeting]);

  /* -------------------- UI -------------------- */

  /* ── Grid layout class based on remote participant count ── */
  const getGridClass = (count) => {
    if (count === 0) return styles.waitingState;
    if (count === 1) return styles.oneUser;
    if (count === 2) return styles.twoUsers;
    if (count === 3) return styles.threeUsers;
    if (count === 4) return styles.fourUsers;
    return styles.multipleUsers; // 5+
  };

  const openChat = () => {
    setModal(!showModal); // Toggle chat modal
    if (!showModal) {
      setNewMessages(0); // Reset unread badge when opening chat
    }
  };

  const closeChat = () => {
    setModal(false); // Close chat
  };

  const connect = () => {
    if (lobbyUsername.trim()) {
      setIsConnected(true);
    }
  };

  // ── Pre-join card (shown to everyone before entering) ──
  if (!shouldShowLobby && phase === 'prejoin') {
    return (
      <PreJoinCard
        username={username}
        onJoin={({ videoEnabled: v, audioEnabled: a, stream }) => {
          prejoinMediaRef.current = { videoEnabled: v, audioEnabled: a, stream };
          // Trigger socket connect by moving out of 'prejoin' phase
          setPhase('connecting');
        }}
      />
    );
  }

  // ── Waiting room (participants wait for host to admit) ──
  if (!shouldShowLobby && (phase === 'waiting' || phase === 'rejected')) {
    return (
      <WaitingRoomScreen
        username={username}
        rejected={phase === 'rejected'}
        onLeave={() => { window.location.href = '/'; }}
      />
    );
  }

  // Lobby UI (unauthenticated users only)
  if (shouldShowLobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Enter into Lobby
            </h2>
            <p className="text-gray-600">Set your username to join the meeting</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="space-y-6">
              <TextField 
                fullWidth
                id="outlined-basic" 
                label="Username" 
                value={lobbyUsername} 
                onChange={e => setLobbyUsername(e.target.value)} 
                variant="outlined"
                className="w-full"
                InputProps={{
                  className: "text-lg",
                  style: { borderRadius: '12px' }
                }}
              />
              
              <Button 
                variant="contained" 
                onClick={connect}
                fullWidth
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 text-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                style={{ borderRadius: '12px', textTransform: 'none' }}
              >
                Connect to Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main meeting UI
  return (
    <div className="min-h-screen bg-gray-900 relative flex h-screen">

      {/* ── P2P → SFU upgrade overlay ── */}
      {upgrading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(9,9,18,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{ width: 48, height: 48, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#a5b4fc', fontWeight: 600, fontSize: 16 }}>Upgrading to HD call quality…</p>
          <p style={{ color: '#6b7280', fontSize: 13 }}>Reconnecting {participantCount} participants</p>
        </div>
      )}

      {/* ── SFU mode — LiveKit handles everything ── */}
      {mode === 'sfu' && !upgrading ? (
        <SFURoom
          roomName={roomName}
          username={username}
          onEndCall={endCall}
          showChat={showModal}
          onToggleChat={openChat}
          newMessages={newMessages}
          chatPanel={
            <ChatPanel
              messages={messages}
              username={username}
              socketRef={socketRef}
              socketIdRef={socketIdRef}
              userNames={userNames}
              onClose={() => setModal(false)}
              onNewMessage={() => setNewMessages(n => n + 1)}
            />
          }
        />
      ) : (
        /* ── P2P mode ── */
        <>
          <div className={`flex-1 relative transition-all duration-300 ${showModal ? 'max-w-[calc(100vw-20rem)]' : 'w-full'}`}>

            {/* ══════════════════════════════════════════════════
                PRESENTER LAYOUT — active when anyone is sharing
            ══════════════════════════════════════════════════ */}
            {activeSharingId ? (
              <div className={styles.presenterLayout}>

                {/* ── Main stage: sharer's screen ── */}
                <div className={styles.presenterMain}>
                  {activeSharingId === 'local' ? (
                    /* Sharer sees a banner (not their own screen — avoids hall-of-mirrors) */
                    <div className={styles.sharingBanner}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="#6366f1" style={{ marginBottom: 12 }}>
                        <path d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3l-1 3h10l-1-3h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 13H4V5h16v11z" />
                      </svg>
                      <p className={styles.sharingBannerTitle}>You are sharing your screen</p>
                      <p className={styles.sharingBannerSub}>Other participants can see your screen</p>
                      <button className={styles.stopSharingBtn} onClick={stopScreenShare}>
                        Stop Sharing
                      </button>
                    </div>
                  ) : (
                    /* Remote sharer — their stream IS the screen share */
                    <div className="relative w-full h-full">
                      {(() => {
                        const sharerStream = remoteStreams.find(r => r.id === activeSharingId);
                        return sharerStream ? (
                          <video
                            key={sharerStream.id + '-screen'}
                            autoPlay playsInline muted={false}
                            className="w-full h-full"
                            style={{ objectFit: 'contain', background: '#000' }}
                            ref={el => { if (el && sharerStream.stream) el.srcObject = sharerStream.stream; }}
                          />
                        ) : null;
                      })()}
                      <div className={styles.sharerLabel}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ marginRight: 4 }}>
                          <path d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3l-1 3h10l-1-3h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 13H4V5h16v11z" />
                        </svg>
                        {userNames[activeSharingId] || `User ${activeSharingId.slice(-4)}`} is sharing
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Sidebar: camera thumbnails of everyone else ── */}
                <div className={styles.presenterSidebar}>
                  {/* Local camera thumbnail */}
                  <div className={styles.presenterThumb}>
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <div className={styles.thumbLabel}>You</div>
                  </div>

                  {/* Remote cameras (all peers, including the sharer so you see their face) */}
                  {remoteStreams.map(rs => {
                    const isSpeaking = activeSpeakers.has(rs.id);
                    return (
                      <div key={rs.id} className={styles.presenterThumb} style={{ outline: isSpeaking ? '2px solid #22c55e' : 'none' }}>
                        <video
                          autoPlay playsInline muted={false}
                          className="w-full h-full object-cover"
                          ref={el => { if (el && rs.stream) el.srcObject = rs.stream; }}
                        />
                        {isSpeaking && <div className={styles.speakingRing} />}
                        <div className={styles.thumbLabel}>{userNames[rs.id] || `User ${rs.id.slice(-4)}`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ══════════════════════════════════════════
                 NORMAL GRID — nobody is sharing screen
              ══════════════════════════════════════════ */
              <>
                <div className={`${styles.conferenceView} ${getGridClass(remoteStreams.length)}`}>
                  {remoteStreams.length === 0 ? (
                    <>
                      <span className={styles.waitingDot} />
                      <p className={styles.waitingText}>Waiting for others to join…</p>
                    </>
                  ) : (
                    remoteStreams.map((remoteStream) => {
                      const isSpeaking = activeSpeakers.has(remoteStream.id);
                      return (
                        <div key={remoteStream.id} className="relative group w-full h-full">
                          <video
                            autoPlay playsInline muted={false}
                            className="w-full h-full object-cover"
                            ref={el => { if (el && remoteStream.stream) el.srcObject = remoteStream.stream; }}
                          />
                          {isSpeaking && <div className={styles.speakingRing} />}
                          {isSpeaking && (
                            <div className={styles.speakingMicBadge} title="Speaking">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                              </svg>
                            </div>
                          )}
                          <div
                            className="absolute bottom-2 left-2 text-white px-2 py-1 rounded text-sm"
                            style={{ background: isSpeaking ? 'rgba(34,197,94,0.75)' : 'rgba(0,0,0,0.5)', transition: 'background 0.3s ease' }}
                          >
                            {userNames[remoteStream.id] || `User ${remoteStream.id.slice(-4)}`}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Local Video corner (shown only in grid mode) */}
                <div className="local-video-corner absolute top-4 right-4 w-48 h-36 md:w-64 md:h-48 lg:w-80 lg:h-60 z-50 rounded-lg overflow-hidden shadow-2xl border-2 border-white border-opacity-20">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {screenSharing ? '🖥 Sharing' : 'You'}
                  </div>
                </div>
              </>
            )}

            {/* ── Bottom Controls (always visible) ── */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center space-x-2 sm:space-x-4">
              <IconButton onClick={toggleVideo} style={{ color: "white" }}>
                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
              <IconButton onClick={toggleAudio} style={{ color: "white" }}>
                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
              <IconButton
                onClick={toggleScreenShare}
                title={screenSharing ? 'Stop sharing' : 'Share screen'}
                style={{ color: screenSharing ? '#f97316' : 'white', position: 'relative' }}
              >
                {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                {/* Orange dot indicator when sharing */}
                {screenSharing && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#f97316', animation: 'sfuSpeakPulse 1s ease-in-out infinite alternate' }} />
                )}
              </IconButton>
              <IconButton onClick={endCall} style={{ color: "#ef4444" }}>
                <CallEndIcon />
              </IconButton>
              <Badge badgeContent={newMessages} max={99} color="warning">
                <IconButton onClick={openChat} style={{ color: "white" }}>
                  <ChatIcon />
                </IconButton>
              </Badge>
              {/* Share button — host only */}
              {isHost && (
                <IconButton
                  onClick={() => setShowShareCard(true)}
                  title="Invite participants"
                  style={{ color: '#a78bfa' }}
                >
                  <PersonAddIcon />
                </IconButton>
              )}
              {/* Waiting room badge — host only */}
              {isHost && (
                <Badge badgeContent={waitlist.length} max={99} color="error">
                  <IconButton
                    onClick={() => setShowAdmitPanel(p => !p)}
                    title="Waiting Room"
                    style={{ color: waitlist.length > 0 ? '#fbbf24' : 'white' }}
                  >
                    {/* Person queue icon */}
                    <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }} fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </IconButton>
                </Badge>
              )}
              <ModeIndicator mode={mode} participantCount={participantCount} />
            </div>
          </div>

          {showModal && (
            <ChatPanel
              messages={messages}
              username={username}
              socketRef={socketRef}
              socketIdRef={socketIdRef}
              userNames={userNames}
              onClose={() => setModal(false)}
              onNewMessage={() => setNewMessages((n) => n + 1)}
            />
          )}
        </>
      )}

      {/* ── Share Meeting Card (host only) ── */}
      {showShareCard && (
        <ShareMeetingCard
          meetingUrl={window.location.href}
          senderName={username}
          onClose={() => setShowShareCard(false)}
          showJoinBtn={false}
        />
      )}

      {/* ── Host Admit Panel ── */}
      {isHost && showAdmitPanel && (
        <HostAdmitPanel
          waitlist={waitlist}
          onAdmit={handleAdmitUser}
          onReject={handleRejectUser}
          onClose={() => setShowAdmitPanel(false)}
        />
      )}
    </div>
  );
}
