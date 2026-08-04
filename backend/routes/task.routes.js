const express = require("express");
const router = express.Router();

const {
  getMyTasks,
  getMyTaskStats,
  getTaskById,
  updateTaskStatus,
  updateTaskNotes,
} = require("../controllers/task.controller");

const auth = require("../middleware/auth");

// every route here is auto-scoped to the logged-in employee inside the controller
router.get("/my-tasks", auth, getMyTasks);
router.get("/my-tasks/stats", auth, getMyTaskStats);
router.get("/:id", auth, getTaskById);
router.patch("/:id/status", auth, updateTaskStatus);
router.patch("/:id/notes", auth, updateTaskNotes);

module.exports = router;