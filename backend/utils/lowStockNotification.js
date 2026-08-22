import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./nodemailerEmail.js";

export const createLowStockNotification = async ({ shopId, inventoryItem }) => {
  try {
    const currentStock = Number(inventoryItem.currentStock || 0);

    const minimumStock = Number(inventoryItem.minStock || 0);

    // ============================================
    // NOT LOW STOCK
    // ============================================

    if (currentStock > minimumStock) {
      return null;
    }

    // ============================================
    // FIND SHOP ADMIN
    // ============================================

    const admin = await User.findOne({
      where: {
        shopId,
        role: "admin",
        isActive: true,
      },
    });

    if (!admin) {
      console.log(`No active admin found for shop ${shopId}`);

      return null;
    }

    // ============================================
    // CHECK EXISTING UNRESOLVED NOTIFICATION
    // ============================================

    const existingNotification = await Notification.findOne({
      where: {
        shopId,
        userId: admin.id,
        inventoryItemId: inventoryItem.id,
        type: "LOW_STOCK",
        isResolved: false,
      },
    });

    // Don't create duplicate notification
    if (existingNotification) {
      return existingNotification;
    }

    // ============================================
    // MESSAGE
    // ============================================

    const message =
      `${inventoryItem.name} is running low. ` +
      `Current stock is ${currentStock} ` +
      `${inventoryItem.unit}. ` +
      `Minimum stock is ${minimumStock} ` +
      `${inventoryItem.unit}.`;

    // ============================================
    // CREATE DATABASE NOTIFICATION
    // ============================================

    const notification = await Notification.create({
      shopId,

      userId: admin.id,

      inventoryItemId: inventoryItem.id,

      type: "LOW_STOCK",

      title: "Low Stock Alert",

      message,

      isRead: false,

      isResolved: false,
    });

    // ============================================
    // SEND EMAIL TO ADMIN
    // ============================================

    try {
      await sendEmail({
        to: admin.email,

        subject: `⚠️ Low Stock Alert - ${inventoryItem.name}`,

        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 25px;
            border: 1px solid #D8ECEA;
            border-radius: 12px;
            background: #ffffff;
          ">

            <h2 style="
              color: #05282A;
              margin-bottom: 10px;
            ">
              ⚠️ Low Stock Alert
            </h2>

            <p style="
              color: #5C7A78;
              font-size: 14px;
            ">
              An inventory item in your shop
              has reached its minimum stock level.
            </p>

            <div style="
              background: #EEF7F6;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            ">

              <p>
                <strong>Item:</strong>
                ${inventoryItem.name}
              </p>

              <p>
                <strong>Current Stock:</strong>
                ${currentStock}
                ${inventoryItem.unit}
              </p>

              <p>
                <strong>Minimum Stock:</strong>
                ${minimumStock}
                ${inventoryItem.unit}
              </p>

              <p>
                <strong>Status:</strong>
                <span style="color:#DC2626;">
                  Low Stock
                </span>
              </p>

            </div>

            <p style="
              color:#DC2626;
              font-weight:600;
            ">
              Please restock this item.
            </p>

            <p style="
              color:#5C7A78;
              font-size:12px;
              margin-top:25px;
            ">
              This is an automated notification
              from your Laundry Management System.
            </p>

          </div>
        `,
      });

      console.log(`Low stock email sent to ${admin.email}`);
    } catch (emailError) {
      // Email failure should not break inventory
      console.error("Low stock email failed:", emailError.message);
    }

    return notification;
  } catch (error) {
    console.error("Create Low Stock Notification Error:", error);

    return null;
  }
};

export const resolveLowStockNotification = async ({
  shopId,
  inventoryItemId,
}) => {
  try {
    await Notification.update(
      {
        isResolved: true,
        resolvedAt: new Date(),
      },
      {
        where: {
          shopId,
          inventoryItemId,
          type: "LOW_STOCK",
          isResolved: false,
        },
      },
    );

    console.log(
      `Low stock notification resolved for inventory item ${inventoryItemId}`,
    );
  } catch (error) {
    console.error("Resolve Low Stock Notification Error:", error);
  }
};
