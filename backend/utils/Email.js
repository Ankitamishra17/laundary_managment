import { Resend } from "resend";

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

/**
 * Sends a 6-digit OTP code by email.
 * Falls back to logging the code to the console when Resend is not configured
 * or the send fails, so the flow stays testable in development.
 */
async function sendOtpEmail(toEmail, name, otp) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV EMAIL] OTP for ${toEmail}: ${otp}`);
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "Your OTP code — Laundry Management System",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0F2C2E;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #028090, #02C39A); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;"></div>
        <h2 style="font-family: Georgia, serif; margin-bottom: 8px;">Hi ${name},</h2>
        <p style="font-size: 14px; color: #3A5654; line-height: 1.6;">
          Use the code below to verify your email address. It expires in 10 minutes.
        </p>
        <div style="display: inline-block; margin-top: 12px; padding: 16px 28px; background: #EEF7F6; border: 1px solid #D8ECEA; border-radius: 12px; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #028090;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #6B8482; margin-top: 24px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.log(`[DEV EMAIL] Resend failed for ${toEmail}, OTP: ${otp} — ${error.message}`);
    return null;
  }

  return data;
}

/**
 * Sends a 6-digit password-reset OTP code by email.
 * Same fallback behaviour as sendOtpEmail — logs to console when Resend is
 * not configured or the send fails, so the flow stays testable in dev.
 */
async function sendResetOtpEmail(toEmail, name, otp) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV EMAIL] Password reset OTP for ${toEmail}: ${otp}`);
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "Reset your password — Laundry Management System",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0F2C2E;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #028090, #02C39A); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;"></div>
        <h2 style="font-family: Georgia, serif; margin-bottom: 8px;">Hi ${name},</h2>
        <p style="font-size: 14px; color: #3A5654; line-height: 1.6;">
          We received a request to reset your password. Use the code below to
          verify it's you. It expires in 10 minutes.
        </p>
        <div style="display: inline-block; margin-top: 12px; padding: 16px 28px; background: #EEF7F6; border: 1px solid #D8ECEA; border-radius: 12px; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #028090;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #6B8482; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.log(`[DEV EMAIL] Resend failed for ${toEmail}, OTP: ${otp} — ${error.message}`);
    return null;
  }

  return data;
}

export { sendVerificationEmail, sendOtpEmail, sendResetOtpEmail };