import { Op } from "sequelize";
import { Task, Employee } from "../models/index.js";

const TASK_TYPES = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

// ============================================================
// Admin side
// ============================================================

// GET /api/tasks?employee_id=&status=&task_type= — Admin lists all tasks
export const getAllTasks = async (req, res) => {
  try {
    const { employee_id, status, task_type } = req.query;

    const where = {};
    if (employee_id) where.employee_id = employee_id;
    if (status) where.status = status;
    if (task_type) where.task_type = task_type;

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation"],
        },
      ],
      order: [["scheduled_time", "DESC"]],
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks — Admin assigns a task to an employee
export const assignTask = async (req, res) => {
  try {
    const {
      employee_id,
      customer_name,
      customer_phone,
      customer_address,
      task_type,
      scheduled_time,
      priority,
      notes,
    } = req.body;

    if (!employee_id || !customer_name || !task_type || !scheduled_time) {
      return res.status(400).json({
        success: false,
        message: "employee_id, customer_name, task_type and scheduled_time are required",
      });
    }

    if (!TASK_TYPES.includes(task_type)) {
      return res.status(400).json({ success: false, message: "Invalid task_type" });
    }

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const task = await Task.create({
      employee_id,
      customer_name,
      customer_phone: customer_phone || null,
      customer_address: customer_address || null,
      task_type,
      scheduled_time,
      priority: priority || "normal",
      status: "pending",
      notes: notes || null,
    });

    return res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      data: task,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ success: false, message: error.errors?.[0]?.message || error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Employee side — always scoped to the logged-in employee
// ============================================================

// GET /api/tasks/my-tasks?status=pending&type=pickup&date=2026-05-24
export const getMyTasks = async (req, res) => {
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
export const getMyTaskStats = async (req, res) => {
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
export const getTaskById = async (req, res) => {
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
export const updateTaskStatus = async (req, res) => {
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
export const updateTaskNotes = async (req, res) => {
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
