import { Op } from "sequelize";

import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "./nodemailerEmail.js";


// =====================================================
// GET TODAY - DATE ONLY
// =====================================================

const getToday = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
};


// =====================================================
// CALCULATE DAYS REMAINING
// =====================================================

const getDaysRemaining = (endDate) => {
  const today = getToday();

  const expiryDate = new Date(`${endDate}T00:00:00`);

  const difference =
    expiryDate.getTime() - today.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );
};


// =====================================================
// MAIN CHECKER
// =====================================================

export const checkSubscriptionExpiry = async () => {
  try {
    console.log("====================================");
    console.log("Checking subscription expiry...");
    console.log("====================================");

    const subscriptions = await Subscription.findAll({
      where: {
        status: "Active",
      },
    });

    for (const subscription of subscriptions) {

      const daysRemaining = getDaysRemaining(
        subscription.endDate
      );

      console.log(
        `Subscription ${subscription.id} | Shop ${subscription.shopId} | ${daysRemaining} days remaining`
      );


      // =================================================
      // 1. SUBSCRIPTION ALREADY EXPIRED
      // =================================================

      if (daysRemaining < 0) {

        // Change subscription status
        await subscription.update({
          status: "Expired",
        });


        // Resolve old expiry notifications
        await Notification.update(
          {
            isResolved: true,
            resolvedAt: new Date(),
          },
          {
            where: {
              subscriptionId: subscription.id,

              type: {
                [Op.in]: [
                  "SUBSCRIPTION_EXPIRING",
                  "SUBSCRIPTION_EXPIRES_TODAY",
                ],
              },

              isResolved: false,
            },
          }
        );


        console.log(
          `❌ Subscription ${subscription.id} expired. Notification resolved.`
        );

        continue;
      }


      // =================================================
      // 2. 3 DAYS / 2 DAYS / 1 DAY
      // =================================================

      if ([3, 2, 1].includes(daysRemaining)) {

        const existingNotification =
          await Notification.findOne({
            where: {
              subscriptionId: subscription.id,

              type: "SUBSCRIPTION_EXPIRING",

              isResolved: false,

              createdAt: {
                [Op.gte]: getToday(),
              },
            },
          });


        // Don't create duplicate notification
        if (!existingNotification) {

          await Notification.create({
            shopId: subscription.shopId,

            userId: null,

            subscriptionId: subscription.id,

            inventoryItemId: null,

            type: "SUBSCRIPTION_EXPIRING",

            title: "Subscription Expiry Warning",

            message:
              daysRemaining === 1
                ? `Shop ID ${subscription.shopId}'s subscription expires tomorrow.`
                : `Shop ID ${subscription.shopId}'s subscription expires in ${daysRemaining} days.`,

            isRead: false,

            isResolved: false,

            resolvedAt: null,
          });


          console.log(
            `🔔 Notification created for subscription ${subscription.id}`
          );
        }

        continue;
      }


      // =================================================
      // 3. TODAY = EXPIRY DAY
      // =================================================

      if (daysRemaining === 0) {

        const existingNotification =
          await Notification.findOne({
            where: {
              subscriptionId: subscription.id,

              type: "SUBSCRIPTION_EXPIRES_TODAY",

              isResolved: false,
            },
          });


        // Create today's notification
        if (!existingNotification) {

          await Notification.create({
            shopId: subscription.shopId,

            userId: null,

            subscriptionId: subscription.id,

            inventoryItemId: null,

            type: "SUBSCRIPTION_EXPIRES_TODAY",

            title: "Subscription Expires Today",

            message:
              `Shop ID ${subscription.shopId}'s subscription expires today.`,

            isRead: false,

            isResolved: false,

            resolvedAt: null,
          });


          console.log(
            `🔴 Subscription expiry notification created`
          );
        }


        // =============================================
        // SEND EMAIL
        // =============================================

        await sendExpiryEmail(subscription);
      }
    }

    console.log(
      "Subscription expiry check completed."
    );

  } catch (error) {

    console.error(
      "Subscription expiry checker error:",
      error
    );
  }
};


// =====================================================
// SEND EMAIL ON EXPIRY DAY
// =====================================================

const sendExpiryEmail = async (subscription) => {

  try {

    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL;


    if (!superAdminEmail) {

      console.error(
        "SUPER_ADMIN_EMAIL is not configured."
      );

      return;
    }


    // ================================================
    // PREVENT DUPLICATE EMAIL
    // ================================================

    const emailAlreadySent =
      await Notification.findOne({
        where: {
          subscriptionId: subscription.id,

          type: "SUBSCRIPTION_EXPIRY_EMAIL",
        },
      });


    if (emailAlreadySent) {
      return;
    }


    // ================================================
    // SEND EMAIL
    // ================================================

    await sendEmail({

      to: superAdminEmail,

      subject:
        `Subscription Expiry Alert - Shop ${subscription.shopId}`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          padding: 20px;
        ">

          <h2 style="color:#dc2626;">
            Subscription Expiry Alert
          </h2>

          <p>
            A shop subscription expires today.
          </p>

          <table
            style="
              border-collapse: collapse;
              width: 100%;
              max-width: 600px;
            "
          >

            <tr>
              <td style="padding:10px;font-weight:bold;">
                Shop ID
              </td>

              <td style="padding:10px;">
                ${subscription.shopId}
              </td>
            </tr>

            <tr>
              <td style="padding:10px;font-weight:bold;">
                Plan
              </td>

              <td style="padding:10px;">
                ${subscription.plan}
              </td>
            </tr>

            <tr>
              <td style="padding:10px;font-weight:bold;">
                Amount
              </td>

              <td style="padding:10px;">
                ₹${subscription.amount}
              </td>
            </tr>

            <tr>
              <td style="padding:10px;font-weight:bold;">
                Start Date
              </td>

              <td style="padding:10px;">
                ${subscription.startDate}
              </td>
            </tr>

            <tr>
              <td style="padding:10px;font-weight:bold;">
                Expiry Date
              </td>

              <td style="padding:10px;">
                ${subscription.endDate}
              </td>
            </tr>

          </table>

          <p style="margin-top:20px;">
            Please review this shop's subscription.
          </p>

        </div>
      `,
    });


    // ================================================
    // RECORD EMAIL SENT
    // ================================================

    await Notification.create({

      shopId: subscription.shopId,

      userId: null,

      subscriptionId: subscription.id,

      inventoryItemId: null,

      type: "SUBSCRIPTION_EXPIRY_EMAIL",

      title: "Subscription Expiry Email Sent",

      message:
        `Expiry email sent to Super Admin for subscription ${subscription.id}.`,

      isRead: true,

      isResolved: true,

      resolvedAt: new Date(),
    });


    console.log(
      ` Expiry email sent for subscription ${subscription.id}`
    );

  } catch (error) {

    console.error(
      `Failed to send expiry email for subscription ${subscription.id}:`,
      error
    );
  }
};