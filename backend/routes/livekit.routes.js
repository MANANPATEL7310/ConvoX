import { AccessToken } from 'livekit-server-sdk';
import express from 'express';

const router = express.Router();

const LIVEKIT_API_KEY    = process.env.LIVEKIT_API_KEY    || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

/**
 * POST /api/v1/livekit/token
 * Body: { roomName: string, participantName: string }
 * Returns: { token: string, wsUrl: string }
 *
 * The frontend uses this token to join a LiveKit room directly via livekit-client.
 */
router.post('/token', async (req, res) => {
    try {
        const { roomName, participantName } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ message: 'roomName and participantName are required' });
        }

        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: participantName,
            ttl: '4h',
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();

        return res.json({
            token,
            wsUrl: process.env.LIVEKIT_WS_URL || 'ws://localhost:7880',
        });
    } catch (err) {
        console.error('LiveKit token error:', err);
        return res.status(500).json({ message: 'Failed to generate token' });
    }
});

export default router;
