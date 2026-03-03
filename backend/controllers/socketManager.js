import { Server } from "socket.io";
import { createClient } from "redis";
import { attachUserFromSocket } from "./socket/socketUtils.js";
import { registerWaitingRoomHandlers } from "./socket/waitingRoomHandler.js";
import { registerRoomHandlers } from "./socket/roomHandler.js";
import { registerHostControlHandlers } from "./socket/hostControlHandler.js";
import { registerInteractionHandlers } from "./socket/interactionHandler.js";
import { registerWhiteboardHandlers } from "./socket/whiteboardHandler.js";
import { registerWebRTCHandlers } from "./socket/webrtcHandler.js";

export const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export const startRedis = async () => {
    try {
        await client.connect();
        console.log("Redis Connected");
    } catch (e) {
        console.error("Redis Connection Error", e);
    }
};

export const connectToSocket = (server) => {
    const allowedOrigins = process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.split(",") 
        : ["http://localhost:5173", "http://localhost:5174"];

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        },
        maxHttpBufferSize: 1e7 // 10MB
    });

    // Map: socketId → username
    const socketUsernames = new Map();

    io.on("connection", (socket) => {
        attachUserFromSocket(socket);
        console.log("SOMETHING CONNECTED", socket.id);

        registerWaitingRoomHandlers(io, socket, client, socketUsernames);
        registerRoomHandlers(io, socket, client, socketUsernames);
        registerHostControlHandlers(io, socket, client);
        registerInteractionHandlers(io, socket, client, socketUsernames);
        registerWhiteboardHandlers(io, socket, client, socketUsernames);
        registerWebRTCHandlers(io, socket, client);
    });

    return io;
};
