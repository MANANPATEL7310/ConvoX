import { Signup, Login, addToHistory, getUserHistory, deleteHistoryMeeting, Logout, updatePresence, getProfile, updateProfile, updatePassword } from "../controllers/authController.js";
import { verifyToken, userVerification } from "../middlewares/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/verify", userVerification);
router.post("/logout", Logout);
router.post("/add_history", verifyToken, addToHistory);
router.get("/get_history", verifyToken, getUserHistory);
router.delete("/history/:meetingId", verifyToken, deleteHistoryMeeting);
router.post("/presence", verifyToken, updatePresence);

router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/password", verifyToken, updatePassword);

export default router;
