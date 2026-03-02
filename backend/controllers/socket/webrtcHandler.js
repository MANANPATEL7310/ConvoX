import { broadcastToRoomExcludeSelf } from "./socketUtils.js";

export const registerWebRTCHandlers = (io, socket, client) => {
    socket.on("signal", async (toId, message) => {
        io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("media-state", async ({ audioEnabled, videoEnabled }) => {
        const roomKey = socket.data.roomKey;
        if (!roomKey) return;
        const users = await client.sMembers(roomKey);
        users.forEach(uid => io.to(uid).emit("media-state", {
            socketId: socket.id,
            audioEnabled,
            videoEnabled,
        }));
    });

    socket.on("screen-share-toggled", async ({ sharing }) => {
        await broadcastToRoomExcludeSelf(io, socket, client, "screen-share-toggled", {
            sharingSocketId: socket.id,
            sharing,
        });
    });
};
