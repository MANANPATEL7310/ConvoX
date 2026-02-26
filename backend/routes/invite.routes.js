import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

/**
 * POST /api/v1/invite/send
 * Body: { meetingUrl: string, emails: string[], senderName: string }
 *
 * Sends a meeting invite email to each recipient with a pre-drafted
 * message containing the meeting link.
 */
router.post("/send", async (req, res) => {
  const { meetingUrl, emails, senderName } = req.body;

  if (!meetingUrl || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "meetingUrl and emails[] are required." });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = emails.filter(e => emailRegex.test(e.trim()));

  if (validEmails.length === 0) {
    return res.status(400).json({ error: "No valid email addresses provided." });
  }

  // Create SMTP transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const sender = senderName || "Someone";
  const results = [];

  for (const email of validEmails) {
    const trimmed = email.trim();
    try {
      await transporter.sendMail({
        from: `"ConvoX" <${process.env.SMTP_EMAIL}>`,
        to: trimmed,
        subject: `${sender} invited you to a ConvoX meeting`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">ConvoX</h1>
            </div>

            <div style="background: #f8fafc; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0;">
              <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">You're invited! 🎥</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${sender}</strong> has invited you to join a video meeting on ConvoX. Click the button below to join instantly — no signup required.
              </p>

              <a href="${meetingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">
                Join Meeting
              </a>

              <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">Or copy this link:</p>
                <p style="color: #6366f1; font-size: 13px; word-break: break-all; margin: 0; font-weight: 500;">${meetingUrl}</p>
              </div>
            </div>

            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
              Sent via ConvoX — Crystal-clear video meetings
            </p>
          </div>
        `,
      });

      results.push({ email: trimmed, status: "sent" });
    } catch (err) {
      console.error(`Failed to send to ${trimmed}:`, err.message);
      results.push({ email: trimmed, status: "failed", error: err.message });
    }
  }

  const sent = results.filter(r => r.status === "sent").length;
  const failed = results.filter(r => r.status === "failed").length;

  return res.json({
    message: `${sent} sent, ${failed} failed`,
    results,
  });
});

export default router;
