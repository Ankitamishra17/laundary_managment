/**
 * Sends a 6-digit OTP code by SMS.
 *
 * Provider: Telnyx (https://developers.telnyx.com/) — set TELNYX_API_KEY and
 * TELNYX_FROM_NUMBER in the backend .env to enable real delivery.
 *
 * When Telnyx isn't configured, the code is logged to the server console so
 * the verification flow still works during development.
 */
export async function sendOtpSms(phone, otp) {
  if (process.env.TELNYX_API_KEY && process.env.TELNYX_FROM_NUMBER) {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.TELNYX_FROM_NUMBER,
        to: phone,
        text: `Your Laundry Management System verification code is ${otp}. It expires in 10 minutes.`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SMS send failed (${res.status}): ${body}`);
    }

    return { provider: "telnyx" };
  }

  console.log(`[DEV SMS] OTP for ${phone}: ${otp}`);
  return { provider: "console" };
}
