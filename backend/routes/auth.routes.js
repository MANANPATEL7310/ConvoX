import { Signup, Login, addToHistory, getUserHistory, Logout, updatePresence } from "../controllers/authController.js";
import { verifyToken, userVerification } from "../middlewares/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/verify", userVerification);
router.post("/logout", Logout);
router.post("/add_history", verifyToken, addToHistory);
router.get("/get_history", verifyToken, getUserHistory);
router.post("/presence", verifyToken, updatePresence);

export default router;
