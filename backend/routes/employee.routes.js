const express = require("express");
const router = express.Router();
const employeeOrderController = require("../controllers/employeeOrder.controller");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

router.use(protect); // login required
router.use(authorizeRoles("employee")); // sirf employee access kar sake

router.get("/my-orders", employeeOrderController.getMyAssignedOrders);
router.get("/my-orders/:id", employeeOrderController.getMyOrderById);
router.patch("/my-orders/:id/status", employeeOrderController.updateOrderStatus);
router.patch("/my-orders/:id/pickup", employeeOrderController.markPickupDone);
router.patch("/my-orders/:id/delivery", employeeOrderController.markDeliveryDone);
router.get("/my-orders/:id/receipt", employeeOrderController.generateReceipt);
router.get("/profile/me", employeeOrderController.getMyProfile);

module.exports = router;
 