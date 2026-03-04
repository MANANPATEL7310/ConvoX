import React from 'react';
import styles from '../../styles/videoComponent.module.css';

/* ═══════════════════════════════════════════════════════════
   VIDEO GRID
   Handles the complex Layouts for P2P mode (Presenter, Pinned, Normal Grid, Local Corner)
═══════════════════════════════════════════════════════════ */

/** Extract up to 2 initials from a display name */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Avatar overlay shown when a participant turns their camera off */
function AvatarOverlay({ name, isLocal }) {
  const initials = getInitials(name || (isLocal ? 'You' : '?'));
  const displayName = name || (isLocal ? 'You' : 'Participant');
  return (
    <div className={styles.videoOffOverlay}>
      <div className={styles.avatarCircle}>
        <span className={styles.avatarInitials}>{initials}</span>
      </div>
      <span className={styles.avatarName}>{displayName}</span>
      <span className={styles.cameraOffBadge}>
        {/* Camera off icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 6.5l-4-4-12 12-2.5-2.5-1.42 1.42 3.92 3.92L1 21h2l17-17-1.42-1.42zM19 6.82L23 3v18l-4-3.18V6.82z"/>
          <path d="M3.27 2L2 3.27 4.73 6H3.5C2.12 6 1 7.12 1 8.5v7C1 16.88 2.12 18 3.5 18H16l2 2L19.27 21 3.27 2zm.23 6h11l6 6 .5.5V17l-2-2H3.5A.5.5 0 0 1 3 16.5v-7c0-.28.22-.5.5-.5z"/>
        </svg>
        Camera off
      </span>
    </div>
  );
}

export default function VideoGrid({
  activeSharingId,
  stopScreenShare,
  remoteStreams,
  userNames,
  localVideoRef,
  localStreamRef,
  raisedHands,
  socketIdRef,
  activeSpeakers,
  pinnedId,
  setPinnedId,
  togglePin,
  screenSharing,
  showModal,
  mediaStates = {},
  videoEnabled = true,
  username = '',
}) {
  const getGridClass = (count) => {
    if (count === 0) return styles.waitingState;
    if (count === 1) return styles.oneUser;
    if (count === 2) return styles.twoUsers;
    if (count === 3) return styles.threeUsers;
    if (count === 4) return styles.fourUsers;
    return styles.multipleUsers; // 5+
  };

  const isRemoteVideoOff = (id) => mediaStates[id]?.videoEnabled === false;

  return (
    <>
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
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)', opacity: videoEnabled ? 1 : 0 }} />
              {!videoEnabled && (
                <AvatarOverlay name={username} isLocal />
              )}
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
              const videoOff = isRemoteVideoOff(rs.id);
              return (
                <div key={rs.id} className={styles.presenterThumb} style={{ outline: isSpeaking ? '2px solid #22c55e' : 'none' }}>
                  <video
                    autoPlay playsInline muted={false}
                    className="w-full h-full object-cover"
                    style={{ opacity: videoOff ? 0 : 1 }}
                    ref={el => { if (el && rs.stream) el.srcObject = rs.stream; }}
                  />
                  {videoOff && (
                    <AvatarOverlay name={userNames[rs.id] || `User ${rs.id.slice(-4)}`} />
                  )}
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
      ) : pinnedId ? (
        /* ══════════════════════════════════════════
           PINNED LAYOUT — user pinned to main stage
        ══════════════════════════════════════════ */
        <div className={styles.presenterLayout}>
          <div className={styles.presenterMain}>
            {pinnedId === 'local' ? (
              <div className="relative w-full h-full">
                <video
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)', opacity: videoEnabled ? 1 : 0 }}
                  ref={(el) => {
                    if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
                  }}
                />
                {!videoEnabled && <AvatarOverlay name={username} isLocal />}
              </div>
            ) : (
              (() => {
                const pinnedStream = remoteStreams.find(r => r.id === pinnedId);
                const videoOff = isRemoteVideoOff(pinnedId);
                return pinnedStream ? (
                  <div className="relative w-full h-full">
                    <video
                      autoPlay
                      playsInline
                      muted={false}
                      className="w-full h-full object-cover"
                      style={{ opacity: videoOff ? 0 : 1 }}
                      ref={(el) => { if (el && pinnedStream.stream) el.srcObject = pinnedStream.stream; }}
                    />
                    {videoOff && <AvatarOverlay name={userNames[pinnedId] || `User ${pinnedId.slice(-4)}`} />}
                  </div>
                ) : (
                  <div className={styles.sharingBanner}>
                    <p className={styles.sharingBannerTitle}>Pinned user left</p>
                    <button className={styles.stopSharingBtn} onClick={() => setPinnedId(null)}>
                      Back to grid
                    </button>
                  </div>
                );
              })()
            )}

            <div className={styles.pinLabel}>
              📌 Pinned: {pinnedId === 'local' ? 'You' : (userNames[pinnedId] || 'Participant')}
            </div>
            <button className={styles.unpinBtn} onClick={() => setPinnedId(null)}>
              Unpin
            </button>
          </div>

          <div className={styles.presenterSidebar}>
            {/* Local thumbnail */}
            {pinnedId !== 'local' && (
              <div className={styles.presenterThumb} onDoubleClick={() => togglePin('local')}>
                <video
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)', opacity: videoEnabled ? 1 : 0 }}
                  ref={(el) => {
                    if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
                  }}
                />
                {!videoEnabled && <AvatarOverlay name={username} isLocal />}
                <div className={styles.thumbLabel}>You</div>
              </div>
            )}

            {/* Remote thumbnails */}
            {remoteStreams.filter(rs => rs.id !== pinnedId).map(rs => {
              const isSpeaking = activeSpeakers.has(rs.id);
              const videoOff = isRemoteVideoOff(rs.id);
              return (
                <div
                  key={rs.id}
                  className={styles.presenterThumb}
                  style={{ outline: isSpeaking ? '2px solid #22c55e' : 'none' }}
                  onDoubleClick={() => togglePin(rs.id)}
                >
                  <video
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full h-full object-cover"
                    style={{ opacity: videoOff ? 0 : 1 }}
                    ref={el => { if (el && rs.stream) el.srcObject = rs.stream; }}
                  />
                  {videoOff && <AvatarOverlay name={userNames[rs.id] || `User ${rs.id.slice(-4)}`} />}
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
                const videoOff = isRemoteVideoOff(remoteStream.id);
                return (
                  <div
                    key={remoteStream.id}
                    className="relative group w-full h-full"
                    onDoubleClick={() => togglePin(remoteStream.id)}
                    title="Double-click to pin"
                  >
                    <video
                      autoPlay playsInline muted={false}
                      className="w-full h-full object-cover"
                      style={{ opacity: videoOff ? 0 : 1 }}
                      ref={el => { if (el && remoteStream.stream) el.srcObject = remoteStream.stream; }}
                    />
                    {/* Avatar overlay when video is off */}
                    {videoOff && (
                      <AvatarOverlay name={userNames[remoteStream.id] || `User ${remoteStream.id.slice(-4)}`} />
                    )}
                    {pinnedId === remoteStream.id && (
                      <div className={styles.pinBadge}>📌</div>
                    )}
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
          <div
            className="absolute top-2 right-14 sm:top-4 sm:right-16 md:top-4 md:right-16 w-24 h-16 sm:w-36 sm:h-28 md:w-48 md:h-36 lg:w-64 lg:h-48 xl:w-80 xl:h-60 z-40 rounded-lg overflow-hidden shadow-xl sm:shadow-2xl border sm:border-2 border-white border-opacity-20 transition-all duration-300"
            onDoubleClick={() => togglePin('local')}
            title="Double-click to pin"
          >
            <video 
              ref={el => {
                localVideoRef.current = el;
                if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
              }} 
              autoPlay muted playsInline 
              className="w-full h-full object-cover bg-black" 
              style={{ transform: 'scaleX(-1)', opacity: videoEnabled ? 1 : 0 }}
            />
            {/* Avatar overlay for local user when video is off */}
            {!videoEnabled && (
              <AvatarOverlay name={username} isLocal />
            )}
            {pinnedId === 'local' && (
              <div className={styles.pinBadge}>📌</div>
            )}
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
    </>
  );
}
