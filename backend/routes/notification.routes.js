import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json(notifications);
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch notifications." });
  }
});

router.post("/mark-read", verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (Array.isArray(ids) && ids.length > 0) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: req.user._id },
        { $set: { readAt: new Date() } }
      );
    } else {
      await Notification.updateMany(
        { userId: req.user._id, readAt: null },
        { $set: { readAt: new Date() } }
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Notifications mark-read error:", error);
    return res.status(500).json({ message: "Failed to update notifications." });
  }
});

export default router;
