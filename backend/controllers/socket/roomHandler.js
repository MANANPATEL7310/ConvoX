import { ScheduledMeeting } from "../../models/ScheduledMeeting.js";
import { getMeetingCodeFromPath, broadcastWaitlist, broadcastMode } from "./socketUtils.js";

export const registerRoomHandlers = (io, socket, client, socketUsernames) => {
    socket.on("join-call", async (path, username) => {
        socket.data.roomKey  = `connections:${path}`;
        socket.data.roomPath = path;

        if (username) socketUsernames.set(socket.id, username);

        if (socket.data.pendingPath && !socket.data.admitted) {
            return io.to(socket.id).emit("error-event", { message: "You must be admitted by the host before joining." });
        }

        socket.data.pendingPath = null;

        await client.sAdd(`connections:${path}`, socket.id);
        await client.hSet(`timeOnline:${socket.id}`, "joined", Date.now());

        const users = await client.sMembers(`connections:${path}`);
        const participantCount = users.length;

        const hostKey = `host:${path}`;
        let currentHost = await client.get(hostKey);
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

        if (!currentHost) {
            if (!scheduledMeeting || isHostUser) {
                await client.set(hostKey, socket.id);
                currentHost = socket.id;
            }
        }

        io.to(socket.id).emit("role-assigned", {
            role: socket.id === currentHost ? 'host' : 'participant',
        });

        const usernames = {};
        for (const uid of users) {
            usernames[uid] = socketUsernames.get(uid) || `User ${uid.slice(-4)}`;
        }

        const thresholds = await broadcastMode(io, client, `connections:${path}`, path);
        const mode = thresholds.mode;
        const previousCount = participantCount - 1;
        const justCrossedThreshold = previousCount <= 2 && participantCount > 2; // P2P_THRESHOLD limit

        for (const uid of users) {
            io.to(uid).emit("user-joined", socket.id, users, usernames);
            io.to(uid).emit("set-mode", { mode, participantCount, roomPath: path });
        }

        if (justCrossedThreshold) {
            for (const uid of users) {
                io.to(uid).emit("upgrade-to-sfu", { roomPath: path, participantCount });
            }
        }

        const messages = await client.lRange(`messages:${path}`, 0, -1);
        for (const msg of messages) {
            try {
                const parsed = JSON.parse(msg);
                io.to(socket.id).emit("chat-message", parsed.data, parsed.sender, parsed["socket-id-sender"]);
            } catch (e) {
                // Ignore parse errors on bad chat data
            }
        }

        const whiteboardOpen = await client.get(`whiteboardOpen:${path}`);
        if (whiteboardOpen) {
            try {
                const parsed = JSON.parse(whiteboardOpen);
                io.to(socket.id).emit("whiteboard-open", { presenter: parsed.presenter });
            } catch { /* ignore */ }
        }
        
        const whiteboardState = await client.get(`whiteboardState:${path}`);
        if (whiteboardState) {
            try {
                const parsed = JSON.parse(whiteboardState);
                io.to(socket.id).emit("whiteboard-sync", { scene: parsed });
            } catch { /* ignore */ }
        }

        if (socket.id === currentHost) {
            await broadcastWaitlist(io, client, path);
        }
    });

    socket.on("disconnect", async () => {
        socketUsernames.delete(socket.id);

        const roomKey   = socket.data.roomKey;
        const roomPath  = socket.data.roomPath;

        if (roomPath) {
            await client.hDel(`waitlist:${roomPath}`, socket.id);
            await broadcastWaitlist(io, client, roomPath);
        }

        if (!roomKey) return; 

        await client.sRem(roomKey, socket.id);
        const remaining = await client.sMembers(roomKey);

        remaining.forEach(uid => io.to(uid).emit("user-left", socket.id));

        const hostKey = `host:${roomPath}`;
        const hostNameKey = `hostName:${roomPath}`;
        const currentHost = await client.get(hostKey);

        if (currentHost === socket.id) {
            if (remaining.length > 0) {
                setTimeout(async () => {
                    const hostAfterTimeout = await client.get(hostKey);
                    if (hostAfterTimeout === socket.id) {
                        const newRemaining = await client.sMembers(roomKey);
                        if (newRemaining.length > 0) {
                            const meetingCode = getMeetingCodeFromPath(roomPath);
                            const scheduledMeeting = meetingCode
                                ? await ScheduledMeeting.findOne({
                                    meetingCode,
                                    status: { $in: ["scheduled", "started"] },
                                }).sort({ scheduledFor: -1 })
                                : null;

                            let newHost = newRemaining[0];
                            if (scheduledMeeting) {
                                const hostSocket = newRemaining.find((id) => {
                                    const sock = io.sockets.sockets.get(id);
                                    return sock && String(sock.data.userId) === String(scheduledMeeting.hostUserId);
                                });
                                if (hostSocket) newHost = hostSocket;
                            }

                            const newHostName = socketUsernames.get(newHost);
                            await client.set(hostKey, newHost);
                            if (newHostName) await client.set(hostNameKey, newHostName);

                            io.to(newHost).emit("role-assigned", { role: 'host' });
                            await broadcastWaitlist(io, client, roomPath);
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
            await broadcastMode(io, client, roomKey, roomPath);
        } else {
            await client.del(roomKey);
            await client.del(`messages:${roomPath}`);
            await client.del(`whiteboardOpen:${roomPath}`);
            await client.del(`whiteboardState:${roomPath}`);
            await client.del(hostKey);
            await client.del(hostNameKey);
            await client.del(`mainHost:${roomPath}`);
            await client.del(`waitlist:${roomPath}`);
        }
    });
};
