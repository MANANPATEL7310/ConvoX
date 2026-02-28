import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { ScheduledMeeting } from "../models/ScheduledMeeting.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "../utils/mailer.js";
import {
  renderScheduleConfirmation,
  renderScheduleInvite,
} from "../utils/scheduleTemplates.js";

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => value?.trim().toLowerCase();

router.post("/", verifyToken, async (req, res) => {
  try {
  const {
      title,
      meetingCode,
      meetingUrl,
      scheduledFor,
      hostEmail,
      attendees,
    } = req.body;

    if (!meetingCode || !meetingUrl) {
      return res.status(400).json({ message: "Meeting code and URL are required." });
    }

    const parsedDate = new Date(scheduledFor);
    if (!scheduledFor || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Valid scheduled time is required." });
    }

    if (parsedDate <= new Date()) {
      return res.status(400).json({ message: "Scheduled time must be in the future." });
    }

    const hostEmailNormalized = normalizeEmail(hostEmail);
    if (!hostEmailNormalized || !emailRegex.test(hostEmailNormalized)) {
      return res.status(400).json({ message: "A valid host email is required." });
    }

    const attendeeList = Array.isArray(attendees)
      ? attendees
          .map(normalizeEmail)
          .filter((email) => emailRegex.test(email || ""))
          .filter((email) => email !== hostEmailNormalized)
      : [];

    const meetingTitle = title?.trim() || "Scheduled Meeting";

    let parsedUrl;
    try {
      parsedUrl = new URL(meetingUrl);
    } catch {
      return res.status(400).json({ message: "Meeting URL is invalid." });
    }

    const urlCode = parsedUrl.pathname.split("/").filter(Boolean).pop();
    if (urlCode !== meetingCode.trim()) {
      return res.status(400).json({ message: "Meeting code does not match the URL." });
    }

    const existing = await ScheduledMeeting.findOne({
      meetingCode: meetingCode.trim(),
      status: "scheduled",
      scheduledFor: { $gt: new Date() },
    });

    if (existing) {
      return res.status(409).json({ message: "This meeting code is already scheduled. Please generate a new one." });
    }

    const meeting = await ScheduledMeeting.create({
      hostUserId: req.user._id,
      hostName: req.user.username || req.user.name || "Host",
      hostEmail: hostEmailNormalized,
      title: meetingTitle,
      meetingCode: meetingCode.trim(),
      meetingUrl: meetingUrl.trim(),
      scheduledFor: parsedDate,
      timezone: "Asia/Kolkata",
      attendees: attendeeList,
    });

    await Notification.create({
      userId: req.user._id,
      meetingId: meeting._id,
      meetingCode: meeting.meetingCode,
      meetingTitle: meeting.title,
      scheduledFor: meeting.scheduledFor,
      type: "meeting-scheduled",
      message: `Meeting \"${meetingTitle}\" scheduled successfully.`,
    });

    const confirmationHtml = renderScheduleConfirmation({
      hostName: meeting.hostName,
      meetingTitle: meetingTitle,
      meetingUrl: meeting.meetingUrl,
      scheduledFor: meeting.scheduledFor,
    });

    await sendEmail({
      to: hostEmailNormalized,
      subject: `Meeting scheduled: ${meetingTitle}`,
      html: confirmationHtml,
    });

    const attendeeEmails = attendeeList.filter((email) => email !== hostEmailNormalized);
    if (attendeeEmails.length > 0) {
      const inviteHtml = renderScheduleInvite({
        hostName: meeting.hostName,
        meetingTitle: meetingTitle,
        meetingUrl: meeting.meetingUrl,
        scheduledFor: meeting.scheduledFor,
      });

      for (const attendeeEmail of attendeeEmails) {
        await sendEmail({
          to: attendeeEmail,
          subject: `Invitation: ${meetingTitle}`,
          html: inviteHtml,
        });
      }
    }

    return res.status(201).json({ meeting });
  } catch (error) {
    console.error("Schedule create error:", error);
    return res.status(500).json({ message: "Failed to schedule meeting." });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const meetings = await ScheduledMeeting.find({ hostUserId: req.user._id })
      .sort({ scheduledFor: 1 })
      .lean();

    return res.json(meetings);
  } catch (error) {
    console.error("Schedule list error:", error);
    return res.status(500).json({ message: "Failed to fetch scheduled meetings." });
  }
});

export default router;
