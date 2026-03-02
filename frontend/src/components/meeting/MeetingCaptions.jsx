import styles from '../../styles/videoComponent.module.css';

/* ═══════════════════════════════════════════════════════════
   MEETING CAPTIONS
   Displays live subtitles over the video grid
═══════════════════════════════════════════════════════════ */
export default function MeetingCaptions({
  captionsEnabled,
  captionLines,
  liveCaption
}) {
  if (!captionsEnabled || (captionLines.length === 0 && !liveCaption)) {
    return null;
  }

  return (
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
  );
}
