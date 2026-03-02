import { ensureHost } from "./socketUtils.js";

export const registerWhiteboardHandlers = (io, socket, client, socketUsernames) => {
    socket.on("whiteboard-open", async ({ presenter }) => {
        if (!await ensureHost(socket, client)) return;
        const roomKey  = socket.data.roomKey;
        const roomPath = socket.data.roomPath;
        if (!roomKey || !roomPath) return;
        const payload = { presenter: presenter || socketUsernames.get(socket.id) || 'Host' };
        await client.set(`whiteboardOpen:${roomPath}`, JSON.stringify(payload));
        const users = await client.sMembers(roomKey);
        users.forEach(uid => io.to(uid).emit("whiteboard-open", payload));
    });

    socket.on("whiteboard-close", async () => {
        if (!await ensureHost(socket, client)) return;
        const roomKey  = socket.data.roomKey;
        const roomPath = socket.data.roomPath;
        if (!roomKey || !roomPath) return;
        await client.del(`whiteboardOpen:${roomPath}`);
        const users = await client.sMembers(roomKey);
        users.forEach(uid => io.to(uid).emit("whiteboard-close"));
    });

    socket.on("whiteboard-state", async ({ scene }) => {
        if (!await ensureHost(socket, client)) return;
        const roomKey  = socket.data.roomKey;
        const roomPath = socket.data.roomPath;
        if (!roomKey || !roomPath || !scene) return;
        await client.set(`whiteboardState:${roomPath}`, JSON.stringify(scene));
        const users = await client.sMembers(roomKey);
        users.forEach(uid => io.to(uid).emit("whiteboard-state", {
            scene,
            socketId: socket.id,
        }));
    });

    socket.on("whiteboard-request-sync", async () => {
        const roomPath = socket.data.roomPath;
        if (!roomPath) return;
        const state = await client.get(`whiteboardState:${roomPath}`);
        if (state) {
            try {
                const parsed = JSON.parse(state);
                io.to(socket.id).emit("whiteboard-sync", { scene: parsed });
            } catch { /* ignore */ }
        }
    });
};
