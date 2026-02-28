import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD must be set to send emails.");
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: `"ConvoX" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
};
