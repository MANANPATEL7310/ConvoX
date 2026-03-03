import React from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ChatIcon from '@mui/icons-material/Chat';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/* ═══════════════════════════════════════════════════════════
   ACTION CONTROL BAR
   Main floating bottom bar for VideoMeet
═══════════════════════════════════════════════════════════ */
export default function ActionControlBar({
  videoEnabled,
  toggleVideo,
  audioEnabled,
  toggleAudio,
  screenSharing,
  toggleScreenShare,
  endCall,
  newMessages,
  openChat,
  isHost,
  waitlistCount,
  setShowHostPanel,
  videoQuality,
  setVideoQuality,
  mode,
  participantCount,
  ModeIndicator // Passed down if you want to keep it decoupled
}) {
  return (
    <div
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-3xl sm:rounded-full px-2 sm:px-6 py-2 sm:py-3 flex flex-wrap justify-center items-center gap-1 sm:gap-4 shadow-xl border border-white/10 w-[95%] sm:w-auto max-w-xl sm:max-w-2xl"
    >
      <Tooltip title={videoEnabled ? 'Turn off camera' : 'Turn on camera'} enterDelay={100} enterNextDelay={50} arrow>
        <IconButton onClick={toggleVideo} style={{ color: "white" }}>
          {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'} enterDelay={100} enterNextDelay={50} arrow>
        <IconButton onClick={toggleAudio} style={{ color: "white" }}>
          {audioEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={screenSharing ? 'Stop sharing' : 'Share screen'} enterDelay={100} enterNextDelay={50} arrow>
        <IconButton
          onClick={toggleScreenShare}
          style={{ color: screenSharing ? '#f97316' : 'white', position: 'relative' }}
        >
          {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          {screenSharing && (
            <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#f97316', animation: 'sfuSpeakPulse 1s ease-in-out infinite alternate' }} />
          )}
        </IconButton>
      </Tooltip>
      
      <Tooltip title="End call" enterDelay={100} enterNextDelay={50} arrow>
        <IconButton onClick={endCall} style={{ color: "#ef4444" }}>
          <CallEndIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Open chat" enterDelay={100} enterNextDelay={50} arrow>
        <IconButton onClick={openChat} style={{ color: "white" }}>
          <Badge badgeContent={newMessages} max={99} color="warning">
            <ChatIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      {isHost && (
        <Tooltip title="Host controls" enterDelay={100} enterNextDelay={50} arrow>
          <IconButton
            onClick={() => setShowHostPanel(p => !p)}
            style={{ color: waitlistCount > 0 ? '#fbbf24' : 'white' }}
          >
            <Badge badgeContent={waitlistCount} max={99} color="error">
              <AdminPanelSettingsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
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
        <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5f5', letterSpacing: '0.08em' }}>QUALITY</span>
        <select
          value={videoQuality}
          onChange={(e) => setVideoQuality(e.target.value)}
          style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <option value="low">Low</option>
          <option value="standard">Standard</option>
          <option value="hd">HD</option>
        </select>
      </div>

      <Tooltip title={mode === 'sfu' ? 'Meeting mode: SFU (3+ participants)' : 'Meeting mode: P2P (1–2 participants)'} enterDelay={100} enterNextDelay={50} arrow>
        <span style={{ display: 'inline-flex' }}>
          {ModeIndicator && <ModeIndicator mode={mode} participantCount={participantCount} />}
        </span>
      </Tooltip>
    </div>
  );
}
