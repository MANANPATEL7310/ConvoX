import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { ScheduledMeeting } from "../models/ScheduledMeeting.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "../utils/mailer.js";
import {
  renderScheduleConfirmation,
  renderScheduleInvite,
  renderScheduleUpdatedHost,
  renderScheduleUpdatedInvite,
  renderScheduleCancelledHost,
  renderScheduleCancelledInvite,
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

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, scheduledFor, hostEmail, attendees } = req.body;

    const meeting = await ScheduledMeeting.findOne({ _id: id, hostUserId: req.user._id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    if (meeting.status !== "scheduled") {
      return res.status(400).json({ message: "Only scheduled meetings can be edited." });
    }

    let parsedDate = meeting.scheduledFor;
    if (scheduledFor) {
      parsedDate = new Date(scheduledFor);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Valid scheduled time is required." });
      }
      if (parsedDate <= new Date()) {
        return res.status(400).json({ message: "Scheduled time must be in the future." });
      }
    }

    if (hostEmail) {
      const hostEmailNormalized = normalizeEmail(hostEmail);
      if (!hostEmailNormalized || !emailRegex.test(hostEmailNormalized)) {
        return res.status(400).json({ message: "A valid host email is required." });
      }
      meeting.hostEmail = hostEmailNormalized;
    }

    if (Array.isArray(attendees)) {
      const attendeeList = attendees
        .map(normalizeEmail)
        .filter((email) => emailRegex.test(email || ""))
        .filter((email) => email !== meeting.hostEmail);
      meeting.attendees = attendeeList;
    }

    if (title !== undefined) {
      meeting.title = title.trim() || "Scheduled Meeting";
    }

    const scheduleChanged = meeting.scheduledFor.getTime() !== parsedDate.getTime();
    meeting.scheduledFor = parsedDate;

    if (scheduleChanged) {
      meeting.reminder10Sent = false;
      meeting.reminder5Sent = false;
      meeting.startSent = false;
      meeting.status = "scheduled";
    }

    await meeting.save();

    await Notification.create({
      userId: req.user._id,
      meetingId: meeting._id,
      meetingCode: meeting.meetingCode,
      meetingTitle: meeting.title,
      scheduledFor: meeting.scheduledFor,
      type: "meeting-updated",
      message: `Meeting \"${meeting.title}\" was updated.`,
    });

    const hostUpdateHtml = renderScheduleUpdatedHost({
      hostName: meeting.hostName,
      meetingTitle: meeting.title,
      meetingUrl: meeting.meetingUrl,
      scheduledFor: meeting.scheduledFor,
    });

    await sendEmail({
      to: meeting.hostEmail,
      subject: `Updated: ${meeting.title}`,
      html: hostUpdateHtml,
    });

    if (meeting.attendees?.length > 0) {
      const attendeeUpdateHtml = renderScheduleUpdatedInvite({
        hostName: meeting.hostName,
        meetingTitle: meeting.title,
        meetingUrl: meeting.meetingUrl,
        scheduledFor: meeting.scheduledFor,
      });

      for (const attendeeEmail of meeting.attendees) {
        await sendEmail({
          to: attendeeEmail,
          subject: `Updated invite: ${meeting.title}`,
          html: attendeeUpdateHtml,
        });
      }
    }

    return res.json({ meeting });
  } catch (error) {
    console.error("Schedule update error:", error);
    return res.status(500).json({ message: "Failed to update meeting." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reasonRaw = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    const cancelReason = reasonRaw.length > 280 ? reasonRaw.slice(0, 280) : reasonRaw;
    const meeting = await ScheduledMeeting.findOne({ _id: id, hostUserId: req.user._id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    if (meeting.status === "cancelled") {
      return res.json({ meeting });
    }

    meeting.status = "cancelled";
    meeting.cancelReason = cancelReason;
    meeting.cancelledAt = new Date();
    await meeting.save();

    await Notification.create({
      userId: req.user._id,
      meetingId: meeting._id,
      meetingCode: meeting.meetingCode,
      meetingTitle: meeting.title,
      scheduledFor: meeting.scheduledFor,
      type: "meeting-cancelled",
      message: cancelReason
        ? `Meeting \"${meeting.title}\" was cancelled. Reason: ${cancelReason}`
        : `Meeting \"${meeting.title}\" was cancelled.`,
    });

    const hostCancelHtml = renderScheduleCancelledHost({
      hostName: meeting.hostName,
      meetingTitle: meeting.title,
      scheduledFor: meeting.scheduledFor,
      reason: cancelReason,
    });

    await sendEmail({
      to: meeting.hostEmail,
      subject: `Cancelled: ${meeting.title}`,
      html: hostCancelHtml,
    });

    if (meeting.attendees?.length > 0) {
      const attendeeCancelHtml = renderScheduleCancelledInvite({
        hostName: meeting.hostName,
        meetingTitle: meeting.title,
        scheduledFor: meeting.scheduledFor,
        reason: cancelReason,
      });

      for (const attendeeEmail of meeting.attendees) {
        await sendEmail({
          to: attendeeEmail,
          subject: `Cancelled: ${meeting.title}`,
          html: attendeeCancelHtml,
        });
      }
    }

    return res.json({ meeting });
  } catch (error) {
    console.error("Schedule cancel error:", error);
    return res.status(500).json({ message: "Failed to cancel meeting." });
  }
});

export default router;
