import { ensureHost } from "./socketUtils.js";

export const registerHostControlHandlers = (io, socket, client) => {
    socket.on("host-mute-user", async ({ socketId }) => {
        if (!await ensureHost(socket, client)) return;
        if (socketId) io.to(socketId).emit("host-force-mute");
    });

    socket.on("host-unmute-user", async ({ socketId }) => {
        if (!await ensureHost(socket, client)) return;
        if (socketId) io.to(socketId).emit("host-force-unmute");
    });

    socket.on("host-video-off-user", async ({ socketId }) => {
        if (!await ensureHost(socket, client)) return;
        if (socketId) io.to(socketId).emit("host-force-video-off");
    });

    socket.on("host-video-on-user", async ({ socketId }) => {
        if (!await ensureHost(socket, client)) return;
        if (socketId) io.to(socketId).emit("host-force-video-on");
    });

    socket.on("host-mute-all", async () => {
        if (!await ensureHost(socket, client)) return;
        const roomKey = socket.data.roomKey;
        if (!roomKey) return;
        const users = await client.sMembers(roomKey);
        users.forEach(uid => {
            if (uid !== socket.id) io.to(uid).emit("host-force-mute");
        });
    });

    socket.on("host-video-off-all", async () => {
        if (!await ensureHost(socket, client)) return;
        const roomKey = socket.data.roomKey;
        if (!roomKey) return;
        const users = await client.sMembers(roomKey);
        users.forEach(uid => {
            if (uid !== socket.id) io.to(uid).emit("host-force-video-off");
        });
    });
};
