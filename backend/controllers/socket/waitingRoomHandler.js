import { ScheduledMeeting } from "../../models/ScheduledMeeting.js";
import { getMeetingCodeFromPath, broadcastWaitlist } from "./socketUtils.js";

export const registerWaitingRoomHandlers = (io, socket, client, socketUsernames) => {
    socket.on("waiting-room-join", async (path, username) => {
        socket.data.roomPath    = path;
        socket.data.roomKey     = `connections:${path}`;
        socket.data.pendingPath = path;
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

        if (!mainHostName && socket.data.username && (!scheduledMeeting || isHostUser)) {
            await client.set(mainHostKey, socket.data.username);
            mainHostName = socket.data.username;
        }

        const isCurrentHost = currentHostName === socket.data.username;
        const isMainHost    = mainHostName === socket.data.username;

        if (!forceWaitingRoom && (!currentHostSocket || isCurrentHost || isMainHost)) {
            if (currentHostSocket && isMainHost && !isCurrentHost) {
                io.to(currentHostSocket).emit("role-assigned", { role: 'participant' });
            }

            await client.set(hostKey, socket.id);
            await client.set(hostNameKey, socket.data.username);

            socket.data.pendingPath = null;
            socket.data.admitted = true;
            io.to(socket.id).emit("admitted", { asHost: true });
        } else {
            const wlKey = `waitlist:${path}`;
            await client.hSet(wlKey, socket.id, socket.data.username);

            io.to(socket.id).emit("in-waiting-room");

            const waitlistInfo = await broadcastWaitlist(io, client, path);
            const waitlist = waitlistInfo?.waitlist || [];

            const roomUsers = await client.sMembers(`connections:${path}`);
            roomUsers.forEach(uid => {
                io.to(uid).emit("waiting-room-notification", {
                    username: socket.data.username,
                    count:    waitlist.length,
                });
            });
        }
    });

    socket.on("admit-user", async ({ socketId }) => {
        const path   = socket.data.roomPath;
        const hostKey = `host:${path}`;
        const hostId  = await client.get(hostKey);

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

        await client.hDel(`waitlist:${path}`, socketId);

        const admittedSocket = io.sockets.sockets.get(socketId);
        if (admittedSocket) {
            admittedSocket.data.pendingPath = null;
            admittedSocket.data.admitted = true;
        }
        io.to(socketId).emit("admitted", { asHost: false });

        await broadcastWaitlist(io, client, path);
    });

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

        await client.hDel(`waitlist:${path}`, socketId);
        io.to(socketId).emit("rejected");
        await broadcastWaitlist(io, client, path);
    });
};
