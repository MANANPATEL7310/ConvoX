import { Server } from "socket.io";
import { createClient } from "redis";

// const client = createClient();
// client.connect().catch(console.error);

// Export client for use if needed elsewhere, though mainly internal here.
export const client = createClient();

export const startRedis = async () => {
    try {
        await client.connect();
        console.log("Redis Connected");
    } catch (e) {
        console.error("Redis Connection Error", e);
    }
};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"], 
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    // Store usernames for each socket
    const socketUsernames = new Map();

    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED", socket.id);

        socket.on("join-call", async (path, username) => {
            // Store username for this socket
            if (username) {
                socketUsernames.set(socket.id, username);
            }
            
            // Add user to Redis set
            await client.sAdd(`connections:${path}`, socket.id);
            // Store join time in a hash
            await client.hSet(`timeOnline:${socket.id}`, "joined", Date.now());

            const users = await client.sMembers(`connections:${path}`);

            // Create usernames object for all users in the room
            const usernames = {};
            for (const userId of users) {
                usernames[userId] = socketUsernames.get(userId) || `User ${userId.slice(-4)}`;
            }

            // Notify everyone in the room with usernames
            for (const user of users) {
                io.to(user).emit("user-joined", socket.id, users, usernames);
            }

            // Send chat history
            const messages = await client.lRange(`messages:${path}`, 0, -1);
            for (const msg of messages) {
                const parsed = JSON.parse(msg);
                io.to(socket.id).emit("chat-message", parsed.data, parsed.sender, parsed["socket-id-sender"]);
            }
        });

        socket.on("signal", async (toId, message) => {
            // Send signal directly to the specific target peer (1-to-1 WebRTC)
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", async (data, sender) => {
            // Find room where socket is present - In Redis this is expensive to search reverse, 
            // so efficiently we should look at which room the socket joined. 
            // For now, simpler approach: iterate keys or better, store roomId on socket object.
            
            // Optimization: Client usually sends roomId or we store it on socket. 
            // But adhering to Zoom-main "search" logic but with Redis:
            
            // Getting all rooms is expensive. 
            // Let's rely on the client sending the room or store it in socket.data
            // However, Zoom-main frontend sends `chat-message` WITHOUT room ID, so we must find it.
            
            // Searching Redis keys...
            const keys = await client.keys("connections:*");
            
            let messageSent = false;
            for(const key of keys) {
                const isMember = await client.sIsMember(key, socket.id);
                if(isMember) {
                    const roomPath = key.substring("connections:".length); // Correct extraction
                    const msgObject = { sender, data, "socket-id-sender": socket.id };
                    
                    await client.rPush(`messages:${roomPath}`, JSON.stringify(msgObject));
                    
                    const users = await client.sMembers(key);
                    console.log(`Broadcasting chat to ${users.length} users in room ${roomPath}`);
                    
                    users.forEach(user => {
                        io.to(user).emit("chat-message", data, sender, socket.id);
                    });
                    messageSent = true;
                    break; 
                }
            }
            
            if (!messageSent) {
                console.log("Socket not found in any room for chat message", socket.id);
            }
        });

        /* ── Typing indicators ── */
        const broadcastToRoom = async (eventName, payload) => {
            const keys = await client.keys("connections:*");
            for (const key of keys) {
                const isMember = await client.sIsMember(key, socket.id);
                if (isMember) {
                    const users = await client.sMembers(key);
                    users.forEach(user => {
                        if (user !== socket.id) {
                            io.to(user).emit(eventName, payload);
                        }
                    });
                    break;
                }
            }
        };

        socket.on("typing", async (username) => {
            await broadcastToRoom("user-typing", username);
        });

        socket.on("stop-typing", async (username) => {
            await broadcastToRoom("user-stop-typing", username);
        });

        /* ── Private (direct) message ── */
        socket.on("private-message", ({ toSocketId, data, sender }) => {
            // Deliver to recipient
            io.to(toSocketId).emit("private-message", { data, sender, fromSocketId: socket.id });
            // Echo back to sender so they see it in their own chat
            io.to(socket.id).emit("private-message", { data, sender, fromSocketId: socket.id, toSocketId, isMine: true });
        });

        socket.on("disconnect", async () => {
            // Remove username from map
            socketUsernames.delete(socket.id);
            
            // Find room
            const keys = await client.keys("connections:*");
            for (const key of keys) {
                const isMember = await client.sIsMember(key, socket.id);
                if (isMember) {
                    const roomPath = key.substring("connections:".length); // Fixed: use substring instead of split
                    await client.sRem(key, socket.id);
                    
                    const users = await client.sMembers(key);
                    
                    users.forEach(user => {
                        io.to(user).emit("user-left", socket.id);
                    });

                    // Cleanup if empty?
                    if (users.length === 0) {
                        await client.del(key);
                        await client.del(`messages:${roomPath}`);
                    }
                }
            }
        });
    });

    return io;
};



