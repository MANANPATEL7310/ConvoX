import { broadcastToRoomExcludeSelf } from "./socketUtils.js";

export const registerInteractionHandlers = (io, socket, client, socketUsernames) => {
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

    socket.on("file-share", async ({ file }) => {
        const roomKey = socket.data.roomKey;
        if (!roomKey || !file?.data) return;
        
        const sender = socketUsernames.get(socket.id) || socket.data.username || `User ${socket.id.slice(-4)}`;
        const users = await client.sMembers(roomKey);
        
        users.forEach(uid => {
            io.to(uid).emit("file-share", {
                sender: sender,
                socketId: socket.id,
                file: {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: file.data,
                },
            });
        });
    });

    socket.on("typing",      async (u) => broadcastToRoomExcludeSelf(io, socket, client, "user-typing", u));
    socket.on("stop-typing", async (u) => broadcastToRoomExcludeSelf(io, socket, client, "user-stop-typing", u));

    socket.on("reaction", async ({ emoji }) => {
        const roomKey = socket.data.roomKey;
        if (!roomKey || !emoji) return;
        const users = await client.sMembers(roomKey);
        users.forEach(uid => io.to(uid).emit("reaction", {
            socketId: socket.id,
            emoji,
        }));
    });

    socket.on("raise-hand", async ({ raised }) => {
        const roomKey = socket.data.roomKey;
        if (!roomKey) return;
        const username = socketUsernames.get(socket.id) || socket.data.username || `User ${socket.id.slice(-4)}`;
        const users = await client.sMembers(roomKey);
        users.forEach(uid => io.to(uid).emit("raise-hand", {
            socketId: socket.id,
            username,
            raised: !!raised,
        }));
    });

    socket.on("caption", async ({ id, text, ts, speaker }) => {
        const roomKey = socket.data.roomKey;
        if (!roomKey || !text) return;
        const username = speaker || socketUsernames.get(socket.id) || socket.data.username || `User ${socket.id.slice(-4)}`;
        const users = await client.sMembers(roomKey);
        users.forEach(uid => io.to(uid).emit("caption", {
            id,
            text,
            ts: ts || Date.now(),
            speaker: username,
            socketId: socket.id,
        }));
    });

    socket.on("private-message", ({ toSocketId, data, sender }) => {
        io.to(toSocketId).emit("private-message", { data, sender, fromSocketId: socket.id });
        io.to(socket.id).emit("private-message",  { data, sender, fromSocketId: socket.id, toSocketId, isMine: true });
    });
};
