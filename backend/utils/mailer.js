import { Resend } from "resend";

let resendClient = null;

const getResend = () => {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("[Email] FATAL: RESEND_API_KEY is not set in environment variables!");
    throw new Error("RESEND_API_KEY must be set to send emails.");
  }

  console.log("[Email] Resend client initialized.");
  resendClient = new Resend(apiKey);
  return resendClient;
};

export const sendEmail = async ({ to, subject, html }) => {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: "ConvoX <onboarding@resend.dev>", // Use your verified domain once set up
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[Email] ❌ Failed to send to ${to}:`, error.message);
    throw new Error(error.message);
  }

  console.log(`[Email] ✅ Sent to ${to} | MessageId: ${data.id}`);
  return data;
};
