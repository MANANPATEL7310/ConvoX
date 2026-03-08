import sgMail from "@sendgrid/mail";

let isInitialized = false;

const initSendGrid = () => {
  if (isInitialized) return;

  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.error("[Email] FATAL: SENDGRID_API_KEY is not set in environment variables!");
    throw new Error("SENDGRID_API_KEY must be set to send emails.");
  }

  sgMail.setApiKey(apiKey);
  console.log("[Email] SendGrid client initialized.");
  isInitialized = true;
};

export const sendEmail = async ({ to, subject, html }) => {
  initSendGrid();

  const msg = {
    to, // SendGrid's 'to' field automatically accepts an array of strings for batch sending!
    from: "convox7310@gmail.com", // This MUST match the Single Sender verified email in the screenshot
    subject,
    html,
  };

  try {
    // sendMultiple sends individual emails to each recipient in the 'to' array without them seeing each other
    const response = await sgMail.sendMultiple(msg);
    console.log(`[Email] ✅ Sent successfully via SendGrid to:`, Array.isArray(to) ? to.join(", ") : to);
    return response;
  } catch (error) {
    console.error(`[Email] ❌ Failed to send via SendGrid:`, error.response?.body || error.message);
    throw new Error(error.response?.body?.errors?.[0]?.message || error.message);
  }
};
