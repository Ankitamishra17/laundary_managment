import cron from "node-cron";

import { checkSubscriptionExpiryNotifications } from "../services/subscriptionNotification.service.js";

export const startSubscriptionExpiryJob = () => {
  // Every day at 9:00 AM IST
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("Running subscription expiry notification job...");

      try {
        await checkSubscriptionExpiryNotifications();

        console.log("Subscription expiry notification job completed.");
      } catch (error) {
        console.error("Subscription expiry notification job failed:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log(
    "Subscription expiry notification job scheduled for 9:00 AM IST.",
  );
};
