import jwt from "jsonwebtoken";

export const P2P_THRESHOLD = 2;

export const parseCookies = (cookieHeader = "") => {
    return cookieHeader.split(";").reduce((acc, part) => {
        const [key, ...rest] = part.trim().split("=");
        if (!key) return acc;
        acc[key] = decodeURIComponent(rest.join("="));
        return acc;
    }, {});
};

export const attachUserFromSocket = (socket) => {
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

export const getMeetingCodeFromPath = (path) => {
    if (!path) return null;
    try {
        const url = new URL(path);
        return url.pathname.split("/").filter(Boolean).pop() || null;
    } catch {
        const cleaned = path.split("?")[0];
        return cleaned.split("/").filter(Boolean).pop() || null;
    }
};

export async function broadcastMode(io, client, roomKey, roomPath) {
    const users = await client.sMembers(roomKey);
    const count  = users.length;
    const mode   = count <= P2P_THRESHOLD ? 'p2p' : 'sfu';
    for (const uid of users) {
        io.to(uid).emit("set-mode", { mode, participantCount: count, roomPath });
    }
    return { users, count, mode };
}

export async function broadcastWaitlist(io, client, path) {
    const hostKey  = `host:${path}`;
    const hostId   = await client.get(hostKey);
    if (!hostId) return;

    const raw      = await client.hGetAll(`waitlist:${path}`);
    const waitlist = Object.entries(raw).map(([socketId, username]) => ({ socketId, username }));
    io.to(hostId).emit("waiting-room-update", { waitlist });
    return { hostId, waitlist };
}

export const ensureHost = async (socket, client) => {
    const path = socket.data.roomPath;
    if (!path) return false;
    const hostKey = `host:${path}`;
    const hostId = await client.get(hostKey);
    return hostId === socket.id;
};

export const broadcastToRoomExcludeSelf = async (io, socket, client, eventName, payload) => {
    const roomKey = socket.data.roomKey;
    if (!roomKey) return;
    const users = await client.sMembers(roomKey);
    users.forEach(uid => {
        if (uid !== socket.id) io.to(uid).emit(eventName, payload);
    });
};
