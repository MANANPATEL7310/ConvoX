import { Router } from "express";
import { Feedback } from "../models/Feedback.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { User } from "../models/User.js";

const router = Router();

// POST /api/v1/feedback (Requires Auth)
// Let an authenticated user submit feedback
router.post("/", verifyToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user._id; // Provided by authMiddleware

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "A valid rating between 1 and 5 is required." });
        }

        const newFeedback = await Feedback.create({
            userId,
            rating,
            comment: comment ? String(comment).trim() : ""
        });

        res.status(201).json({ success: true, feedback: newFeedback });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// GET /api/v1/feedback/public
// Fetch the highest-rated feedback (up to 3) for the landing page
router.get("/public", async (req, res) => {
    try {
        // Find top 3 feedbacks that have 4 or 5 stars and include a comment
        const feedbacks = await Feedback.find({ rating: { $gte: 4 }, comment: { $ne: "" } })
            .sort({ createdAt: -1 }) // Newest high-ratings first
            .limit(3)
            .populate("userId", "name avatar"); // Pull name and avatar from User model

        // Map to a clean object for the frontend
        const formattedFeedbacks = feedbacks.map((f) => {
            const user = f.userId || {};
            return {
                id: f._id,
                name: user.name || "Anonymous User",
                avatar: user.avatar || "",
                rating: f.rating,
                comment: f.comment,
                date: f.createdAt
            };
        });

        res.status(200).json({ success: true, feedbacks: formattedFeedbacks });
    } catch (error) {
        console.error("Error fetching public feedback:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;
