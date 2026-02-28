import { ScheduledMeeting } from "../models/ScheduledMeeting.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "./mailer.js";
import {
  renderFiveMinuteReminder,
  renderTenMinuteReminder,
  renderStartReminder,
} from "./scheduleTemplates.js";

const CHECK_EVERY_MS = 60 * 1000;
let intervalId = null;
let isRunning = false;
const ONLINE_GRACE_MS = 2 * 60 * 1000;

const getRecipientLists = (meeting) => {
  const hostEmail = meeting.hostEmail?.trim().toLowerCase();
  const attendeeEmails = Array.isArray(meeting.attendees) ? meeting.attendees : [];
  const uniqueAttendees = attendeeEmails
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email && email !== hostEmail);

  return {
    hostEmail,
    attendeeEmails: Array.from(new Set(uniqueAttendees)),
  };
};

const sendToHostOnly = async ({ meeting, subject, html }) => {
  const hostEmail = meeting.hostEmail?.trim().toLowerCase();
  if (!hostEmail) return;
  await sendEmail({ to: hostEmail, subject, html });
};

const sendToAttendees = async ({ meeting, subject, html }) => {
  const { attendeeEmails } = getRecipientLists(meeting);
  for (const recipient of attendeeEmails) {
    await sendEmail({ to: recipient, subject, html });
  }
};

const isUserOnline = async (userId) => {
  if (!userId) return false;
  const user = await User.findById(userId).select("lastActiveAt").lean();
  if (!user?.lastActiveAt) return false;
  return Date.now() - new Date(user.lastActiveAt).getTime() <= ONLINE_GRACE_MS;
};

const notifyUser = async ({ userId, meeting, type, message }) => {
  if (!userId) return;
  await Notification.create({
    userId,
    meetingId: meeting._id,
    meetingCode: meeting.meetingCode,
    meetingTitle: meeting.title,
    scheduledFor: meeting.scheduledFor,
    type,
    message,
  });
};

const notifyParticipantsInApp = async (meeting, message, type = "meeting-started") => {
  if (!Array.isArray(meeting.attendees) || meeting.attendees.length === 0) return;
  const emails = meeting.attendees.map((email) => email.trim().toLowerCase());
  const users = await User.find({ email: { $in: emails } }).select("_id email").lean();
  const userIds = users.map((u) => u._id);
  for (const userId of userIds) {
    await notifyUser({
      userId,
      meeting,
      type,
      message,
    });
  }
};

const runScheduleTick = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const inFiveMinutes = new Date(now.getTime() + 5 * 60 * 1000);

    const tenMinuteMeetings = await ScheduledMeeting.find({
      status: "scheduled",
      reminder10Sent: false,
      scheduledFor: { $lte: new Date(now.getTime() + 10 * 60 * 1000), $gt: now },
    }).limit(200);

    for (const meeting of tenMinuteMeetings) {
      try {
        await notifyUser({
          userId: meeting.hostUserId,
          meeting,
          type: "host-reminder-10",
          message: `Your meeting \"${meeting.title}\" starts in 10 minutes.`,
        });

        const hostOnline = await isUserOnline(meeting.hostUserId);
        if (!hostOnline) {
          const html = renderTenMinuteReminder({
            hostName: meeting.hostName,
            meetingTitle: meeting.title,
            meetingUrl: meeting.meetingUrl,
            scheduledFor: meeting.scheduledFor,
          });

          await sendToHostOnly({
            meeting,
            subject: `Reminder: ${meeting.title} starts in 10 minutes`,
            html,
          });
        }

        meeting.reminder10Sent = true;
        await meeting.save();
      } catch (error) {
        console.error(`Failed 10-minute reminder for meeting ${meeting._id}:`, error);
      }
    }

    const fiveMinuteMeetings = await ScheduledMeeting.find({
      status: "scheduled",
      reminder5Sent: false,
      scheduledFor: { $lte: inFiveMinutes, $gt: now },
    }).limit(200);

    for (const meeting of fiveMinuteMeetings) {
      try {
        const html = renderFiveMinuteReminder({
          hostName: meeting.hostName,
          meetingTitle: meeting.title,
          meetingUrl: meeting.meetingUrl,
          scheduledFor: meeting.scheduledFor,
        });

        await sendToHostOnly({
          meeting,
          subject: `Reminder: ${meeting.title} starts in 5 minutes`,
          html,
        });

        await sendToAttendees({
          meeting,
          subject: `Reminder: ${meeting.title} starts in 5 minutes`,
          html,
        });

        meeting.reminder5Sent = true;
        await meeting.save();
      } catch (error) {
        console.error(`Failed 5-minute reminder for meeting ${meeting._id}:`, error);
      }
    }

    const startingMeetings = await ScheduledMeeting.find({
      status: "scheduled",
      startSent: false,
      scheduledFor: { $lte: now },
    }).limit(200);

    for (const meeting of startingMeetings) {
      try {
        await notifyUser({
          userId: meeting.hostUserId,
          meeting,
          type: "host-start",
          message: `Your meeting \"${meeting.title}\" is starting now.`,
        });

        await notifyParticipantsInApp(
          meeting,
          `Meeting \"${meeting.title}\" is starting now.`,
          "meeting-started"
        );

        const hostOnline = await isUserOnline(meeting.hostUserId);
        if (!hostOnline) {
          const html = renderStartReminder({
            hostName: meeting.hostName,
            meetingTitle: meeting.title,
            meetingUrl: meeting.meetingUrl,
          });

          await sendToHostOnly({
            meeting,
            subject: `Starting now: ${meeting.title}`,
            html,
          });
        }

        meeting.startSent = true;
        meeting.status = "started";
        await meeting.save();
      } catch (error) {
        console.error(`Failed start reminder for meeting ${meeting._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Schedule worker error:", error);
  } finally {
    isRunning = false;
  }
};

export const startScheduleWorker = () => {
  if (intervalId) return;
  intervalId = setInterval(runScheduleTick, CHECK_EVERY_MS);
  runScheduleTick();
};
