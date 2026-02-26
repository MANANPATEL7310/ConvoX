import { Server } from "socket.io";
import { createClient } from "redis";

export const client = createClient();

export const startRedis = async () => {
    try {
        await client.connect();
        console.log("Redis Connected");
    } catch (e) {
        console.error("Redis Connection Error", e);
    }
};

/* ─── Hybrid architecture threshold ──────────────────────────────────────
 * ≤ P2P_THRESHOLD → P2P mesh  |  > P2P_THRESHOLD → LiveKit SFU
 * Change this single number to tune the cutover point.
 * ────────────────────────────────────────────────────────────────────── */
const P2P_THRESHOLD = 4;

/** Helper: compute + broadcast mode to all users in a room set */
async function broadcastMode(io, roomKey, roomPath) {
    const users = await client.sMembers(roomKey);
    const count  = users.length;
    const mode   = count <= P2P_THRESHOLD ? 'p2p' : 'sfu';
    for (const uid of users) {
        io.to(uid).emit("set-mode", { mode, participantCount: count, roomPath });
    }
    return { users, count, mode };
}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    // Map: socketId → username
    const socketUsernames = new Map();

    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED", socket.id);

        socket.on("join-call", async (path, username) => {
            // Cache room path on socket.data — avoids repeated Redis scans later
            socket.data.roomKey  = `connections:${path}`;
            socket.data.roomPath = path;

            if (username) socketUsernames.set(socket.id, username);

            // Register user + timestamp
            await client.sAdd(`connections:${path}`, socket.id);
            await client.hSet(`timeOnline:${socket.id}`, "joined", Date.now());

            const users = await client.sMembers(`connections:${path}`);
            const participantCount = users.length;

            // ── Host role: first user in the room becomes host ──
            const hostKey = `host:${path}`;
            let currentHost = await client.get(hostKey);
            if (!currentHost) {
                await client.set(hostKey, socket.id);
                currentHost = socket.id;
                console.log(`Room ${path}: ${socket.id} is now the HOST`);
            }
            // Tell the joining user their role
            io.to(socket.id).emit("role-assigned", {
                role: socket.id === currentHost ? 'host' : 'participant',
            });

            // Build usernames map for all peers
            const usernames = {};
            for (const uid of users) {
                usernames[uid] = socketUsernames.get(uid) || `User ${uid.slice(-4)}`;
            }

            // Notify everyone: new peer list + current mode
            const previousCount = participantCount - 1;
            const mode = participantCount <= P2P_THRESHOLD ? 'p2p' : 'sfu';
            const justCrossedThreshold = previousCount <= P2P_THRESHOLD && participantCount > P2P_THRESHOLD;

            for (const uid of users) {
                io.to(uid).emit("user-joined", socket.id, users, usernames);
                io.to(uid).emit("set-mode", { mode, participantCount, roomPath: path });
            }

            // Trigger graceful SFU upgrade when threshold is crossed
            if (justCrossedThreshold) {
                console.log(`Room ${path}: threshold crossed (${participantCount} users) → SFU`);
                for (const uid of users) {
                    io.to(uid).emit("upgrade-to-sfu", { roomPath: path, participantCount });
                }
            }

            // Replay chat history to joining user only
            const messages = await client.lRange(`messages:${path}`, 0, -1);
            for (const msg of messages) {
                const parsed = JSON.parse(msg);
                io.to(socket.id).emit("chat-message", parsed.data, parsed.sender, parsed["socket-id-sender"]);
            }
        });

        socket.on("signal", async (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", async (data, sender) => {
            // Use cached room path — O(1) instead of scanning all Redis keys
            const roomKey  = socket.data.roomKey;
            const roomPath = socket.data.roomPath;

            if (!roomKey) {
                console.warn("chat-message from socket with no room:", socket.id);
                return;
            }

            const msgObject = { sender, data, "socket-id-sender": socket.id };
            await client.rPush(`messages:${roomPath}`, JSON.stringify(msgObject));

            const users = await client.sMembers(roomKey);
            console.log(`Broadcasting chat to ${users.length} users in room ${roomPath}`);
            users.forEach(uid => io.to(uid).emit("chat-message", data, sender, socket.id));
        });

        /* ── Typing indicators (O(1) using cached room) ── */
        const broadcastToRoomExcludeSelf = async (eventName, payload) => {
            const roomKey = socket.data.roomKey;
            if (!roomKey) return;
            const users = await client.sMembers(roomKey);
            users.forEach(uid => {
                if (uid !== socket.id) io.to(uid).emit(eventName, payload);
            });
        };

        socket.on("typing",      async (u) => broadcastToRoomExcludeSelf("user-typing",      u));
        socket.on("stop-typing", async (u) => broadcastToRoomExcludeSelf("user-stop-typing", u));

        /* ── Screen share signalling ── */
        socket.on("screen-share-toggled", async ({ sharing }) => {
            await broadcastToRoomExcludeSelf("screen-share-toggled", {
                sharingSocketId: socket.id,
                sharing,
            });
        });

        /* ── Private (direct) message ── */
        socket.on("private-message", ({ toSocketId, data, sender }) => {
            io.to(toSocketId).emit("private-message", { data, sender, fromSocketId: socket.id });
            io.to(socket.id).emit("private-message",  { data, sender, fromSocketId: socket.id, toSocketId, isMine: true });
        });

        socket.on("disconnect", async () => {
            socketUsernames.delete(socket.id);

            const roomKey  = socket.data.roomKey;
            const roomPath = socket.data.roomPath;

            if (!roomKey) return; // disconnected before joining a room

            await client.sRem(roomKey, socket.id);
            const remaining = await client.sMembers(roomKey);

            // Notify remaining users that this peer left
            remaining.forEach(uid => io.to(uid).emit("user-left", socket.id));

            // ── Host promotion: if the leaving user was host, promote next ──
            const hostKey = `host:${roomPath}`;
            const currentHost = await client.get(hostKey);
            if (currentHost === socket.id && remaining.length > 0) {
                const newHost = remaining[0];
                await client.set(hostKey, newHost);
                io.to(newHost).emit("role-assigned", { role: 'host' });
                console.log(`Room ${roomPath}: host left → ${newHost} promoted`);
            }

            // Re-broadcast set-mode so participant count + mode badge updates
            if (remaining.length > 0) {
                await broadcastMode(io, roomKey, roomPath);
            } else {
                // Empty room — clean up Redis (including host key)
                await client.del(roomKey);
                await client.del(`messages:${roomPath}`);
                await client.del(hostKey);
            }
        });
    });

    return io;
};
