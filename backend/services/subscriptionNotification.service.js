import { Op } from "sequelize";

import Subscription from "../models/Subscription.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/nodemailerEmail.js";
// Subscription expiry notifications:
// 3, 2, 1 days remaining + last day (0)
const EXPIRY_DAYS = [3, 2, 1, 0];

const getDaysRemaining = (endDate) => {
  const today = new Date();
  const expiry = new Date(`${endDate}T00:00:00`);

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

const getEmailSubject = (shopName, daysRemaining) => {
  if (daysRemaining === 0) {
    return `Subscription expires today - ${shopName}`;
  }

  return `Subscription expires in ${daysRemaining} day${
    daysRemaining > 1 ? "s" : ""
  } - ${shopName}`;
};

const getEmailHtml = ({
  recipientName,
  shopName,
  plan,
  endDate,
  daysRemaining,
  isSuperAdmin = false,
}) => {
  const expiryText =
    daysRemaining === 0
      ? "Your subscription expires today."
      : `Your subscription will expire in ${daysRemaining} day${
          daysRemaining > 1 ? "s" : ""
        }.`;

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Subscription Expiry Alert</h2>

      <p>Hello ${recipientName || "User"},</p>

      <p>${expiryText}</p>

      <table style="border-collapse: collapse; margin: 15px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <strong>Shop</strong>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${shopName}
          </td>
        </tr>

        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <strong>Plan</strong>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${plan}
          </td>
        </tr>

        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <strong>Expiry Date</strong>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${endDate}
          </td>
        </tr>

        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <strong>Days Remaining</strong>
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${daysRemaining}
          </td>
        </tr>
      </table>

      ${
        daysRemaining === 0
          ? `
            <p>
              Please renew the subscription immediately to avoid
              service interruption.
            </p>
          `
          : `
            <p>
              Please renew the subscription before the expiry date
              to continue using the system.
            </p>
          `
      }

      ${
        isSuperAdmin
          ? `<p>This alert is for the Super Admin regarding the above shop.</p>`
          : ""
      }

      <p>Regards,<br />Laundry Management System</p>
    </div>
  `;
};

const notificationExists = async ({
  userId,
  shopId,
  subscriptionId,
  daysRemaining,
}) => {
  const where = {
    shopId,
    subscriptionId,
    daysRemaining,
    type: {
      [Op.in]: ["SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRES_TODAY"],
    },
  };

  // Admin notification
  if (userId !== null) {
    where.userId = userId;
  } else {
    // Super Admin notification
    where.userId = null;
  }

  return Notification.findOne({ where });
};

export const checkSubscriptionExpiryNotifications = async () => {
  try {
    const subscriptions = await Subscription.findAll({
      where: {
        status: "Active",
        endDate: {
          [Op.not]: null,
        },
      },
      include: [
        {
          model: Shop,
          as: "shop",
          required: true,
          where: {
            isDeleted: false,
          },
        },
      ],
    });

    if (!subscriptions.length) {
      console.log("No active subscriptions found.");
      return;
    }

    // Active Super Admins
    const superAdmins = await User.findAll({
      where: {
        role: "super_admin",
        isActive: true,
      },
    });

    for (const subscription of subscriptions) {
      const shop = subscription.shop;

      if (!shop) continue;

      const daysRemaining = getDaysRemaining(subscription.endDate);

      // We only start from 3 days before expiry
      if (!EXPIRY_DAYS.includes(daysRemaining)) {
        continue;
      }

      const notificationType =
        daysRemaining === 0
          ? "SUBSCRIPTION_EXPIRES_TODAY"
          : "SUBSCRIPTION_EXPIRING";

      const title =
        daysRemaining === 0
          ? "Subscription expires today"
          : `Subscription expires in ${daysRemaining} day${
              daysRemaining > 1 ? "s" : ""
            }`;

      const message =
        daysRemaining === 0
          ? `Subscription of ${shop.name} expires today.`
          : `Subscription of ${shop.name} expires in ${daysRemaining} day${
              daysRemaining > 1 ? "s" : ""
            }.`;

      // ============================================================
      // 1. SHOP ADMINS
      // ============================================================

      const admins = await User.findAll({
        where: {
          role: "admin",
          shopId: subscription.shopId,
          isActive: true,
        },
      });

      for (const admin of admins) {
        const alreadyExists = await notificationExists({
          userId: admin.id,
          shopId: subscription.shopId,
          subscriptionId: subscription.id,
          daysRemaining,
        });

        if (!alreadyExists) {
          await Notification.create({
            shopId: subscription.shopId,
            userId: admin.id,
            subscriptionId: subscription.id,
            daysRemaining,
            notificationDate: new Date().toISOString().slice(0, 10),
            emailSent: false,

            type: notificationType,
            title,
            message,

            link: `/${shop.slug}/admin/settings/subscription`,

            isRead: false,
            isResolved: false,
          });
        }

        // ADMIN EMAIL
        // 3, 2, 1 AND 0 -> YES
        if (admin.email) {
          try {
            await sendEmail({
              to: admin.email,
              subject: getEmailSubject(shop.name, daysRemaining),
              html: getEmailHtml({
                recipientName: admin.name,
                shopName: shop.name,
                plan: subscription.plan,
                endDate: subscription.endDate,
                daysRemaining,
              }),
            });

            // Mark email sent for this notification
            await Notification.update(
              {
                emailSent: true,
              },
              {
                where: {
                  shopId: subscription.shopId,
                  userId: admin.id,
                  subscriptionId: subscription.id,
                  daysRemaining,
                  type: notificationType,
                },
              },
            );

            console.log(
              `Subscription email sent to admin ${admin.email} - ${shop.name} - ${daysRemaining} days`,
            );
          } catch (emailError) {
            console.error(
              `Subscription email failed for admin ${admin.email}:`,
              emailError.message,
            );
          }
        }
      }

      // ============================================================
      // 2. SUPER ADMINS
      // ============================================================

      for (const superAdmin of superAdmins) {
        const alreadyExists = await notificationExists({
          userId: null,
          shopId: subscription.shopId,
          subscriptionId: subscription.id,
          daysRemaining,
        });

        if (!alreadyExists) {
          await Notification.create({
            shopId: subscription.shopId,

            // NULL = global/super-admin notification
            userId: null,

            subscriptionId: subscription.id,
            daysRemaining,
            notificationDate: new Date().toISOString().slice(0, 10),
            emailSent: false,

            type: notificationType,
            title,
            message,

            link: "/super/subscriptions",

            isRead: false,
            isResolved: false,
          });
        }

        // ========================================================
        // SUPER ADMIN EMAIL
        //
        // 3, 2, 1 -> YES
        // 0       -> NO
        // ========================================================

        if (daysRemaining > 0 && superAdmin.email) {
          try {
            await sendEmail({
              to: superAdmin.email,
              subject: getEmailSubject(shop.name, daysRemaining),
              html: getEmailHtml({
                recipientName: superAdmin.name,
                shopName: shop.name,
                plan: subscription.plan,
                endDate: subscription.endDate,
                daysRemaining,
                isSuperAdmin: true,
              }),
            });

            await Notification.update(
              {
                emailSent: true,
              },
              {
                where: {
                  shopId: subscription.shopId,
                  userId: null,
                  subscriptionId: subscription.id,
                  daysRemaining,
                  type: notificationType,
                },
              },
            );

            console.log(
              `Subscription email sent to super admin ${superAdmin.email} - ${shop.name} - ${daysRemaining} days`,
            );
          } catch (emailError) {
            console.error(
              `Subscription email failed for super admin ${superAdmin.email}:`,
              emailError.message,
            );
          }
        } else if (daysRemaining === 0) {
          console.log(
            `Super admin email skipped for ${shop.name} because subscription expires today.`,
          );
        }
      }
    }

    console.log("Subscription expiry notification check completed.");
  } catch (error) {
    console.error("Subscription expiry notification service error:", error);
  }
};
