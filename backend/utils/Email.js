const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a verification email with a clickable link.
 * `token` should already be a signed JWT (see auth logic below).
 */
async function sendVerificationEmail(toEmail, name, token) {
  const verifyLink = `${process.env.CLIENT_VERIFY_URL}?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "Verify your email — Laundry Management System",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0F2C2E;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #028090, #02C39A); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;"></div>
        <h2 style="font-family: Georgia, serif; margin-bottom: 8px;">Hi ${name},</h2>
        <p style="font-size: 14px; color: #3A5654; line-height: 1.6;">
          Please confirm your email address to activate your staff account on the Laundry Management System.
        </p>
        <a href="${verifyLink}"
           style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #028090, #00A896); color: white; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
          Verify Email Address
        </a>
        <p style="font-size: 12px; color: #6B8482; margin-top: 24px;">
          This link expires in 24 hours. If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  return data;
}

module.exports = { sendVerificationEmail };