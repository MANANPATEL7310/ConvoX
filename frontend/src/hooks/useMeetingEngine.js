import { useEffect, useRef, useState, useCallback } from 'react';
import io from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from '../contexts/useAuth';
import { useMeetingMode } from './useMeetingMode';
import { useActiveSpeaker } from './useActiveSpeaker';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

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

export function useMeetingEngine(localVideoRef) {
  // Refs
  const socketRef      = useRef(null);
  const peersRef       = useRef({});
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketIdRef    = useRef(null);

  // States
  const [remoteStreams,  setRemoteStreams]  = useState([]);
  const [userNames,      setUserNames]     = useState({});
  const [messages,       setMessages]      = useState([]);
  const [showModal,      setModal]         = useState(false);
  const [newMessages,    setNewMessages]   = useState(0);
  const [videoEnabled,   setVideoEnabled]  = useState(true);
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = rear
  const [audioEnabled,   setAudioEnabled]  = useState(true);
  const [screenSharing,  setScreenSharing] = useState(false);
  const [lobbyUsername,  setLobbyUsername] = useState("");
  const [isConnected,    setIsConnected]   = useState(false);
  const [activeSharingId, setActiveSharingId] = useState(null);
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pinnedId, setPinnedId] = useState(null);
  const [whiteboardVisible, setWhiteboardVisible] = useState(false);
  const [whiteboardPresenter, setWhiteboardPresenter] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const videoEnabledRef = useRef(true);
  const audioEnabledRef = useRef(true);
  const reactionTimersRef = useRef([]);
  const isHostRef = useRef(false);
  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const captioningRef = useRef(false);
  const captionIdsRef = useRef(new Set());
  const recordingRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStartRef = useRef(null);

  const [phase, setPhase] = useState(() => {
    const stored = sessionStorage.getItem(`convox-phase:${window.location.href}`);
    return (stored === 'connecting' || stored === 'in-meeting') ? 'connecting' : 'prejoin';
  });
  const [waitlist, setWaitlist] = useState([]);
  const [showHostPanel, setShowHostPanel] = useState(false);
  const prejoinMediaRef = useRef({ videoEnabled: true, audioEnabled: true, quality: 'standard', stream: null });
  const usernameRef = useRef('');
  const socketCreatedRef         = useRef(false);
  const intentionalDisconnectRef = useRef(false);

  const { user, loading: authLoading } = useAuth();
  
  // Keep refs in sync with state
  useEffect(() => { videoQualityRef.current = videoQuality; }, [videoQuality]);
  useEffect(() => { videoEnabledRef.current = videoEnabled; }, [videoEnabled]);
  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { captioningRef.current = captionsEnabled; }, [captionsEnabled]);

  useEffect(() => {
    return () => {
      reactionTimersRef.current.forEach((t) => clearTimeout(t));
      reactionTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch { }
      recognitionActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      try { recordingRef.current?.stop(); } catch { }
      recordingStreamRef.current?.getTracks().forEach(t => t.stop());
      recordingStreamRef.current = null;
    };
  }, []);

  const username = user?.username || lobbyUsername;
  const shouldShowLobby = !user?.username && !isConnected;
  const isHandRaised = !!raisedHands[socketIdRef.current];

  const togglePin = useCallback((id) => {
    setPinnedId((prev) => (prev === id ? null : id));
  }, []);

  const toggleWhiteboard = useCallback(() => {
    if (!isHost) return;
    if (whiteboardVisible) {
      socketRef.current?.emit('whiteboard-close');
      setWhiteboardVisible(false);
      setWhiteboardPresenter('');
    } else {
      socketRef.current?.emit('whiteboard-open', { presenter: usernameRef.current || 'Host' });
      setWhiteboardVisible(true);
      setWhiteboardPresenter(usernameRef.current || 'Host');
    }
  }, [isHost, whiteboardVisible]);

  useEffect(() => { usernameRef.current = username; }, [username]);

  const updatePhase = useCallback((next) => {
    setPhase(next);
    sessionStorage.setItem(`convox-phase:${window.location.href}`, next);
  }, []);

  const { mode, participantCount, upgrading } = useMeetingMode(socketRef);
  const activeSpeakers = useActiveSpeaker(remoteStreams);
  const roomName = window.location.href;

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
    } catch { }
  }, [buildVideoConstraints, screenSharing]);

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

  const getLocalMedia = useCallback(async (constraints = { video: videoEnabledRef.current, audio: audioEnabledRef.current }) => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }
    try {
      const qualityKey = videoQualityRef.current || 'standard';
      const resolved = resolveMediaConstraints(constraints, qualityKey);
      const stream = await navigator.mediaDevices.getUserMedia(resolved);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setVideoEnabled(resolved.video && stream.getVideoTracks().length > 0);
      setAudioEnabled(resolved.audio && stream.getAudioTracks().length > 0);
      return stream;
    } catch (error) {
      toast.error("Failed to access camera/microphone.");
      throw error;
    }
  }, [resolveMediaConstraints, localVideoRef]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      cameraStreamRef.current = localStreamRef.current;
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(pc => {
        if (pc.signalingState === 'closed') return;
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) videoSender.replaceTrack(screenVideoTrack);
      });
      screenVideoTrack.onended = () => stopScreenShare();
      setScreenSharing(true);
      setActiveSharingId('local');
      socketRef.current?.emit('screen-share-toggled', { sharing: true });
      toast.success('Screen sharing started');
      return screenStream;
    } catch (err) {
      if (err.name !== 'NotAllowedError') toast.error('Could not share screen.');
      throw err;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    const cameraStream = cameraStreamRef.current;
    if (!cameraStream) return;
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
    localStreamRef.current = cameraStream;
    setScreenSharing(false);
    setActiveSharingId(null);
    socketRef.current?.emit('screen-share-toggled', { sharing: false });
    toast.info('Screen sharing stopped');
  }, []);

  const createPeerConnection = useCallback((socketId) => {
    const pc = new RTCPeerConnection({
      ...ICE_SERVERS,
      sdpSemantics: 'unified-plan',
    });
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) socketRef.current.emit("signal", socketId, { ice: event.candidate });
    };
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStreams((prev) => prev.find((v) => v.id === socketId) ? prev : [...prev, { id: socketId, stream: stream }]);
      }
    };
    peersRef.current[socketId] = pc;
    return pc;
  }, []);

  const emitMediaState = useCallback((nextAudio, nextVideo) => {
    const payload = { audioEnabled: nextAudio, videoEnabled: nextVideo };
    setMediaStates(prev => ({ ...prev, [socketIdRef.current]: payload }));
    socketRef.current?.emit('media-state', payload);
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
      const track = videoTracks[0];
      const enabled = !track.enabled;
      track.enabled = enabled;
      if (!enabled) track.stop();
      setVideoEnabled(enabled);
      emitMediaState(audioEnabledRef.current, enabled);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: buildVideoConstraints(videoQualityRef.current), audio: false });
        const newTrack = stream.getVideoTracks()[0];
        localStreamRef.current.getVideoTracks().forEach(t => localStreamRef.current.removeTrack(t));
        localStreamRef.current.addTrack(newTrack);
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(newTrack);
          else pc.addTrack(newTrack, localStreamRef.current);
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setVideoEnabled(true);
        emitMediaState(audioEnabledRef.current, true);
      } catch (err) {
        toast.error("Failed to access camera");
      }
    }
  }, [emitMediaState, buildVideoConstraints]);

  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
      const track = audioTracks[0];
      const enabled = !track.enabled;
      track.enabled = enabled;
      if (!enabled) track.stop();
      setAudioEnabled(enabled);
      emitMediaState(enabled, videoEnabledRef.current);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints(), video: false });
        const newTrack = stream.getAudioTracks()[0];
        localStreamRef.current.getAudioTracks().forEach(t => localStreamRef.current.removeTrack(t));
        localStreamRef.current.addTrack(newTrack);
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
          if (sender) sender.replaceTrack(newTrack);
          else pc.addTrack(newTrack, localStreamRef.current);
        });
        setAudioEnabled(true);
        emitMediaState(true, videoEnabledRef.current);
      } catch (err) {
        toast.error("Failed to access microphone");
      }
    }
  }, [emitMediaState, buildAudioConstraints]);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) stopScreenShare();
    else try { await startScreenShare(); } catch (_) { }
  }, [screenSharing, startScreenShare, stopScreenShare]);

  const flipCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextFacing } },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      // Stop old video track
      localStreamRef.current.getVideoTracks().forEach(t => t.stop());

      // Replace track in the local stream
      localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
      localStreamRef.current.addTrack(newVideoTrack);

      // Replace in all active peer connections
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      });

      // Update local preview
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

      setFacingMode(nextFacing);
    } catch (err) {
      console.warn('[flipCamera] Failed to flip camera:', err.message);
    }
  }, [facingMode]);

  const addReaction = useCallback((emoji) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.random() * 60 + 20;
    setReactions((prev) => [...prev, { id, emoji, x }]);
    const timer = setTimeout(() => { setReactions((prev) => prev.filter((r) => r.id !== id)); }, 2800);
    reactionTimersRef.current.push(timer);
  }, []);

  const sendReaction = useCallback((emoji) => {
    if (!emoji) return;
    setShowReactionPicker(false);
    addReaction(emoji); // Show it locally immediately
    socketRef.current?.emit('reaction', { emoji });
  }, [addReaction]);

  const toggleRaiseHand = useCallback(() => {
    const selfId = socketIdRef.current;
    if (!selfId) return;
    const next = !raisedHands[selfId];
    setRaisedHands((prev) => ({ ...prev, [selfId]: next }));
    socketRef.current?.emit('raise-hand', { raised: next });
    if (next) toast.success('Hand raised');
    else toast.info('Hand lowered');
  }, [raisedHands]);

  const stopRecording = useCallback(() => {
    if (recordingRef.current && recordingRef.current.state === 'recording') recordingRef.current.stop();
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    recordingStreamRef.current = null;
    recordingStartRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (!window.MediaRecorder) { toast.error('Recording is not supported.'); return; }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      recordingStreamRef.current = stream;
      recordedChunksRef.current = [];
      const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mimeType = types.find(t => window.MediaRecorder?.isTypeSupported?.(t)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordingRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const type = mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type });
        recordedChunksRef.current = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ext = type.includes('mp4') ? 'mp4' : 'webm';
        a.href = url;
        a.download = `convox-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Recording saved.');
      };
      recorder.start(1000);
      setIsRecording(true);
      recordingStartRef.current = Date.now();
      setRecordingDuration(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        if (recordingStartRef.current) setRecordingDuration(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      }, 1000);
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.onended = () => { stopRecording(); };
      toast.success('Recording started.');
    } catch (err) { toast.error('Recording failed to start.'); }
  }, [stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const addCaptionLine = useCallback((line) => {
    setCaptionLines((prev) => { const next = [...prev, line]; return next.slice(-4); });
  }, []);

  const emitCaption = useCallback((text) => {
    if (!text) return;
    const id = `${socketIdRef.current || 'local'}-${Date.now()}-${Math.random()}`;
    captionIdsRef.current.add(id);
    if (captionIdsRef.current.size > 400) captionIdsRef.current.clear();
    addCaptionLine({ id, speaker: usernameRef.current || 'You', text, ts: Date.now(), self: true });
    socketRef.current?.emit('caption', { id, text, ts: Date.now(), speaker: usernameRef.current || 'You' });
  }, [addCaptionLine]);

  const stopRecognition = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { }
    recognitionActiveRef.current = false;
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Live captions aren't supported."); setCaptionsEnabled(false); return; }
    if (recognitionActiveRef.current) return;
    const rec = new SpeechRecognition();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-IN';
    recognitionRef.current = rec;
    rec.onresult = (event) => {
      let interim = ''; let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript; else interim += res[0].transcript;
      }
      if (interim) setLiveCaption({ speaker: usernameRef.current || 'You', text: interim });
      const cleanFinal = finalText.trim();
      if (cleanFinal) { setLiveCaption(null); emitCaption(cleanFinal); }
    };
    rec.onerror = (err) => {
      if (err?.error === 'not-allowed' || err?.error === 'service-not-allowed') { toast.error('Mic permission is required.'); setCaptionsEnabled(false); }
      recognitionActiveRef.current = false;
    };
    rec.onend = () => {
      recognitionActiveRef.current = false;
      if (captioningRef.current && audioEnabledRef.current) setTimeout(() => { if (captioningRef.current && audioEnabledRef.current) startRecognition(); }, 400);
    };
    try { rec.start(); recognitionActiveRef.current = true; } catch { recognitionActiveRef.current = false; }
  }, [emitCaption]);

  useEffect(() => {
    if (!captionsEnabled) { stopRecognition(); setLiveCaption(null); return; }
    if (!audioEnabledRef.current) { toast.info('Unmute to generate captions.'); stopRecognition(); return; }
    startRecognition();
  }, [captionsEnabled, audioEnabled, startRecognition, stopRecognition]);

  const addMessage = useCallback((data, sender, socketIdSender) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { type: 'text', sender, data, time, _idx: Date.now() + Math.random() }]);
    if (socketIdSender !== socketIdRef.current) setNewMessages((prev) => prev + 1);
  }, []);

  const handleAdmitUser = useCallback((socketId) => { socketRef.current?.emit('admit-user', { socketId }); }, []);
  const handleRejectUser = useCallback((socketId) => { socketRef.current?.emit('reject-user', { socketId }); }, []);
  const handleMuteUser = useCallback((socketId) => { socketRef.current?.emit('host-mute-user', { socketId }); }, []);
  const handleUnmuteUser = useCallback((socketId) => { socketRef.current?.emit('host-unmute-user', { socketId }); }, []);
  const handleVideoOffUser = useCallback((socketId) => { socketRef.current?.emit('host-video-off-user', { socketId }); }, []);
  const handleVideoOnUser = useCallback((socketId) => { socketRef.current?.emit('host-video-on-user', { socketId }); }, []);
  const handleMuteAll = useCallback(() => { socketRef.current?.emit('host-mute-all'); }, []);
  const handleVideoOffAll = useCallback(() => { socketRef.current?.emit('host-video-off-all'); }, []);

  const connectToMeeting = useCallback(async () => {
    const { videoEnabled: v, audioEnabled: a, quality } = prejoinMediaRef.current;
    const currentUsername = usernameRef.current;
    try {
      const qualityKey = quality || videoQualityRef.current || 'standard';
      let s;
      try {
        const constraints = resolveMediaConstraints({ video: true, audio: true }, qualityKey);
        s = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        const fallback = resolveMediaConstraints({ video: v, audio: a }, qualityKey);
        s = await navigator.mediaDevices.getUserMedia(fallback);
      }
      localStreamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      s.getVideoTracks().forEach(t => { t.enabled = v; if (!v) t.stop(); });
      s.getAudioTracks().forEach(t => { t.enabled = a; if (!a) t.stop(); });
      setVideoEnabled(v);
      setAudioEnabled(a);
      setVideoQuality(qualityKey);
      emitMediaState(a, v);
      socketRef.current?.emit('join-call', window.location.href, currentUsername);
      updatePhase('in-meeting');
    } catch (err) {
      socketRef.current?.emit('join-call', window.location.href, currentUsername);
      updatePhase('in-meeting');
    }
  }, [resolveMediaConstraints, updatePhase, emitMediaState, localVideoRef]);

  const connectToMeetingRef   = useRef(null);
  const addMessageRef         = useRef(null);
  const createPeerConnRef     = useRef(null);
  const getLocalMediaRef      = useRef(null);
  const updatePhaseRef        = useRef(null);
  const applyEncodingRef      = useRef(null);
  connectToMeetingRef.current  = connectToMeeting;
  addMessageRef.current        = addMessage;
  createPeerConnRef.current    = createPeerConnection;
  getLocalMediaRef.current     = getLocalMedia;
  updatePhaseRef.current       = updatePhase;
  applyEncodingRef.current     = applyEncodingToPeer;

  const socketReadyRef = useRef(false);
  useEffect(() => {
    if (!authLoading && !shouldShowLobby && phase !== 'prejoin') socketReadyRef.current = true;
  }, [authLoading, shouldShowLobby, phase]);

  useEffect(() => {
    let timeout;
    const tryConnect = () => {
      if (socketCreatedRef.current) return;
      if (!socketReadyRef.current) { timeout = setTimeout(tryConnect, 150); return; }
      socketCreatedRef.current = true;
      const socket = io(SERVER_URL, { secure: false, withCredentials: true, reconnection: false });
      socketRef.current = socket;

      socket.on('connect', () => {
        socketIdRef.current = socket.id;
        socket.emit('waiting-room-join', window.location.href, usernameRef.current);
      });
      socket.on('in-waiting-room', () => { updatePhaseRef.current('waiting'); });
      socket.on('admitted', async () => { await connectToMeetingRef.current(); });
      socket.on('rejected', () => { updatePhaseRef.current('rejected'); });
      socket.on('waiting-room-update', ({ waitlist: wl }) => { setWaitlist(wl); if (wl.length > 0) setShowHostPanel(true); });
      socket.on('waiting-room-notification', ({ username: wUsername, count }) => {
        toast(`👋 ${wUsername} is waiting`, { description: count > 1 ? `${count} people waiting` : undefined });
      });
      socket.on('error-event', ({ message }) => { if (message) toast.error(message); });
      
      socket.on('media-state', ({ socketId, audioEnabled, videoEnabled }) => {
        if (!socketId) return;
        setMediaStates(prev => ({
          ...prev, [socketId]: {
            audioEnabled: audioEnabled ?? prev[socketId]?.audioEnabled ?? true,
            videoEnabled: videoEnabled ?? prev[socketId]?.videoEnabled ?? true,
          }
        }));
      });

      socket.on('reaction', ({ emoji, socketId }) => {
        if (!emoji) return;
        if (socketId && socketId === socketIdRef.current) return;
        addReaction(emoji);
      });
      
      socket.on('raise-hand', ({ socketId, username: raisedBy, raised }) => {
        if (!socketId) return;
        setRaisedHands((prev) => { const next = { ...prev }; if (raised) next[socketId] = true; else delete next[socketId]; return next; });
        if (raised && isHostRef.current && socketId !== socketIdRef.current) toast.info(`${raisedBy || 'Someone'} raised a hand`);
      });

      socket.on('whiteboard-open', ({ presenter }) => {
        if (!presenter && isHostRef.current) return;
        setWhiteboardPresenter(presenter || 'Host');
        setWhiteboardVisible(true);
      });
      socket.on('whiteboard-close', () => { setWhiteboardVisible(false); setWhiteboardPresenter(''); });

      socket.on('caption', ({ id, text, speaker }) => {
        if (!text || !id || captionIdsRef.current.has(id)) return;
        captionIdsRef.current.add(id);
        if (captionIdsRef.current.size > 400) captionIdsRef.current.clear();
        addCaptionLine({ id, speaker: speaker || 'Someone', text, ts: Date.now(), self: false });
      });

      socket.on('host-force-mute', () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
        setAudioEnabled(false);
        emitMediaState(false, videoEnabledRef.current);
        toast.warning('Host muted your microphone');
      });
      socket.on('host-force-unmute', () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        setAudioEnabled(true);
        emitMediaState(true, videoEnabledRef.current);
        toast.info('Host unmuted your microphone');
      });
      socket.on('host-force-video-off', () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = false; });
        setVideoEnabled(false);
        emitMediaState(audioEnabledRef.current, false);
        toast.warning('Host turned off your camera');
      });
      socket.on('host-force-video-on', () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = true; });
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
        if (id === socket.id) emitMediaState(audioEnabledRef.current, videoEnabledRef.current);
        
        for (const clientId of clients) {
          if (clientId !== socket.id && !peersRef.current[clientId]) {
            const pc = createPeerConnRef.current(clientId);
            await getLocalMediaRef.current();
            const stream = localStreamRef.current;
            if (stream) stream.getTracks().forEach(track => { if (!pc.getSenders().find(s => s.track === track)) pc.addTrack(track, stream); });
            applyEncodingRef.current?.(pc, videoQualityRef.current);
            if (socket.id < clientId) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('signal', clientId, JSON.stringify({ sdp: pc.localDescription }));
            }
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
              if (pc.signalingState !== 'stable') {
                await Promise.all([pc.setLocalDescription({type: "rollback"}), pc.setRemoteDescription(new RTCSessionDescription(data.sdp))]);
              } else { await pc.setRemoteDescription(new RTCSessionDescription(data.sdp)); }
              if (pc.iceCandidatesQueue?.length) { for (const c of pc.iceCandidatesQueue) await pc.addIceCandidate(c); pc.iceCandidatesQueue = []; }
              await getLocalMediaRef.current();
              const stream = localStreamRef.current;
              if (stream) stream.getTracks().forEach(track => { if (!pc.getSenders().find(s => s.track === track)) pc.addTrack(track, stream); });
              applyEncodingRef.current?.(pc, videoQualityRef.current);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('signal', fromId, JSON.stringify({ sdp: pc.localDescription }));
            } else if (data.sdp.type === 'answer' && pc.signalingState === 'have-local-offer') {
               await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
               if (pc.iceCandidatesQueue?.length) { for (const c of pc.iceCandidatesQueue) await pc.addIceCandidate(c); pc.iceCandidatesQueue = []; }
            }
          } else if (data.ice) {
            if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(data.ice));
            else { pc.iceCandidatesQueue = pc.iceCandidatesQueue || []; pc.iceCandidatesQueue.push(new RTCIceCandidate(data.ice)); }
          }
        } catch (err) {}
      });

      socket.on('user-left', (socketId) => {
        const pc = peersRef.current[socketId];
        if (pc) { pc.close(); delete peersRef.current[socketId]; }
        setRemoteStreams(prev => prev.filter(v => v.id !== socketId));
        setUserNames(prev => { const n = { ...prev }; delete n[socketId]; return n; });
        setMediaStates(prev => { const n = { ...prev }; delete n[socketId]; return n; });
        setRaisedHands(prev => { const n = { ...prev }; delete n[socketId]; return n; });
        setPinnedId(prev => (prev === socketId ? null : prev));
      });

      socket.on('chat-message', (data, sender, sid) => addMessageRef.current(data, sender, sid));
      socket.on('screen-share-toggled', ({ sharingSocketId, sharing }) => { setActiveSharingId(sharing ? sharingSocketId : null); });
      socket.on('disconnect', () => { if (!intentionalDisconnectRef.current) toast.error('Lost connection to the meeting server.'); });
    };

    tryConnect();

    return () => {
      socketCreatedRef.current = false;
      clearTimeout(timeout);
      intentionalDisconnectRef.current = true;
      socketRef.current?.disconnect();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  }, []);

  const openChat = () => { setModal(!showModal); if (!showModal) setNewMessages(0); };
  const closeChat = () => { setModal(false); };
  const connect = () => { if (lobbyUsername.trim()) setIsConnected(true); };

  const performCleanup = useCallback(() => {
    sessionStorage.removeItem(`convox-phase:${window.location.href}`);
    try { recognitionRef.current?.stop(); } catch { }
    recognitionActiveRef.current = false;
    setCaptionsEnabled(false);
    if (recordingRef.current && recordingRef.current.state === 'recording') recordingRef.current.stop();
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    recordingStreamRef.current = null;
    setIsRecording(false);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    if (socketRef.current) socketRef.current.disconnect();
  }, []);

  const endCall = useCallback(() => {
    if (user && user.username && phase === 'in-meeting') { setShowFeedbackModal(true); return; }
    performCleanup();
    intentionalDisconnectRef.current = true;
    window.location.href = user?.username ? '/history' : '/home';
  }, [user, phase, performCleanup]);

  const handleFeedbackClose = useCallback(() => {
    setShowFeedbackModal(false);
    performCleanup();
    intentionalDisconnectRef.current = true;
    window.location.href = user?.username ? '/history' : '/home';
  }, [user, performCleanup]);

  return {
    socketRef, localStreamRef, socketIdRef, remoteStreams, userNames, messages, 
    showModal, setModal, newMessages, setNewMessages, videoEnabled, audioEnabled, 
    screenSharing, lobbyUsername, setLobbyUsername, isConnected, activeSharingId, 
    isHost, showShareCard, setShowShareCard, videoQuality, setVideoQuality, mediaStates, 
    reactions, showReactionPicker, setShowReactionPicker, raisedHands, captionsEnabled, 
    setCaptionsEnabled, captionLines, liveCaption, isRecording, recordingDuration, 
    pinnedId, setPinnedId, whiteboardVisible, setWhiteboardVisible, whiteboardPresenter, 
    showFeedbackModal, phase, updatePhase, waitlist, showHostPanel, setShowHostPanel, 
    prejoinMediaRef, username, shouldShowLobby, isHandRaised, togglePin, toggleWhiteboard, 
    mode, participantCount, upgrading, activeSpeakers, roomName, stopScreenShare, 
    toggleVideo, toggleAudio, toggleScreenShare, flipCamera, facingMode, sendReaction, toggleRaiseHand, 
    toggleRecording, handleAdmitUser, handleRejectUser, handleMuteUser, handleUnmuteUser, 
    handleVideoOffUser, handleVideoOnUser, handleMuteAll, handleVideoOffAll, openChat, 
    closeChat, connect, endCall, handleFeedbackClose
  };
}
