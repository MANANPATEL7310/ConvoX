import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_SCENE = {
  elements: [],
  appState: { viewBackgroundColor: '#0b0f1a' },
  files: {},
};

export default function WhiteboardOverlay({
  socketRef,
  visible,
  isHost,
  presenter,
  onClose,
}) {
  const [scene, setScene] = useState(DEFAULT_SCENE);
  const [remoteVersion, setRemoteVersion] = useState(0);
  const emitTimerRef = useRef(null);
  const pendingSceneRef = useRef(null);
  const initializedRef = useRef(false);

  const scheduleEmit = useCallback((nextScene) => {
    pendingSceneRef.current = nextScene;
    if (emitTimerRef.current) return;
    emitTimerRef.current = setTimeout(() => {
      emitTimerRef.current = null;
      const payload = pendingSceneRef.current;
      pendingSceneRef.current = null;
      if (payload) socketRef.current?.emit('whiteboard-state', { scene: payload });
    }, 200);
  }, [socketRef]);

  useEffect(() => {
    if (!visible) return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('whiteboard-request-sync');

    const handleState = ({ scene: nextScene, socketId }) => {
      if (!nextScene) return;
      if (isHost) return;
      if (socketId && socketId === socket.id) return;
      setScene(nextScene);
      setRemoteVersion(v => v + 1);
    };

    const handleSync = ({ scene: nextScene }) => {
      if (!nextScene) return;
      if (isHost) {
        if (initializedRef.current) return;
        initializedRef.current = true;
      }
      setScene(nextScene);
      setRemoteVersion(v => v + 1);
    };

    socket.on('whiteboard-state', handleState);
    socket.on('whiteboard-sync', handleSync);

    return () => {
      socket.off('whiteboard-state', handleState);
      socket.off('whiteboard-sync', handleSync);
    };
  }, [visible, socketRef, isHost]);

  useEffect(() => {
    if (!visible) return;
    if (!isHost) return;
    if (!initializedRef.current) return;
    toast.info('Whiteboard is live. Others are in view-only mode.');
  }, [visible, isHost]);

  const handleChange = useCallback((elements, appState, files) => {
    if (!isHost) return;
    const nextScene = {
      elements,
      appState: { viewBackgroundColor: appState?.viewBackgroundColor || '#0b0f1a' },
      files,
    };
    setScene(nextScene);
    scheduleEmit(nextScene);
  }, [isHost, scheduleEmit]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 120,
      background: '#0b0f1a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(15,23,42,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>✍️</div>
          <div>
            <div style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 700 }}>Whiteboard</div>
            <div style={{ color: '#9ca3af', fontSize: 10 }}>
              {isHost ? 'You are presenting' : `Host ${presenter || 'presenting'}`
              }
            </div>
          </div>
        </div>
        {isHost && (
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(239,68,68,0.15)',
              color: '#fecaca',
              border: '1px solid rgba(239,68,68,0.4)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Close whiteboard for everyone"
          >
            <X className="w-3.5 h-3.5" /> End Whiteboard
          </button>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1 }}>
        <Excalidraw
          initialData={scene}
          onChange={handleChange}
          viewModeEnabled={!isHost}
          zenModeEnabled
          gridModeEnabled={false}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              export: false,
              loadScene: false,
              saveAsImage: false,
              clearCanvas: isHost,
            },
          }}
          key={isHost ? 'host' : `viewer-${remoteVersion}`}
        />
      </div>
    </div>
  );
}
