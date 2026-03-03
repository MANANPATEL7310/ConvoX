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
import googleAuthRoutes from "./routes/google.auth.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import { startScheduleWorker } from "./utils/scheduleWorker.js";
import notificationRoutes from "./routes/notification.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000))

const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(",") 
    : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use(cookieParser());

// Security HTTP headers
app.use(helmet());

// Compress response bodies for performance
app.use(compression());

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Limit each IP to 2000 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { success: false, message: "Too many requests from this IP, please try again in 15 minutes." }
});

// Apply rate limiter to all API routes
app.use("/api", apiLimiter);

app.use("/api/v1/users", authRoutes);
app.use("/api/v1/livekit", livekitRoutes);
app.use("/api/v1/invite", inviteRoutes);
app.use("/api/v1/auth", googleAuthRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/feedback", feedbackRoutes);

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(process.env.MONGO_URL)
        console.log("database connected successfully.");
        
        await startRedis();
        startScheduleWorker();
        server.listen(app.get("port"), () => {
            console.log(`LISTENIN ON PORT ${app.get("port")}`)
        });
    } catch (e) {
        console.log(e);
    }
}

start();
