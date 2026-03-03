import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.error("[Email] FATAL: SMTP_EMAIL or SMTP_PASSWORD is not set in environment variables!");
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD must be set to send emails.");
  }

  console.log(`[Email] Transporter initialized for: ${user}`);

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,       // STARTTLS (not SSL port 465 which Render blocks over IPv6)
    family: 4,           // Force IPv4 — Render free tier blocks IPv6 outbound
    auth: { user, pass },
  });

  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"ConvoX" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
  console.log(`[Email] ✅ Sent to ${to} | MessageId: ${info.messageId}`);
  return info;
};
