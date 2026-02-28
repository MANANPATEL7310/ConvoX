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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PanToolIcon from '@mui/icons-material/PanTool';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import SubtitlesOffIcon from '@mui/icons-material/SubtitlesOff';
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
import HostControlPanel from '../components/HostControlPanel';

const SERVER_URL = "http://localhost:8000";

const STUN_URLS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

const TURN_URLS = (import.meta.env.VITE_TURN_URLS || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || "";
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || "";

const ICE_SERVERS = {
  iceServers: [
    ...STUN_URLS.map((url) => ({ urls: url })),
    ...(TURN_URLS.length && TURN_USERNAME && TURN_CREDENTIAL
      ? [{ urls: TURN_URLS, username: TURN_USERNAME, credential: TURN_CREDENTIAL }]
      : []),
  ],
};

const QUALITY_PRESETS = {
  low: { width: 640, height: 360, frameRate: 15, maxBitrate: 250_000 },
  standard: { width: 1280, height: 720, frameRate: 24, maxBitrate: 900_000 },
  hd: { width: 1920, height: 1080, frameRate: 30, maxBitrate: 1_800_000 },
};

const REACTION_OPTIONS = ['👍', '🎉', '❤️'];

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
  const [videoQuality, setVideoQuality] = useState('standard');
  const videoQualityRef = useRef('standard');
  const [mediaStates, setMediaStates] = useState({});
  const [reactions, setReactions] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionLines, setCaptionLines] = useState([]);
  const [liveCaption, setLiveCaption] = useState(null);
  const videoEnabledRef = useRef(true);
  const audioEnabledRef = useRef(true);
  const reactionTimersRef = useRef([]);
  const isHostRef = useRef(false);
  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const captioningRef = useRef(false);
  const captionIdsRef = useRef(new Set());

  // ── Waiting room state ──
  // phase: 'prejoin' | 'connecting' | 'waiting' | 'rejected' | 'in-meeting'
  // Initialise from sessionStorage so page refresh doesn't show PreJoinCard again
  const [phase, setPhase] = useState(() => {
    const stored = sessionStorage.getItem(`convox-phase:${window.location.href}`);
    // If they were mid-meeting or connecting, skip PreJoinCard
    return (stored === 'connecting' || stored === 'in-meeting') ? 'connecting' : 'prejoin';
  });
  const [waitlist, setWaitlist] = useState([]);     // host only
  const [showHostPanel, setShowHostPanel] = useState(false);
  const prejoinMediaRef = useRef({ videoEnabled: true, audioEnabled: true, quality: 'standard', stream: null });
  // Always-current username ref (avoids stale closures in socket callbacks)
  const usernameRef = useRef('');
  // Guards so the socket is created exactly once
  const socketCreatedRef         = useRef(false);
  const intentionalDisconnectRef = useRef(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    videoQualityRef.current = videoQuality;
  }, [videoQuality]);

  useEffect(() => {
    videoEnabledRef.current = videoEnabled;
  }, [videoEnabled]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    captioningRef.current = captionsEnabled;
  }, [captionsEnabled]);

  useEffect(() => {
    return () => {
      reactionTimersRef.current.forEach((t) => clearTimeout(t));
      reactionTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      recognitionActiveRef.current = false;
    };
  }, []);

  // Use derived state for display username
  const username = user?.username || lobbyUsername;
  const shouldShowLobby = !user?.username && !isConnected;
  const isHandRaised = !!raisedHands[socketIdRef.current];

  // Keep usernameRef always current so socket callbacks never have a stale value
  useEffect(() => { usernameRef.current = username; }, [username]);

  // Persist phase transitions to sessionStorage
  const updatePhase = useCallback((next) => {
    setPhase(next);
    sessionStorage.setItem(`convox-phase:${window.location.href}`, next);
  }, []);

  // ── Hybrid architecture mode (P2P | SFU) ──
  const { mode, participantCount, upgrading } = useMeetingMode(socketRef);

  const buildAudioConstraints = useCallback(() => ({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }), []);

  const buildVideoConstraints = useCallback((qualityKey = 'standard') => {
    const preset = QUALITY_PRESETS[qualityKey] || QUALITY_PRESETS.standard;
    return {
      width: { ideal: preset.width },
      height: { ideal: preset.height },
      frameRate: { ideal: preset.frameRate, max: preset.frameRate },
    };
  }, []);

  const resolveMediaConstraints = useCallback((constraints, qualityKey = 'standard') => {
    return {
      video: constraints.video === true ? buildVideoConstraints(qualityKey) : constraints.video,
      audio: constraints.audio === true ? buildAudioConstraints() : constraints.audio,
    };
  }, [buildAudioConstraints, buildVideoConstraints]);

  const computeAdaptiveScale = useCallback(() => {
    let scale = 1;
    const connection = navigator.connection;
    if (connection) {
      const downlink = Number(connection.downlink || 0);
      if (connection.effectiveType === '2g' || downlink > 0 && downlink < 1) scale = 3;
      else if (connection.effectiveType === '3g' || downlink > 0 && downlink < 2) scale = 2;
    }
    if (participantCount >= 4) scale = Math.max(scale, 2);
    return scale;
  }, [participantCount]);

  const applyEncodingToPeer = useCallback((pc, qualityKey = 'standard') => {
    const preset = QUALITY_PRESETS[qualityKey] || QUALITY_PRESETS.standard;
    const scale = computeAdaptiveScale();
    pc.getSenders().forEach((sender) => {
      if (!sender.track || sender.track.kind !== 'video') return;
      const params = sender.getParameters();
      params.degradationPreference = 'balanced';
      params.encodings = params.encodings && params.encodings.length ? params.encodings : [{}];
      params.encodings[0].maxBitrate = preset.maxBitrate;
      params.encodings[0].scaleResolutionDownBy = scale;
      sender.setParameters(params).catch(() => {});
    });
  }, [computeAdaptiveScale]);

  const applyQualityToLocalTrack = useCallback(async (qualityKey = 'standard') => {
    if (!localStreamRef.current || screenSharing) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (!track?.applyConstraints) return;
    try {
      await track.applyConstraints(buildVideoConstraints(qualityKey));
    } catch {
      // Some cameras ignore constraints; safe to ignore.
    }
  }, [buildVideoConstraints, screenSharing]);

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

  useEffect(() => {
    if (phase !== 'in-meeting') return;
    applyQualityToLocalTrack(videoQuality);
    Object.values(peersRef.current).forEach((pc) => {
      applyEncodingToPeer(pc, videoQuality);
    });
  }, [videoQuality, participantCount, phase, applyEncodingToPeer, applyQualityToLocalTrack]);

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
      const qualityKey = videoQualityRef.current || 'standard';
      const resolved = resolveMediaConstraints(constraints, qualityKey);
      const stream = await navigator.mediaDevices.getUserMedia(resolved);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Update video/audio states
      setVideoEnabled(resolved.video && stream.getVideoTracks().length > 0);
      setAudioEnabled(resolved.audio && stream.getAudioTracks().length > 0);

      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Failed to access camera/microphone. Please allow browser permissions and try again.");
      throw error;
    }
  }, [resolveMediaConstraints]);

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
      ...ICE_SERVERS,
      sdpSemantics: 'unified-plan',
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

  const emitMediaState = useCallback((nextAudio, nextVideo) => {
    const payload = {
      audioEnabled: nextAudio,
      videoEnabled: nextVideo,
    };
    setMediaStates(prev => ({ ...prev, [socketIdRef.current]: payload }));
    socketRef.current?.emit('media-state', payload);
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled;
        videoTracks[0].enabled = enabled;
        setVideoEnabled(enabled);
        emitMediaState(audioEnabledRef.current, enabled);
      }
    }
  }, [emitMediaState]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks[0].enabled = enabled;
        setAudioEnabled(enabled);
        emitMediaState(enabled, videoEnabledRef.current);
      }
    }
  }, [emitMediaState]);

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
    // Clear session phase so next visit shows PreJoinCard fresh
    sessionStorage.removeItem(`convox-phase:${window.location.href}`);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionActiveRef.current = false;
    setCaptionsEnabled(false);
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

  /* -------------------- REACTIONS + HAND -------------------- */

  const addReaction = useCallback((emoji) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.random() * 60 + 20; // 20–80% of screen width
    setReactions((prev) => [...prev, { id, emoji, x }]);
    const timer = setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
    reactionTimersRef.current.push(timer);
  }, []);

  const sendReaction = useCallback((emoji) => {
    if (!emoji) return;
    setShowReactionPicker(false);
    socketRef.current?.emit('reaction', { emoji });
  }, []);

  const toggleRaiseHand = useCallback(() => {
    const selfId = socketIdRef.current;
    if (!selfId) return;
    const next = !raisedHands[selfId];
    setRaisedHands((prev) => ({ ...prev, [selfId]: next }));
    socketRef.current?.emit('raise-hand', { raised: next });
    if (next) toast.success('Hand raised');
    else toast.info('Hand lowered');
  }, [raisedHands]);

  /* -------------------- CAPTIONS -------------------- */

  const addCaptionLine = useCallback((line) => {
    setCaptionLines((prev) => {
      const next = [...prev, line];
      return next.slice(-4);
    });
  }, []);

  const emitCaption = useCallback((text) => {
    if (!text) return;
    const id = `${socketIdRef.current || 'local'}-${Date.now()}-${Math.random()}`;
    captionIdsRef.current.add(id);
    if (captionIdsRef.current.size > 400) captionIdsRef.current.clear();
    addCaptionLine({
      id,
      speaker: usernameRef.current || 'You',
      text,
      ts: Date.now(),
      self: true,
    });
    socketRef.current?.emit('caption', { id, text, ts: Date.now() });
  }, [addCaptionLine]);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionActiveRef.current = false;
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Live captions aren't supported in this browser.");
      setCaptionsEnabled(false);
      return;
    }
    if (recognitionActiveRef.current) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    recognitionRef.current = rec;

    rec.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }

      if (interim) {
        setLiveCaption({ speaker: usernameRef.current || 'You', text: interim });
      }

      const cleanFinal = finalText.trim();
      if (cleanFinal) {
        setLiveCaption(null);
        emitCaption(cleanFinal);
      }
    };

    rec.onerror = (err) => {
      if (err?.error === 'not-allowed' || err?.error === 'service-not-allowed') {
        toast.error('Mic permission is required for captions.');
        setCaptionsEnabled(false);
      }
      recognitionActiveRef.current = false;
    };

    rec.onend = () => {
      recognitionActiveRef.current = false;
      if (captioningRef.current && audioEnabledRef.current) {
        setTimeout(() => {
          if (captioningRef.current && audioEnabledRef.current) {
            startRecognition();
          }
        }, 400);
      }
    };

    try {
      rec.start();
      recognitionActiveRef.current = true;
    } catch {
      recognitionActiveRef.current = false;
    }
  }, [emitCaption]);

  useEffect(() => {
    if (!captionsEnabled) {
      stopRecognition();
      setLiveCaption(null);
      return;
    }
    if (!audioEnabledRef.current) {
      toast.info('Unmute to generate captions.');
      stopRecognition();
      return;
    }
    startRecognition();
  }, [captionsEnabled, audioEnabled, startRecognition, stopRecognition]);

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

  const handleMuteUser = useCallback((socketId) => {
    socketRef.current?.emit('host-mute-user', { socketId });
  }, []);

  const handleUnmuteUser = useCallback((socketId) => {
    socketRef.current?.emit('host-unmute-user', { socketId });
  }, []);

  const handleVideoOffUser = useCallback((socketId) => {
    socketRef.current?.emit('host-video-off-user', { socketId });
  }, []);

  const handleVideoOnUser = useCallback((socketId) => {
    socketRef.current?.emit('host-video-on-user', { socketId });
  }, []);

  const handleMuteAll = useCallback(() => {
    socketRef.current?.emit('host-mute-all');
  }, []);

  const handleVideoOffAll = useCallback(() => {
    socketRef.current?.emit('host-video-off-all');
  }, []);

  /**
   * connectToMeeting — called after admitted event (or instantly for host).
   * Applies pre-chosen media settings then emits join-call.
   */
  const connectToMeeting = useCallback(async () => {
    const { videoEnabled: v, audioEnabled: a, quality } = prejoinMediaRef.current;
    const currentUsername = usernameRef.current;
    try {
      // Always request FRESH media — the PreJoinCard stream is stopped by its own cleanup
      const qualityKey = quality || videoQualityRef.current || 'standard';
      const constraints = resolveMediaConstraints({ video: v, audio: a }, qualityKey);
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;

      // Apply toggle state
      s.getVideoTracks().forEach(t => { t.enabled = v; });
      s.getAudioTracks().forEach(t => { t.enabled = a; });
      setVideoEnabled(v);
      setAudioEnabled(a);
      setVideoQuality(qualityKey);
      emitMediaState(a, v);

      socketRef.current?.emit('join-call', window.location.href, currentUsername);
      updatePhase('in-meeting');
    } catch (err) {
      console.error('connectToMeeting error:', err);
      // Even on error, emit join-call so the meeting proceeds
      socketRef.current?.emit('join-call', window.location.href, currentUsername);
      updatePhase('in-meeting');
    }
  }, [resolveMediaConstraints, updatePhase, emitMediaState]);

  /* ─── Stable function refs (always current, no stale closure issues) ─── */
  const connectToMeetingRef   = useRef(null);
  const addMessageRef         = useRef(null);
  const createPeerConnRef     = useRef(null);
  const getLocalMediaRef      = useRef(null);
  const updatePhaseRef        = useRef(null);
  const applyEncodingRef      = useRef(null);

  // Keep refs in sync every render (stable assignments, no extra effects needed)
  connectToMeetingRef.current  = connectToMeeting;
  addMessageRef.current        = addMessage;
  createPeerConnRef.current    = createPeerConnection;
  getLocalMediaRef.current     = getLocalMedia;
  updatePhaseRef.current       = updatePhase;
  applyEncodingRef.current     = applyEncodingToPeer;

  /* ─── Trigger flag: set true exactly once when we should create the socket ─── */
  const socketReadyRef = useRef(false);
  useEffect(() => {
    if (!authLoading && !shouldShowLobby && phase !== 'prejoin') {
      socketReadyRef.current = true;
    }
  }, [authLoading, shouldShowLobby, phase]);

  /* ─── Socket — created ONCE on mount, reads all live state via refs ─── */
  useEffect(() => {
    // Poll briefly until auth loads and user leaves prejoin
    // This avoids having authLoading/phase in deps (which would recreate the socket)
    let timeout;
    const tryConnect = () => {
      console.log('[DEBUG] tryConnect called. created:', socketCreatedRef.current, 'ready:', socketReadyRef.current, 'phase:', phase);
      if (socketCreatedRef.current) return;  // already created
      if (!socketReadyRef.current) {
        timeout = setTimeout(tryConnect, 150);
        return;
      }
      socketCreatedRef.current = true;
      console.log('[DEBUG] Creating socket instance...');

      const socket = io(SERVER_URL, {
        secure: false,
        withCredentials: true,
        reconnection: false,  // disable auto-reconnect to prevent ghost sockets
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[DEBUG] Socket connected. ID:', socket.id, 'Emitting waiting-room-join');
        socketIdRef.current = socket.id;
        socket.emit('waiting-room-join', window.location.href, usernameRef.current);
      });

      socket.on('in-waiting-room', () => {
        console.log('[DEBUG] Received in-waiting-room event. Updating phase to waiting.');
        updatePhaseRef.current('waiting');
      });

      socket.on('admitted', async (data) => {
        console.log('[DEBUG] Received admitted event:', data);
        await connectToMeetingRef.current();
        console.log('[DEBUG] Finished connectToMeeting()');
      });

      socket.on('rejected', () => {
        updatePhaseRef.current('rejected');
      });

      socket.on('waiting-room-update', ({ waitlist: wl }) => {
        setWaitlist(wl);
        if (wl.length > 0) setShowHostPanel(true);
      });

      socket.on('waiting-room-notification', ({ username: wUsername, count }) => {
        toast(`👋 ${wUsername} is waiting to join`, {
          description: count > 1 ? `${count} people in waiting room` : undefined,
          duration: 6000,
        });
      });

      socket.on('error-event', ({ message }) => {
        if (message) toast.error(message);
      });

      socket.on('media-state', ({ socketId, audioEnabled, videoEnabled }) => {
        if (!socketId) return;
        setMediaStates(prev => ({
          ...prev,
          [socketId]: {
            audioEnabled: audioEnabled ?? prev[socketId]?.audioEnabled ?? true,
            videoEnabled: videoEnabled ?? prev[socketId]?.videoEnabled ?? true,
          },
        }));
      });

      socket.on('reaction', ({ emoji }) => {
        if (!emoji) return;
        addReaction(emoji);
      });

      socket.on('raise-hand', ({ socketId, username: raisedBy, raised }) => {
        if (!socketId) return;
        setRaisedHands((prev) => {
          const next = { ...prev };
          if (raised) next[socketId] = true;
          else delete next[socketId];
          return next;
        });
        if (raised && isHostRef.current && socketId !== socketIdRef.current) {
          toast.info(`${raisedBy || 'Someone'} raised a hand`);
        }
      });

      socket.on('caption', ({ id, text, speaker }) => {
        if (!text || !id) return;
        if (captionIdsRef.current.has(id)) return;
        captionIdsRef.current.add(id);
        if (captionIdsRef.current.size > 400) captionIdsRef.current.clear();
        addCaptionLine({
          id,
          speaker: speaker || 'Someone',
          text,
          ts: Date.now(),
          self: false,
        });
      });

      socket.on('host-force-mute', () => {
        if (!localStreamRef.current) return;
        const tracks = localStreamRef.current.getAudioTracks();
        tracks.forEach(t => { t.enabled = false; });
        setAudioEnabled(false);
        emitMediaState(false, videoEnabledRef.current);
        toast.warning('Host muted your microphone');
      });

      socket.on('host-force-unmute', () => {
        if (!localStreamRef.current) return;
        const tracks = localStreamRef.current.getAudioTracks();
        tracks.forEach(t => { t.enabled = true; });
        setAudioEnabled(true);
        emitMediaState(true, videoEnabledRef.current);
        toast.info('Host unmuted your microphone');
      });

      socket.on('host-force-video-off', () => {
        if (!localStreamRef.current) return;
        const tracks = localStreamRef.current.getVideoTracks();
        tracks.forEach(t => { t.enabled = false; });
        setVideoEnabled(false);
        emitMediaState(audioEnabledRef.current, false);
        toast.warning('Host turned off your camera');
      });

      socket.on('host-force-video-on', () => {
        if (!localStreamRef.current) return;
        const tracks = localStreamRef.current.getVideoTracks();
        tracks.forEach(t => { t.enabled = true; });
        setVideoEnabled(true);
        emitMediaState(audioEnabledRef.current, true);
        toast.info('Host turned on your camera');
      });

      socket.on('role-assigned', ({ role }) => {
        setIsHost(role === 'host');
        if (role === 'host') toast.success('You are now the host');
      });

      socket.on('user-joined', async (id, clients, usernames) => {
        if (usernames) setUserNames(usernames);
        if (id === socket.id) {
          emitMediaState(audioEnabledRef.current, videoEnabledRef.current);
        }
        
        // P2P Mesh Optimization: To prevent "glare" (both sides sending an offer at the same time),
        // we use a deterministic rule based on socket.id comparison.
        // Only the peer with the lexicographically smaller ID initiates the offer.
        for (const clientId of clients) {
          if (clientId !== socket.id && !peersRef.current[clientId]) {
            const pc = createPeerConnRef.current(clientId);
            await getLocalMediaRef.current();
            const stream = localStreamRef.current;
            if (stream) {
              stream.getTracks().forEach(track => {
                const existing = pc.getSenders().find(s => s.track === track);
                if (!existing) pc.addTrack(track, stream);
              });
            }
            applyEncodingRef.current?.(pc, videoQualityRef.current);

            // Deterministic initiator logic
            if (socket.id < clientId) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('signal', clientId, JSON.stringify({ sdp: pc.localDescription }));
            }
            // If socket.id > clientId, we just wait to receive their offer via `socket.on('signal')`.
          }
        }
      });

      socket.on('signal', async (fromId, message) => {
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message;
          let pc = peersRef.current[fromId];
          if (!pc) pc = createPeerConnRef.current(fromId);

          if (data.sdp) {
            if (data.sdp.type === 'offer') {
               // Only process offer if we aren't in the middle of our own
               // (Handle glare if needed, but simple state check prevents most errors)
              if (pc.signalingState !== 'stable') {
                await Promise.all([
                  pc.setLocalDescription({type: "rollback"}),
                  pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
                ]);
              } else {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              }

              if (pc.iceCandidatesQueue?.length) {
                for (const c of pc.iceCandidatesQueue) await pc.addIceCandidate(c);
                pc.iceCandidatesQueue = [];
              }

              // Add our local tracks BEFORE creating the answer
              await getLocalMediaRef.current();
              const stream = localStreamRef.current;
              if (stream) {
                stream.getTracks().forEach(track => {
                   const existing = pc.getSenders().find(s => s.track === track);
                   if (!existing) pc.addTrack(track, stream);
                });
              }
              applyEncodingRef.current?.(pc, videoQualityRef.current);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('signal', fromId, JSON.stringify({ sdp: pc.localDescription }));

            } else if (data.sdp.type === 'answer') {
              if (pc.signalingState === 'have-local-offer') {
                 await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                 if (pc.iceCandidatesQueue?.length) {
                   for (const c of pc.iceCandidatesQueue) await pc.addIceCandidate(c);
                   pc.iceCandidatesQueue = [];
                 }
              }
            }
          } else if (data.ice) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data.ice));
            } else {
              pc.iceCandidatesQueue = pc.iceCandidatesQueue || [];
              pc.iceCandidatesQueue.push(new RTCIceCandidate(data.ice));
            }
          }
        } catch (err) {
          console.error('Signal error:', err);
        }
      });

      socket.on('user-left', (socketId) => {
        const pc = peersRef.current[socketId];
        if (pc) { pc.close(); delete peersRef.current[socketId]; }
        setRemoteStreams(prev => prev.filter(v => v.id !== socketId));
        setUserNames(prev => { const n = { ...prev }; delete n[socketId]; return n; });
        setMediaStates(prev => { const n = { ...prev }; delete n[socketId]; return n; });
        setRaisedHands(prev => { const n = { ...prev }; delete n[socketId]; return n; });
      });

      socket.on('chat-message', (data, sender, sid) => addMessageRef.current(data, sender, sid));

      socket.on('screen-share-toggled', ({ sharingSocketId, sharing }) => {
        setActiveSharingId(sharing ? sharingSocketId : null);
      });

      socket.on('disconnect', () => {
        if (!intentionalDisconnectRef.current) {
          toast.error('Lost connection to the meeting server.');
        }
      });
    };

    tryConnect();

    return () => {
      // CLEAR the creation flag on unmount so StrictMode remounts can recreate the socket
      socketCreatedRef.current = false;
      clearTimeout(timeout);
      intentionalDisconnectRef.current = true;
      socketRef.current?.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onJoin={({ videoEnabled: v, audioEnabled: a, quality }) => {
          // Only store toggle prefs — stream is stopped by PreJoinCard cleanup
          prejoinMediaRef.current = { videoEnabled: v, audioEnabled: a, quality };
          if (quality) setVideoQuality(quality);
          updatePhase('connecting');
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

  // Connecting to meeting (waiting for camera to start up and join-call to emit)
  if (phase === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-medium">Connecting to meeting...</p>
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

      {/* ── Floating reactions overlay ── */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {reactions.map((r) => (
          <div
            key={r.id}
            className={styles.reactionFloat}
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* ── Captions overlay ── */}
      {captionsEnabled && (captionLines.length > 0 || liveCaption) && (
        <div className={styles.captionOverlay}>
          {captionLines.map((line) => (
            <div key={line.id} className={styles.captionLine}>
              <span className={styles.captionSpeaker}>{line.speaker}:</span>
              <span>{line.text}</span>
            </div>
          ))}
          {liveCaption && (
            <div className={`${styles.captionLine} ${styles.captionInterim}`}>
              <span className={styles.captionSpeaker}>{liveCaption.speaker}:</span>
              <span>{liveCaption.text}</span>
            </div>
          )}
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
          isHost={isHost}
          waitlistCount={waitlist.length}
          onToggleShareCard={() => setShowShareCard(true)}
          onToggleAdmitPanel={() => setShowHostPanel(p => !p)}
          onSendReaction={sendReaction}
          onToggleRaiseHand={toggleRaiseHand}
          isHandRaised={isHandRaised}
          reactionOptions={REACTION_OPTIONS}
          captionsEnabled={captionsEnabled}
          onToggleCaptions={() => setCaptionsEnabled(p => !p)}
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
                    {raisedHands[socketIdRef.current] && (
                      <div
                        className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(245,158,11,0.9)', color: '#111827' }}
                      >
                        ✋
                      </div>
                    )}
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
                        {raisedHands[rs.id] && (
                          <div
                            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ background: 'rgba(245,158,11,0.9)', color: '#111827' }}
                          >
                            ✋
                          </div>
                        )}
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
                          {raisedHands[remoteStream.id] && (
                            <div
                              className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                              style={{ background: 'rgba(245,158,11,0.9)', color: '#111827' }}
                            >
                              ✋
                            </div>
                          )}
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
                  <video 
                    ref={el => {
                      localVideoRef.current = el;
                      if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
                    }} 
                    autoPlay muted playsInline 
                    className="w-full h-full object-cover bg-black" 
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {raisedHands[socketIdRef.current] && (
                    <div
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(245,158,11,0.9)', color: '#111827' }}
                    >
                      ✋
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {screenSharing ? '🖥 Sharing' : 'You'}
                  </div>
                </div>
              </>
            )}

            {/* ── Bottom Controls (always visible) ── */}
            <div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center space-x-2 sm:space-x-4"
              style={{ position: 'absolute' }}
            >
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
              <IconButton
                onClick={() => setCaptionsEnabled(p => !p)}
                title={captionsEnabled ? 'Turn off captions' : 'Turn on captions'}
                style={{ color: captionsEnabled ? '#a5b4fc' : 'white' }}
              >
                {captionsEnabled ? <SubtitlesIcon /> : <SubtitlesOffIcon />}
              </IconButton>
              <div style={{ position: 'relative' }}>
                <IconButton
                  onClick={() => setShowReactionPicker(p => !p)}
                  title="Send reaction"
                  style={{ color: "white" }}
                >
                  <EmojiEmotionsIcon />
                </IconButton>
                {showReactionPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 46,
                      left: '50%',
                      transform: 'translateX(-50%)',
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
                    {REACTION_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
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
              <IconButton
                onClick={toggleRaiseHand}
                title={isHandRaised ? 'Lower hand' : 'Raise hand'}
                style={{ color: isHandRaised ? '#f59e0b' : 'white' }}
              >
                {isHandRaised ? <PanToolIcon /> : <PanToolOutlinedIcon />}
              </IconButton>
              {/* Host controls panel toggle */}
              {isHost && (
                <Badge badgeContent={waitlist.length} max={99} color="error">
                  <IconButton
                    onClick={() => setShowHostPanel(p => !p)}
                    title="Host Controls"
                    style={{ color: waitlist.length > 0 ? '#fbbf24' : 'white' }}
                  >
                    <AdminPanelSettingsIcon />
                  </IconButton>
                </Badge>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(15,23,42,0.6)',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5f5', letterSpacing: '0.08em' }}>
                  QUALITY
                </span>
                <select
                  value={videoQuality}
                  onChange={(e) => setVideoQuality(e.target.value)}
                  style={{
                    background: 'transparent',
                    color: 'white',
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="standard">Standard</option>
                  <option value="hd">HD</option>
                </select>
              </div>
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
      {isHost && showHostPanel && (
        <HostControlPanel
          waitlist={waitlist}
          participants={Object.keys(userNames).map((socketId) => ({
            socketId,
            username: userNames[socketId] || `User ${socketId.slice(-4)}`,
            isSelf: socketId === socketIdRef.current,
          }))}
          mediaStates={mediaStates}
          raisedHands={raisedHands}
          onAdmit={handleAdmitUser}
          onReject={handleRejectUser}
          onMuteUser={handleMuteUser}
          onUnmuteUser={handleUnmuteUser}
          onVideoOffUser={handleVideoOffUser}
          onVideoOnUser={handleVideoOnUser}
          onMuteAll={handleMuteAll}
          onVideoOffAll={handleVideoOffAll}
          onOpenShare={() => setShowShareCard(true)}
          onClose={() => setShowHostPanel(false)}
        />
      )}
    </div>
  );
}
