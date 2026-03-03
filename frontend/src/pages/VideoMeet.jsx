import React, { useRef, useState } from 'react';
import { Badge, IconButton, TextField, Button, Tooltip } from '@mui/material';
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
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import BrushIcon from '@mui/icons-material/Brush';
import ChatPanel from '../components/ChatPanel';
import SFURoom from '../components/SFURoom';
import ModeIndicator from '../components/ModeIndicator';
import ShareMeetingCard from '../components/ShareMeetingCard';
import PreJoinCard from '../components/PreJoinCard';
import WaitingRoomScreen from '../components/WaitingRoomScreen';
import HostControlPanel from '../components/HostControlPanel';
import WhiteboardOverlay from '../components/WhiteboardOverlay';
import FeedbackModal from '../components/FeedbackModal';
import ActionControlBar from '../components/meeting/ActionControlBar';
import MediaControls from '../components/meeting/MediaControls';
import VideoGrid from '../components/meeting/VideoGrid';
import MeetingCaptions from '../components/meeting/MeetingCaptions';
import { useMeetingEngine } from '../hooks/useMeetingEngine';

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
  const localVideoRef = useRef(null);
  
  const {
    socketRef, localStreamRef, socketIdRef, remoteStreams, userNames, messages, 
    showModal, setModal, newMessages, setNewMessages, videoEnabled, audioEnabled, 
    screenSharing, lobbyUsername, setLobbyUsername, isConnected, activeSharingId, 
    isHost, showShareCard, setShowShareCard, videoQuality, setVideoQuality, mediaStates,
    reactions, showReactionPicker, setShowReactionPicker, raisedHands, captionsEnabled, 
    setCaptionsEnabled, captionLines, liveCaption, isRecording, recordingDuration, 
    pinnedId, setPinnedId, whiteboardVisible, setWhiteboardVisible, whiteboardPresenter, 
    showFeedbackModal, phase, updatePhase, waitlist, showHostPanel, setShowHostPanel, 
    username, shouldShowLobby, isHandRaised, togglePin, toggleWhiteboard, 
    mode, participantCount, upgrading, activeSpeakers, roomName, stopScreenShare, 
    toggleVideo, toggleAudio, toggleScreenShare, sendReaction, toggleRaiseHand, 
    toggleRecording, handleAdmitUser, handleRejectUser, handleMuteUser, handleUnmuteUser, 
    handleVideoOffUser, handleVideoOnUser, handleMuteAll, handleVideoOffAll, openChat, 
    connect, endCall, handleFeedbackClose, prejoinMediaRef
  } = useMeetingEngine(localVideoRef);

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
                  className: "text-lg rounded-xl"
                }}
              />
              
              <Button 
                variant="contained" 
                onClick={connect}
                fullWidth
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 text-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 rounded-xl normal-case"
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
        <div
          className="absolute inset-0 z-[100] bg-[#090912]/85 backdrop-blur-md flex flex-col items-center justify-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-300 font-semibold text-base">Upgrading to HD call quality…</p>
          <p className="text-gray-500 text-[13px]">Reconnecting {participantCount} participants</p>
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


      {/* ── Recording indicator ── */}
      {isRecording && (
        <div
          className="absolute top-4 left-4 z-40 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/75 border border-red-500/50 text-red-200 text-xs font-bold tracking-widest"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          REC {formatDuration(recordingDuration)}
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
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
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
            <VideoGrid
              activeSharingId={activeSharingId}
              stopScreenShare={stopScreenShare}
              remoteStreams={remoteStreams}
              userNames={userNames}
              localVideoRef={localVideoRef}
              localStreamRef={localStreamRef}
              raisedHands={raisedHands}
              socketIdRef={socketIdRef}
              activeSpeakers={activeSpeakers}
              pinnedId={pinnedId}
              setPinnedId={setPinnedId}
              togglePin={togglePin}
              screenSharing={screenSharing}
              showModal={showModal}
            />
        {/* ── Bottom Controls (always visible) ── */}
            <ActionControlBar
              videoEnabled={videoEnabled}
              toggleVideo={toggleVideo}
              audioEnabled={audioEnabled}
              toggleAudio={toggleAudio}
              screenSharing={screenSharing}
              toggleScreenShare={toggleScreenShare}
              endCall={endCall}
              newMessages={newMessages}
              openChat={openChat}
              isHost={isHost}
              waitlistCount={waitlist.length}
              setShowHostPanel={setShowHostPanel}
              videoQuality={videoQuality}
              setVideoQuality={setVideoQuality}
              mode={mode}
              participantCount={participantCount}
              ModeIndicator={ModeIndicator}
            />

            {/* ── Side Controls (secondary actions) ── */}
            <MediaControls
              isHost={isHost}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
              whiteboardVisible={whiteboardVisible}
              toggleWhiteboard={toggleWhiteboard}
              captionsEnabled={captionsEnabled}
              setCaptionsEnabled={setCaptionsEnabled}
              showReactionPicker={showReactionPicker}
              setShowReactionPicker={setShowReactionPicker}
              REACTION_OPTIONS={REACTION_OPTIONS}
              sendReaction={sendReaction}
              isHandRaised={isHandRaised}
              toggleRaiseHand={toggleRaiseHand}
            />
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

      {/* ── Captions overlay (Global for both P2P and SFU) ── */}
      <MeetingCaptions
        captionsEnabled={captionsEnabled}
        captionLines={captionLines}
        liveCaption={liveCaption}
      />

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

      {/* ── Whiteboard Overlay (host-controlled) ── */}
      <WhiteboardOverlay
        socketRef={socketRef}
        visible={whiteboardVisible}
        isHost={isHost}
        presenter={whiteboardPresenter}
        onClose={toggleWhiteboard}
      />

      {/* ── Feedback Modal ── */}
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={handleFeedbackClose} 
      />
    </div>
  );
}
