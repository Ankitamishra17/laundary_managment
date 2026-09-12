import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import { notifyShopAdmins, notifyCustomer } from "./notification.controller.js";
import { findOrCreateCustomer } from "../utils/customerHelper.js";

// ============================================================
// CUSTOMER — submit a review for a completed/delivered order
// POST /api/reviews
// ============================================================
export const submitReview = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;

    if (!order_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "order_id and rating are required.",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    const customer = await findOrCreateCustomer(req.user.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }

    // Tenant scope: the order must belong to the customer's own shop.
    // Ordering by PK first so the error messages stay the same as before.
    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (customer.shopId && order.shop_id !== customer.shopId) {
      return res.status(403).json({
        success: false,
        message: "You can only review orders from your own shop.",
      });
    }

    if (order.customer_id !== customer.id) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own orders.",
      });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "You can only review orders that have been delivered.",
      });
    }

    // Check if already reviewed
    const existing = await Review.findOne({
      where: { customer_id: customer.id, order_id: order.id },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this order.",
      });
    }

    const review = await Review.create({
      customer_id: customer.id,
      order_id: order.id,
      shop_id: order.shop_id,
      rating,
      comment: comment || null,
    });

    // Notify shop admins
    await notifyShopAdmins(order.shop_id, {
      title: "New review received",
      message: `Customer left a ${rating}-star review for order #${order.id}.`,
      type: "review",
      link: "/admin/reviews",
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Submit Review Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CUSTOMER — my reviews
// GET /api/reviews/mine
// ============================================================
export const getMyReviews = async (req, res) => {
  try {
    const customer = await findOrCreateCustomer(req.user.id);
    if (!customer) {
      return res.status(200).json({ success: true, data: [] });
    }

    const reviews = await Review.findAll({
      where: { customer_id: customer.id },
      include: [{ model: Order, as: "order", attributes: ["id", "status"] }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Get My Reviews Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// CUSTOMER — delete own review
// DELETE /api/reviews/:id
// ============================================================
export const deleteMyReview = async (req, res) => {
  try {
    const customer = await findOrCreateCustomer(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    const review = await Review.findOne({
      where: { id: req.params.id, customer_id: customer.id },
    });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    await review.destroy();
    return res.status(200).json({ success: true, message: "Review deleted." });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — get all reviews for my shop
// GET /api/reviews
// ============================================================
export const getShopReviews = async (req, res) => {
  try {
    const where = {};
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const reviews = await Review.findAll({
      where,
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
        { model: Order, as: "order", attributes: ["id", "status", "total_amount"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Get Shop Reviews Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — reply to a review
// POST /api/reviews/:id/reply
// ============================================================
export const replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ success: false, message: "Reply is required." });
    }

    const where = { id: req.params.id };
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const review = await Review.findOne({ where });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    review.admin_reply = reply;
    review.admin_replied_at = new Date();
    await review.save();

    // Notify customer
    const customer = await Customer.findByPk(review.customer_id);
    await notifyCustomer(customer, {
      title: "Reply to your review",
      message: `The shop replied to your review for order #${review.order_id}.`,
      type: "review",
      link: "/customer/orders",
    });

    return res.status(200).json({
      success: true,
      message: "Reply added successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Reply to Review Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — review stats for dashboard
// GET /api/reviews/stats
// ============================================================
export const getReviewStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.shopId) where.shop_id = req.user.shopId;

    const allReviews = await Review.findAll({ where, attributes: ["rating"] });
    const total = allReviews.length;
    const avgRating =
      total > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: { total, avgRating: Math.round(avgRating * 10) / 10, distribution },
    });
  } catch (error) {
    console.error("Get Review Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
