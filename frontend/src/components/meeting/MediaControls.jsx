import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import BrushIcon from '@mui/icons-material/Brush';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import SubtitlesOffIcon from '@mui/icons-material/SubtitlesOff';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PanToolIcon from '@mui/icons-material/PanTool';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';

/* ═══════════════════════════════════════════════════════════
   MEDIA CONTROLS
   Side floating bar for secondary actions (recording, whiteboard, captions, reactions, raise hand)
═══════════════════════════════════════════════════════════ */
export default function MediaControls({
  isHost,
  isRecording,
  toggleRecording,
  whiteboardVisible,
  toggleWhiteboard,
  captionsEnabled,
  setCaptionsEnabled,
  showReactionPicker,
  setShowReactionPicker,
  REACTION_OPTIONS,
  sendReaction,
  isHandRaised,
  toggleRaiseHand
}) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 18,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
        zIndex: 20,
        background: 'rgba(17,24,39,0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: '10px 8px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {isHost && (
        <Tooltip title={isRecording ? 'Stop recording' : 'Start recording'} enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
          <IconButton
            onClick={toggleRecording}
            style={{ color: isRecording ? '#ef4444' : 'white' }}
          >
            <FiberManualRecordIcon />
          </IconButton>
        </Tooltip>
      )}
      
      {isHost && (
        <Tooltip title={whiteboardVisible ? 'Close whiteboard' : 'Open whiteboard'} enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
          <IconButton
            onClick={toggleWhiteboard}
            style={{ color: whiteboardVisible ? '#22c55e' : 'white' }}
          >
            <BrushIcon />
          </IconButton>
        </Tooltip>
      )}
      
      <Tooltip title={captionsEnabled ? 'Turn off captions' : 'Turn on captions'} enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
        <IconButton
          onClick={() => setCaptionsEnabled(p => !p)}
          style={{ color: captionsEnabled ? '#a5b4fc' : 'white' }}
        >
          {captionsEnabled ? <SubtitlesIcon /> : <SubtitlesOffIcon />}
        </IconButton>
      </Tooltip>
      
      <div style={{ position: 'relative' }}>
        <Tooltip title="Send reaction" enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
          <IconButton
            onClick={() => setShowReactionPicker(p => !p)}
            style={{ color: "white" }}
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
      
      <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'} enterDelay={100} enterNextDelay={50} leaveDelay={0} arrow>
        <IconButton
          onClick={toggleRaiseHand}
          style={{ color: isHandRaised ? '#f59e0b' : 'white' }}
        >
          {isHandRaised ? <PanToolIcon /> : <PanToolOutlinedIcon />}
        </IconButton>
      </Tooltip>
    </div>
  );
}
