import express from "express";

import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployeeByAdmin,
  deactivateEmployee,
  reactivateEmployee,
  deleteEmployeePermanently,
  adminResetEmployeePassword,
} from "../controllers/adminEmployee.controller.js";

const router = express.Router();

// Every route in here is admin-only (super admins can manage too)
router.use(protect, allowRoles("admin", "super_admin"));

router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.patch("/:id", updateEmployeeByAdmin);
router.delete("/:id/permanent", deleteEmployeePermanently);
router.delete("/:id", deactivateEmployee);
router.patch("/:id/reactivate", reactivateEmployee);
router.post("/:id/reset-password", adminResetEmployeePassword);

export default router;
