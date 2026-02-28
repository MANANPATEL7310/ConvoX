/**
 * useMeetingMode — tracks whether the current room is in P2P or SFU mode.
 *
 * Listens to:
 *   set-mode      → { mode: 'p2p'|'sfu', participantCount, roomPath }
 *   upgrade-to-sfu → triggers SFU transition with an overlay
 *
 * Returns: { mode, participantCount, upgrading }
 *   - mode:             'p2p' | 'sfu'
 *   - participantCount: number of users currently in the room
 *   - upgrading:        true for ~2s during the P2P→SFU switchover
 */
import { useState, useEffect, useRef } from 'react';

export function useMeetingMode(socketRef) {
  const [mode, setMode]                   = useState('p2p');
  const [participantCount, setCount]      = useState(1);
  const [upgrading, setUpgrading]         = useState(false);
  const upgradeTimer                      = useRef(null);
  const attachedSocketRef                 = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const handleSetMode = ({ mode: m, participantCount: c }) => {
      setMode(m);
      setCount(c);
    };

    const handleUpgrade = () => {
      setUpgrading(true);
      clearTimeout(upgradeTimer.current);
      // 2s overlay so P2P connections can close gracefully
      // NOTE: mode is already set to 'sfu' by the 'set-mode' event that
      // fires alongside upgrade-to-sfu — no need to call setMode here.
      upgradeTimer.current = setTimeout(() => {
        setUpgrading(false);
      }, 2000);
    };

    const attachToSocket = (socket) => {
      if (!socket || attachedSocketRef.current === socket) return;

      if (attachedSocketRef.current) {
        attachedSocketRef.current.off('set-mode', handleSetMode);
        attachedSocketRef.current.off('upgrade-to-sfu', handleUpgrade);
      }

      attachedSocketRef.current = socket;
      socket.on('set-mode', handleSetMode);
      socket.on('upgrade-to-sfu', handleUpgrade);
    };

    const tryAttach = () => {
      if (cancelled) return;
      const socket = socketRef.current;
      if (socket) {
        attachToSocket(socket);
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    tryAttach();
    if (!socketRef.current) {
      intervalId = setInterval(tryAttach, 200);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (attachedSocketRef.current) {
        attachedSocketRef.current.off('set-mode', handleSetMode);
        attachedSocketRef.current.off('upgrade-to-sfu', handleUpgrade);
        attachedSocketRef.current = null;
      }
      clearTimeout(upgradeTimer.current);
    };
  }, [socketRef]);

  return { mode, participantCount, upgrading };
}
