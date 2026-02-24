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
import { useAuth } from '../contexts/useAuth';
import styles from "../styles/videoComponent.module.css";

const SERVER_URL = "http://localhost:8000";
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  // Refs for proper cleanup and state management
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const socketIdRef = useRef(null);

  // State for UI
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setModal] = useState(false);
  const [newMessages, setNewMessages] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [lobbyUsername, setLobbyUsername] = useState(""); // For lobby input only
  const [isConnected, setIsConnected] = useState(false); // Track connection state

  const { user } = useAuth();

  // Use derived state for display username
  const username = user?.username || lobbyUsername;
  const shouldShowLobby = !user?.username && !isConnected;

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
      throw error;
    }
  }, []);

  const getDisplayMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      
      // Replace local stream with display stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Handle screen share end
      stream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        getLocalMedia();
      };

      // Update all peer connections with new stream using replaceTrack
      Object.values(peersRef.current).forEach(pc => {
        if (pc.signalingState !== 'closed') {
          const senders = pc.getSenders();
          
          stream.getTracks().forEach((track) => {
            const sender = senders.find(s => s.track && s.track.kind === track.kind);
            if (sender) {
              // Replace existing track
              pc.replaceTrack(sender.track, track, stream);
            } else {
              // Add new track if no existing one found
              pc.addTrack(track, stream);
            }
          });
        }
      });

      return stream;
    } catch (error) {
      console.error('Error getting display media:', error);
      throw error;
    }
  }, [getLocalMedia]);

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
      setScreenSharing(false);
      await getLocalMedia({ video: videoEnabled, audio: audioEnabled });
    } else {
      try {
        await getDisplayMedia();
        setScreenSharing(true);
      } catch (error) {
        console.error('Failed to start screen sharing:', error);
      }
    }
  }, [screenSharing, videoEnabled, audioEnabled, getLocalMedia, getDisplayMedia]);

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
    window.location.href = "/";
  }, []);

  /* -------------------- CHAT -------------------- */

  const sendMessage = useCallback(() => {
    if (message.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', message, username);
      setMessage("");
    }
  }, [message, username]);

  const addMessage = useCallback((data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data }
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  }, []);

  /* -------------------- SOCKET -------------------- */

  useEffect(() => {
    if (shouldShowLobby) return; // Don't connect until username is set

    const socket = io(SERVER_URL, { secure: false, withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', async () => {
      socketIdRef.current = socket.id;
      
      try {
        await getLocalMedia();
        socket.emit('join-call', window.location.href, username);
      } catch (error) {
        console.error('Failed to get initial media:', error);
      }
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

    /* ---------------- CLEANUP ---------------- */
    return () => {
      socket?.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, [shouldShowLobby, username, getLocalMedia, createPeerConnection, addMessage]);

  /* -------------------- UI -------------------- */

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

  // Lobby UI
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
      {/* Left Side - Video Layout */}
      <div className={`flex-1 relative transition-all duration-300 ${showModal ? 'max-w-[calc(100vw-20rem)]' : 'w-full'}`}>
        {/* Video Layout */}
        <div className={`${styles.conferenceView} ${remoteStreams.length === 1 ? styles.twoUsers : remoteStreams.length >= 2 ? styles.multipleUsers : ''}`}>
          {/* Remote Videos - occupy background space */}
          {remoteStreams.map((remoteStream) => (
            <div key={remoteStream.id} className="relative group w-full h-full">
              <video
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
                ref={(el) => {
                  if (el && remoteStream.stream) {
                    el.srcObject = remoteStream.stream;
                  }
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {userNames[remoteStream.id] || `User ${remoteStream.id.slice(-4)}`}
              </div>
            </div>
          ))}
        </div>
        
        {/* Local Video - always in corner, outside conferenceView */}
        <div className="local-video-corner absolute top-4 right-4 w-48 h-36 md:w-64 md:h-48 lg:w-80 lg:h-60 z-50 rounded-lg overflow-hidden shadow-2xl border-2 border-white border-opacity-20">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover bg-black"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            You
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center space-x-2 sm:space-x-4">
          <IconButton onClick={toggleVideo} style={{ color: "white" }} className="p-2 sm:p-3">
            {videoEnabled ? <VideocamIcon className="text-lg sm:text-xl" /> : <VideocamOffIcon className="text-lg sm:text-xl" />}
          </IconButton>
          
          <IconButton onClick={toggleAudio} style={{ color: "white" }} className="p-2 sm:p-3">
            {audioEnabled ? <MicIcon className="text-lg sm:text-xl" /> : <MicOffIcon className="text-lg sm:text-xl" />}
          </IconButton>
          
          <IconButton onClick={toggleScreenShare} style={{ color: "white" }} className="p-2 sm:p-3 hidden sm:inline-flex">
            {screenSharing ? <StopScreenShareIcon className="text-lg sm:text-xl" /> : <ScreenShareIcon className="text-lg sm:text-xl" />}
          </IconButton>
          
          <IconButton onClick={endCall} style={{ color: "#ef4444" }} className="p-2 sm:p-3">
            <CallEndIcon className="text-lg sm:text-xl" />
          </IconButton>
          
          <Badge badgeContent={newMessages} max={99} color='warning'>
            <IconButton onClick={openChat} style={{ color: "white" }} className="p-2 sm:p-3">
              <ChatIcon className="text-lg sm:text-xl" />                        
            </IconButton>
          </Badge>
        </div>
      </div>

      {/* Right Side - Chat Section - Only render when chat is open on desktop */}
      {showModal && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col animate-slide-in">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Chat</h3>
            <button
              onClick={closeChat}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No Messages Yet</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold text-xs text-blue-400">{msg.sender}: </span>
                  <span className="text-xs text-gray-300 break-words">{msg.data}</span>
                </div>
              ))
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <TextField
                size="small"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="text-sm"
                InputProps={{
                  style: { fontSize: '14px', backgroundColor: '#374151', color: 'white' }
                }}
              />
              <Button onClick={sendMessage} size="small" disabled={!message.trim()} className="text-sm bg-blue-600 hover:bg-blue-700">
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Chat Toggle */}
      {showModal && (
        <div className="absolute top-20 right-4 w-80 max-w-[90vw] h-96 max-h-[60vh] bg-white rounded-lg shadow-xl z-[60] flex flex-col sm:hidden">
          <div className="p-3 sm:p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-sm sm:text-base">Chat</h3>
            <button
              onClick={closeChat}
              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-4 sm:py-8 text-sm">No Messages Yet</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold text-xs sm:text-sm">{msg.sender}: </span>
                  <span className="text-xs sm:text-sm break-words">{msg.data}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 sm:p-4 border-t">
            <div className="flex space-x-2">
              <TextField
                size="small"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="text-sm"
                InputProps={{
                  style: { fontSize: '14px' }
                }}
              />
              <Button onClick={sendMessage} size="small" disabled={!message.trim()} className="text-sm">
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
