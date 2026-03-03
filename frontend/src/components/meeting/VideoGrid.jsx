import React from 'react';
import styles from '../../styles/videoComponent.module.css';

/* ═══════════════════════════════════════════════════════════
   VIDEO GRID
   Handles the complex Layouts for P2P mode (Presenter, Pinned, Normal Grid, Local Corner)
═══════════════════════════════════════════════════════════ */
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
  showModal
}) {
  const getGridClass = (count) => {
    if (count === 0) return styles.waitingState;
    if (count === 1) return styles.oneUser;
    if (count === 2) return styles.twoUsers;
    if (count === 3) return styles.threeUsers;
    if (count === 4) return styles.fourUsers;
    return styles.multipleUsers; // 5+
  };

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
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
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
      ) : pinnedId ? (
        /* ══════════════════════════════════════════
           PINNED LAYOUT — user pinned to main stage
        ══════════════════════════════════════════ */
        <div className={styles.presenterLayout}>
          <div className={styles.presenterMain}>
            {pinnedId === 'local' ? (
              <video
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                ref={(el) => {
                  if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
                }}
              />
            ) : (
              (() => {
                const pinnedStream = remoteStreams.find(r => r.id === pinnedId);
                return pinnedStream ? (
                  <video
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full h-full object-cover"
                    ref={(el) => { if (el && pinnedStream.stream) el.srcObject = pinnedStream.stream; }}
                  />
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
                  style={{ transform: 'scaleX(-1)' }}
                  ref={(el) => {
                    if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
                  }}
                />
                <div className={styles.thumbLabel}>You</div>
              </div>
            )}

            {/* Remote thumbnails */}
            {remoteStreams.filter(rs => rs.id !== pinnedId).map(rs => {
              const isSpeaking = activeSpeakers.has(rs.id);
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
                  <div
                    key={remoteStream.id}
                    className="relative group w-full h-full"
                    onDoubleClick={() => togglePin(remoteStream.id)}
                    title="Double-click to pin"
                  >
                    <video
                      autoPlay playsInline muted={false}
                      className="w-full h-full object-cover"
                      ref={el => { if (el && remoteStream.stream) el.srcObject = remoteStream.stream; }}
                    />
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
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-24 h-16 sm:w-36 sm:h-28 md:w-48 md:h-36 lg:w-64 lg:h-48 xl:w-80 xl:h-60 z-50 rounded-lg overflow-hidden shadow-xl sm:shadow-2xl border sm:border-2 border-white border-opacity-20 transition-all duration-300"
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
              style={{ transform: 'scaleX(-1)' }}
            />
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
