import { Server } from "socket.io";
import { createClient } from "redis";
import jwt from "jsonwebtoken";
import { ScheduledMeeting } from "../models/ScheduledMeeting.js";

export const client = createClient();

export const startRedis = async () => {
    try {
        await client.connect();
        console.log("Redis Connected");
    } catch (e) {
        console.error("Redis Connection Error", e);
    }
};

const parseCookies = (cookieHeader = "") => {
    return cookieHeader.split(";").reduce((acc, part) => {
        const [key, ...rest] = part.trim().split("=");
        if (!key) return acc;
        acc[key] = decodeURIComponent(rest.join("="));
        return acc;
    }, {});
};

const attachUserFromSocket = (socket) => {
    if (socket.data.userId !== undefined) return;
    const cookies = parseCookies(socket.handshake?.headers?.cookie || "");
    const token = cookies.token;
    if (!token) {
        socket.data.userId = null;
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        socket.data.userId = decoded?.id || null;
    } catch {
        socket.data.userId = null;
    }
};

const getMeetingCodeFromPath = (path) => {
    if (!path) return null;
    try {
        const url = new URL(path);
        return url.pathname.split("/").filter(Boolean).pop() || null;
    } catch {
        const cleaned = path.split("?")[0];
        return cleaned.split("/").filter(Boolean).pop() || null;
    }
};

/* ─── Hybrid architecture threshold ──────────────────────────────────────
 * ≤ P2P_THRESHOLD → P2P mesh  |  > P2P_THRESHOLD → LiveKit SFU
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

/** Helper: emit the latest waitlist to the host of a room */
async function broadcastWaitlist(io, path) {
    const hostKey  = `host:${path}`;
    const hostId   = await client.get(hostKey);
    if (!hostId) return;

    const raw      = await client.hGetAll(`waitlist:${path}`);
    // raw → { socketId: username, ... }
    const waitlist = Object.entries(raw).map(([socketId, username]) => ({ socketId, username }));
    io.to(hostId).emit("waiting-room-update", { waitlist });
    return { hostId, waitlist };
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
        attachUserFromSocket(socket);
        console.log("SOMETHING CONNECTED", socket.id);

        /* ════════════════════════════════════════════════════════════════
         * WAITING ROOM — user signals intent to join before being admitted
         * ════════════════════════════════════════════════════════════════ */
        socket.on("waiting-room-join", async (path, username) => {
            socket.data.roomPath    = path;
            socket.data.roomKey     = `connections:${path}`;
            socket.data.pendingPath = path;     // mark as "in waiting room"
            socket.data.username    = username || `User ${socket.id.slice(-4)}`;
            socket.data.admitted    = false;

            if (username) socketUsernames.set(socket.id, username);

            const hostKey     = `host:${path}`;
            const hostNameKey = `hostName:${path}`;
            const mainHostKey = `mainHost:${path}`;

            const meetingCode = getMeetingCodeFromPath(path);
            const scheduledMeeting = meetingCode
                ? await ScheduledMeeting.findOne({
                    meetingCode,
                    status: { $in: ["scheduled", "started"] },
                }).sort({ scheduledFor: -1 })
                : null;
            const isHostUser = scheduledMeeting
                ? String(scheduledMeeting.hostUserId) === String(socket.data.userId)
                : false;
            const forceWaitingRoom = scheduledMeeting && !isHostUser;
            
            const currentHostSocket = await client.get(hostKey);
            const currentHostName   = await client.get(hostNameKey);
            let   mainHostName      = await client.get(mainHostKey);

            // If room is completely fresh, set the main host (avoid letting non-hosts claim it for scheduled meetings)
            if (!mainHostName && socket.data.username && (!scheduledMeeting || isHostUser)) {
                await client.set(mainHostKey, socket.data.username);
                mainHostName = socket.data.username;
            }

            const isCurrentHost = currentHostName === socket.data.username;
            const isMainHost    = mainHostName === socket.data.username;

            if (!forceWaitingRoom && (!currentHostSocket || isCurrentHost || isMainHost)) {
                // ── Admitted Instantly ──
                // IF they are the Main Host returning to steal the role from an interim host
                if (currentHostSocket && isMainHost && !isCurrentHost) {
                    io.to(currentHostSocket).emit("role-assigned", { role: 'participant' });
                    console.log(`Room ${path}: Main Host ${socket.data.username} returned, reclaiming role from ${currentHostName}`);
                }

                // LOCK THE HOST ROLE
                await client.set(hostKey, socket.id);
                await client.set(hostNameKey, socket.data.username);

                console.log(`Room ${path}: ${socket.id} is HOST, admitted instantly`);
                socket.data.pendingPath = null;
                socket.data.admitted = true;
                io.to(socket.id).emit("admitted", { asHost: true });
            } else {
                // ── Room has a host: add to waitlist ──
                const wlKey = `waitlist:${path}`;
                await client.hSet(wlKey, socket.id, socket.data.username);

                // Tell this user they are in the waiting room
                io.to(socket.id).emit("in-waiting-room");

                // Push waitlist update to the host
                const waitlistInfo = await broadcastWaitlist(io, path);
                const waitlist = waitlistInfo?.waitlist || [];

                // Toast notification to all in-meeting users
                const roomUsers = await client.sMembers(`connections:${path}`);
                roomUsers.forEach(uid => {
                    io.to(uid).emit("waiting-room-notification", {
                        username: socket.data.username,
                        count:    waitlist.length,
                    });
                });

                console.log(`Room ${path}: ${socket.id} (${socket.data.username}) is WAITING`);
            }
        });

        /* ── Host admits a waiting user ── */
        socket.on("admit-user", async ({ socketId }) => {
            const path   = socket.data.roomPath;
            const hostKey = `host:${path}`;
            const hostId  = await client.get(hostKey);

            // Security: only the current host can admit
            if (hostId !== socket.id) {
                return io.to(socket.id).emit("error-event", { message: "Only the host can admit users." });
            }

            const meetingCode = getMeetingCodeFromPath(path);
            const scheduledMeeting = meetingCode
                ? await ScheduledMeeting.findOne({
                    meetingCode,
                    status: { $in: ["scheduled", "started"] },
                }).sort({ scheduledFor: -1 })
                : null;

            if (scheduledMeeting) {
                const isHostUser = String(scheduledMeeting.hostUserId) === String(socket.data.userId);
                if (!isHostUser) {
                    return io.to(socket.id).emit("error-event", { message: "Only the scheduled host can admit users." });
                }
                if (new Date() < scheduledMeeting.scheduledFor) {
                    return io.to(socket.id).emit("error-event", { message: "Meeting has not started yet." });
                }
            }

            // Remove from waitlist
            await client.hDel(`waitlist:${path}`, socketId);

            // Tell the admitted user they can join
            const admittedSocket = io.sockets.sockets.get(socketId);
            if (admittedSocket) {
                admittedSocket.data.pendingPath = null;
                admittedSocket.data.admitted = true;
            }
            io.to(socketId).emit("admitted", { asHost: false });

            // Update waitlist for host
            await broadcastWaitlist(io, path);

            console.log(`Room ${path}: HOST admitted ${socketId}`);
        });

        /* ── Host rejects/removes a waiting user ── */
        socket.on("reject-user", async ({ socketId }) => {
            const path    = socket.data.roomPath;
            const hostKey = `host:${path}`;
            const hostId  = await client.get(hostKey);

            if (hostId !== socket.id) return;

            const meetingCode = getMeetingCodeFromPath(path);
            const scheduledMeeting = meetingCode
                ? await ScheduledMeeting.findOne({
                    meetingCode,
                    status: { $in: ["scheduled", "started"] },
                }).sort({ scheduledFor: -1 })
                : null;
            if (scheduledMeeting) {
                const isHostUser = String(scheduledMeeting.hostUserId) === String(socket.data.userId);
                if (!isHostUser) return;
            }

            // Remove from waitlist
            await client.hDel(`waitlist:${path}`, socketId);

            // Tell the rejected user
            io.to(socketId).emit("rejected");

            // Update waitlist for host
            await broadcastWaitlist(io, path);

            console.log(`Room ${path}: HOST rejected ${socketId}`);
        });

        /* ════════════════════════════════════════════════════════════════
         * JOIN — called when user is admitted (host directly, or after admit)
         * ════════════════════════════════════════════════════════════════ */
        socket.on("join-call", async (path, username) => {
            socket.data.roomKey  = `connections:${path}`;
            socket.data.roomPath = path;

            if (username) socketUsernames.set(socket.id, username);

            if (socket.data.pendingPath && !socket.data.admitted) {
                return io.to(socket.id).emit("error-event", { message: "You must be admitted by the host before joining." });
            }

            socket.data.pendingPath = null;

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
            const mode = participantCount <= P2P_THRESHOLD ? 'p2p' : 'sfu';
            const previousCount = participantCount - 1;
            const justCrossedThreshold = previousCount <= P2P_THRESHOLD && participantCount > P2P_THRESHOLD;

            for (const uid of users) {
                io.to(uid).emit("user-joined", socket.id, users, usernames);
                io.to(uid).emit("set-mode", { mode, participantCount, roomPath: path });
            }

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

            // If this newly joined user is the host, send them the current waitlist
            if (socket.id === currentHost) {
                await broadcastWaitlist(io, path);
            }
        });

        socket.on("signal", async (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", async (data, sender) => {
            const roomKey  = socket.data.roomKey;
            const roomPath = socket.data.roomPath;

            if (!roomKey) {
                console.warn("chat-message from socket with no room:", socket.id);
                return;
            }

            const msgObject = { sender, data, "socket-id-sender": socket.id };
            await client.rPush(`messages:${roomPath}`, JSON.stringify(msgObject));

            const users = await client.sMembers(roomKey);
            users.forEach(uid => io.to(uid).emit("chat-message", data, sender, socket.id));
        });

        /* ── Typing indicators ── */
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

            const roomKey   = socket.data.roomKey;
            const roomPath  = socket.data.roomPath;

            // If they were in the waiting room — clean up waitlist
            if (roomPath) {
                await client.hDel(`waitlist:${roomPath}`, socket.id);
                await broadcastWaitlist(io, roomPath);
            }

            if (!roomKey) return; // disconnected before joining a room

            await client.sRem(roomKey, socket.id);
            const remaining = await client.sMembers(roomKey);

            remaining.forEach(uid => io.to(uid).emit("user-left", socket.id));

            // ── Host promotion: if the leaving user was host, promote next ──
            const hostKey = `host:${roomPath}`;
            const hostNameKey = `hostName:${roomPath}`;
            const currentHost = await client.get(hostKey);

            if (currentHost === socket.id) {
                if (remaining.length > 0) {
                    // Give the host a 4 second grace period to reconnect before promoting someone else
                    setTimeout(async () => {
                        const hostAfterTimeout = await client.get(hostKey);
                        if (hostAfterTimeout === socket.id) {
                            // Host did not reconnect to claim a new socket.id
                            const newRemaining = await client.sMembers(roomKey);
                            if (newRemaining.length > 0) {
                                const newHost = newRemaining[0];
                                const newHostName = socketUsernames.get(newHost);
                                await client.set(hostKey, newHost);
                                if (newHostName) await client.set(hostNameKey, newHostName);
                                
                                io.to(newHost).emit("role-assigned", { role: 'host' });
                                await broadcastWaitlist(io, roomPath);
                                console.log(`Room ${roomPath}: host left permanently → ${newHost} promoted`);
                            } else {
                                await client.del(hostKey);
                                await client.del(hostNameKey);
                            }
                        }
                    }, 4000);
                } else {
                    await client.del(hostKey);
                    await client.del(hostNameKey);
                }
            }

            if (remaining.length > 0) {
                await broadcastMode(io, roomKey, roomPath);
            } else {
                // Empty room — clean up all Redis keys
                await client.del(roomKey);
                await client.del(`messages:${roomPath}`);
                await client.del(hostKey);
                await client.del(hostNameKey);
                await client.del(`mainHost:${roomPath}`);
                await client.del(`waitlist:${roomPath}`);
            }
        });
    });

    return io;
};
