import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import { connectToSocket, startRedis } from "./controllers/socketManager.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import livekitRoutes from "./routes/livekit.routes.js";
import inviteRoutes from "./routes/invite.routes.js";


const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000))

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Vite defaults
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use(cookieParser());

app.use("/api/v1/users", authRoutes);
app.use("/api/v1/livekit", livekitRoutes);
app.use("/api/v1/invite", inviteRoutes);

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(process.env.MONGO_URL)
        console.log("database connected successfully.");
        
        await startRedis();
        server.listen(app.get("port"), () => {
            console.log(`LISTENIN ON PORT ${app.get("port")}`)
        });
    } catch (e) {
        console.log(e);
    }
}

start();
