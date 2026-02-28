const IST_TIMEZONE = "Asia/Kolkata";

const formatMeetingTime = (date) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: IST_TIMEZONE,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(date);
  }
};

const renderFrame = ({ title, body, footer }) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 22px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #4f46e5; margin: 0;">ConvoX</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 16px; padding: 26px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0;">${title}</h2>
        ${body}
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 22px;">
        ${footer || "Sent via ConvoX"}
      </p>
    </div>
  `;
};

export const renderScheduleConfirmation = ({
  hostName,
  meetingTitle,
  meetingUrl,
  scheduledFor,
}) => {
  const timeLabel = formatMeetingTime(scheduledFor);
  const body = `
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Hi ${hostName || "there"}, your meeting has been scheduled.
    </p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 6px 0;"><strong>Title:</strong> ${meetingTitle}</p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 14px 0;"><strong>When:</strong> ${timeLabel} (IST)</p>
    <a href="${meetingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 11px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">
      Open Meeting
    </a>
    <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">Meeting link:</p>
      <p style="color: #6366f1; font-size: 13px; word-break: break-all; margin: 0; font-weight: 500;">${meetingUrl}</p>
    </div>
  `;

  return renderFrame({
    title: "Meeting scheduled",
    body,
    footer: "We will remind you 10 minutes and 5 minutes before start time.",
  });
};

export const renderScheduleInvite = ({
  hostName,
  meetingTitle,
  meetingUrl,
  scheduledFor,
}) => {
  const timeLabel = formatMeetingTime(scheduledFor);
  const body = `
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      ${hostName || "Someone"} invited you to a scheduled ConvoX meeting.
    </p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 6px 0;"><strong>Title:</strong> ${meetingTitle}</p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 10px 0;"><strong>When:</strong> ${timeLabel} (IST)</p>
    <p style="color: #64748b; font-size: 13px; margin: 0 0 14px 0;">
      If you join early, you'll wait in the waiting room until the host admits you.
    </p>
    <a href="${meetingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 11px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">
      Join Meeting
    </a>
    <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">Meeting link:</p>
      <p style="color: #6366f1; font-size: 13px; word-break: break-all; margin: 0; font-weight: 500;">${meetingUrl}</p>
    </div>
  `;

  return renderFrame({
    title: "You are invited",
    body,
    footer: "Add this to your calendar so you do not miss it.",
  });
};

export const renderFiveMinuteReminder = ({
  hostName,
  meetingTitle,
  meetingUrl,
  scheduledFor,
}) => {
  const timeLabel = formatMeetingTime(scheduledFor);
  const body = `
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Your meeting starts in 5 minutes.
    </p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 6px 0;"><strong>Title:</strong> ${meetingTitle}</p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 14px 0;"><strong>Start time:</strong> ${timeLabel} (IST)</p>
    <a href="${meetingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 11px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">
      Join Meeting
    </a>
  `;

  return renderFrame({
    title: "Meeting starts soon",
    body,
    footer: hostName ? `Scheduled by ${hostName}` : "Scheduled in ConvoX",
  });
};

export const renderTenMinuteReminder = ({
  hostName,
  meetingTitle,
  meetingUrl,
  scheduledFor,
}) => {
  const timeLabel = formatMeetingTime(scheduledFor);
  const body = `
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Your meeting starts in 10 minutes.
    </p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 6px 0;"><strong>Title:</strong> ${meetingTitle}</p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 14px 0;"><strong>Start time:</strong> ${timeLabel} (IST)</p>
    <a href="${meetingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 11px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">
      Open Meeting
    </a>
  `;

  return renderFrame({
    title: "Meeting starts soon",
    body,
    footer: hostName ? `Scheduled by ${hostName}` : "Scheduled in ConvoX",
  });
};

export const renderStartReminder = ({
  hostName,
  meetingTitle,
  meetingUrl,
}) => {
  const body = `
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
      Your meeting is starting now.
    </p>
    <p style="color: #1e293b; font-size: 14px; margin: 0 0 14px 0;"><strong>Title:</strong> ${meetingTitle}</p>
    <a href="${meetingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 11px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">
      Join Meeting
    </a>
  `;

  return renderFrame({
    title: "Meeting is starting",
    body,
    footer: hostName ? `Scheduled by ${hostName}` : "Scheduled in ConvoX",
  });
};
