import { sendEmail } from "./nodemailerEmail.js";

export const sendSubscriptionRenewalEmail = async ({
  to,
  adminName,
  shopName,
  plan,
  amount,
  startDate,
  endDate,
}) => {
  await sendEmail({
    to,
    subject: "Your Shop Subscription Renewed Successfully",
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
        color: #333;
      ">

        <h2 style="color: #028090;">
          Subscription Renewed Successfully
        </h2>

        <p>
          Hello ${adminName || "Shop Admin"},
        </p>

        <p>
          Your shop subscription has been renewed successfully.
        </p>

        <div style="
          background: #f4f9f9;
          padding: 18px;
          border-radius: 8px;
          margin: 20px 0;
        ">

          <p>
            <strong>Shop:</strong> ${shopName}
          </p>

          <p>
            <strong>Plan:</strong> ${plan}
          </p>

          <p>
            <strong>Amount:</strong> ₹${amount}
          </p>

          <p>
            <strong>Start Date:</strong>
            ${new Date(startDate).toLocaleDateString("en-IN")}
          </p>

          <p>
            <strong>End Date:</strong>
            ${new Date(endDate).toLocaleDateString("en-IN")}
          </p>

          <p>
            <strong>Status:</strong> Active
          </p>

        </div>

        <p>
          Your subscription is now active.
        </p>

        <p>
          Thank you for using Laundry Management System.
        </p>

      </div>
    `,
  });
};