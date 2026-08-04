const { Op } = require("sequelize");
const { Task } = require("../models");

// GET /api/tasks/my-tasks?status=pending&type=pickup&date=2026-05-24
// Always scoped to req.user.id — an employee can only ever see their own tasks.
exports.getMyTasks = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status, type, date } = req.query;

    const where = { employee_id: employeeId };
    if (status) where.status = status;
    if (type) where.task_type = type;

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.scheduled_time = { [Op.between]: [start, end] };
    }

    const tasks = await Task.findAll({
      where,
      order: [["scheduled_time", "ASC"]],
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/my-tasks/stats?date=2026-05-24
// Powers the small KPI cards at the top of the "My Tasks" screen.
exports.getMyTaskStats = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { date } = req.query;

    const where = { employee_id: employeeId };
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.scheduled_time = { [Op.between]: [start, end] };
    }

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.count({ where }),
      Task.count({ where: { ...where, status: "pending" } }),
      Task.count({ where: { ...where, status: "in_progress" } }),
      Task.count({ where: { ...where, status: "completed" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, pending, inProgress, completed },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, employee_id: req.user.id }, // can't fetch someone else's task
    });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/status   { "status": "in_progress" | "completed" }
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "in_progress", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const task = await Task.findOne({
      where: { id: req.params.id, employee_id: req.user.id },
    });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.status = status;
    await task.save();

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/notes   { "notes": "..." }
exports.updateTaskNotes = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, employee_id: req.user.id },
    });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.notes = req.body.notes ?? task.notes;
    await task.save();

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};