import { Op } from "sequelize";
import { Attendance, Employee } from "../models/index.js";

const FULL_DAY_MINUTES = 240; // 4h — below this a check-out is treated as a half day

// Convert a Date to a local "YYYY-MM-DD" string (server-local timezone)
function toDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Whole minutes worked between check-in and check-out
function workedMinutes(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 60000));
}

// First and last day of a "YYYY-MM" month as "YYYY-MM-DD" strings
function monthRange(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate(); // day 0 of next month = last day
  const pad = (n) => String(n).padStart(2, "0");
  return [`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(lastDay)}`];
}

function minutesToLabel(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const ALLOWED_STATUS = ["present", "absent", "half_day", "leave"];

// ============================================================
// Employee side — always scoped to the logged-in employee
// ============================================================

// POST /api/attendance/check-in
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const now = new Date();
    const date = toDateStr(now);

    const existing = await Attendance.findOne({
      where: { employee_id: employeeId, date },
    });

    if (existing && existing.check_in) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today.",
      });
    }

    if (existing) {
      // A manual record existed (e.g. leave) — the real clock-in wins
      existing.check_in = now;
      existing.status = "present";
      existing.notes = existing.notes || null;
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Checked in successfully.",
        data: existing,
      });
    }

    const record = await Attendance.create({
      employee_id: employeeId,
      date,
      check_in: now,
      status: "present",
    });

    return res.status(201).json({
      success: true,
      message: "Checked in successfully.",
      data: record,
    });
  } catch (error) {
    // Two rapid check-ins could both pass the findOne and hit the unique index
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today.",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/attendance/check-out
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const now = new Date();
    const date = toDateStr(now);

    const record = await Attendance.findOne({
      where: { employee_id: employeeId, date },
    });

    if (!record || !record.check_in) {
      return res.status(400).json({
        success: false,
        message: "Please check in before checking out.",
      });
    }

    if (record.check_out) {
      return res.status(400).json({
        success: false,
        message: "You have already checked out today.",
      });
    }

    record.check_out = now;

    // Auto-classify — shorter days are treated as half days
    const mins = workedMinutes(record.check_in, record.check_out);
    if (mins > 0 && mins < FULL_DAY_MINUTES) {
      record.status = "half_day";
    } else {
      record.status = "present";
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Checked out successfully.",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/my/today — the employee's record for today (or null)
export const getMyToday = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      where: { employee_id: req.user.id, date: toDateStr() },
    });
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/my?month=YYYY-MM  |  ?from=&to=
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, from, to } = req.query;

    const where = { employee_id: employeeId };

    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    } else if (month) {
      where.date = { [Op.between]: monthRange(month) };
    } else {
      const now = new Date();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      where.date = { [Op.between]: monthRange(`${now.getFullYear()}-${m}`) };
    }

    const records = await Attendance.findAll({
      where,
      order: [["date", "DESC"]],
    });

    let workedMins = 0;
    const stats = {
      totalDays: records.length,
      presentDays: 0,
      halfDays: 0,
      leaves: 0,
      absents: 0,
      totalHours: "—",
    };

    for (const r of records) {
      const mins = workedMinutes(r.check_in, r.check_out);
      workedMins += mins;
      if (r.status === "present") stats.presentDays += 1;
      if (r.status === "half_day") stats.halfDays += 1;
      if (r.status === "leave") stats.leaves += 1;
      if (r.status === "absent") stats.absents += 1;
    }
    stats.totalHours = minutesToLabel(workedMins);

    return res.status(200).json({ success: true, data: records, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Admin side
// ============================================================

// GET /api/attendance/daily?date=YYYY-MM-DD
// Lists every active employee with their status for that day.
// Employees without a record are shown as absent.
export const getDailyAttendance = async (req, res) => {
  try {
    const date = req.query.date || toDateStr();

    const employeeWhere = { status: "active" };
    const attendanceWhere = { date };

    // Scope to the admin's shop — super admins (no shopId) see everything
    if (req.user.shopId) {
      employeeWhere.shop_id = req.user.shopId;
    }

    const [employees, records] = await Promise.all([
      Employee.findAll({
        where: employeeWhere,
        attributes: ["id", "name", "email", "designation", "shop_id"],
        order: [["name", "ASC"]],
      }),
      Attendance.findAll({
        where: attendanceWhere,
        include: [
          { model: Employee, as: "employee", attributes: ["id", "name", "shop_id"] },
        ],
      }),
    ]);

    const recordMap = new Map(records.map((r) => [r.employee_id, r]));

    // For admin with a shop, only include records belonging to their shop's employees
    const shopEmployeeIds = req.user.shopId
      ? new Set(employees.map((e) => e.id))
      : null;

    const rows = employees.map((emp) => {
      const record = recordMap.get(emp.id) || null;
      // No record for the day = not checked in = absent
      const status = record ? record.status : "absent";
      return {
        employee: {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          designation: emp.designation,
        },
        record: record
          ? {
              id: record.id,
              check_in: record.check_in,
              check_out: record.check_out,
              status: record.status,
              notes: record.notes,
              worked_minutes: workedMinutes(record.check_in, record.check_out),
            }
          : null,
        status,
      };
    });

    const stats = {
      total: employees.length,
      present: rows.filter((r) => r.status === "present").length,
      halfDay: rows.filter((r) => r.status === "half_day").length,
      leave: rows.filter((r) => r.status === "leave").length,
      absent: rows.filter((r) => r.status === "absent").length,
    };

    return res.status(200).json({ success: true, data: rows, stats, date });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attendance/reports?from=&to=&employee_id=
export const getAttendanceReport = async (req, res) => {
  try {
    const { from, to, employee_id } = req.query;

    const now = new Date();
    const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const defaultTo = toDateStr(now);

    const where = {
      date: {
        [Op.between]: [from || defaultFrom, to || defaultTo],
      },
      ...(employee_id ? { employee_id } : {}),
    };

    // Scope to the admin's shop — only show attendance for their employees
    const include = [
      {
        model: Employee,
        as: "employee",
        attributes: ["id", "name", "email", "designation", "shop_id"],
      },
    ];

    // If the admin has a shop, scope attendance to their shop's employees
    if (req.user.shopId) {
      include[0].where = { shop_id: req.user.shopId };
      include[0].required = true;
    }

    const records = await Attendance.findAll({
      where,
      include,
      order: [["date", "DESC"]],
    });

    const stats = {
      totalDays: records.length,
      presentDays: 0,
      halfDays: 0,
      leaves: 0,
      absents: 0,
      totalHours: "—",
    };

    let workedMins = 0;
    for (const r of records) {
      workedMins += workedMinutes(r.check_in, r.check_out);
      if (r.status === "present") stats.presentDays += 1;
      if (r.status === "half_day") stats.halfDays += 1;
      if (r.status === "leave") stats.leaves += 1;
      if (r.status === "absent") stats.absents += 1;
    }
    stats.totalHours = minutesToLabel(workedMins);

    // Group by employee for per-person summaries
    const perEmployee = [];
    const byEmployee = new Map();
    for (const r of records) {
      const key = r.employee_id;
      if (!byEmployee.has(key)) {
        byEmployee.set(key, {
          employee: r.employee,
          days: 0,
          present: 0,
          halfDay: 0,
          leave: 0,
          absent: 0,
          worked_minutes: 0,
        });
        perEmployee.push(byEmployee.get(key));
      }
      const agg = byEmployee.get(key);
      agg.days += 1;
      agg.worked_minutes += workedMinutes(r.check_in, r.check_out);
      if (r.status === "present") agg.present += 1;
      if (r.status === "half_day") agg.halfDay += 1;
      if (r.status === "leave") agg.leave += 1;
      if (r.status === "absent") agg.absent += 1;
    }

    return res.status(200).json({ success: true, data: records, stats, perEmployee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/attendance/mark  { employee_id, date, status, notes?, check_in?, check_out? }
// Admin manually records attendance for a day (leave, absent, half-day, etc.)
export const markAttendance = async (req, res) => {
  try {
    const { employee_id, date, status, notes, check_in, check_out } = req.body;

    if (!employee_id || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "employee_id, date and status are required",
      });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${ALLOWED_STATUS.join(", ")}`,
      });
    }

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    let record = await Attendance.findOne({ where: { employee_id, date } });

    // "absent" / "leave" have no clock times — clear them
    const clearTimes = status === "absent" || status === "leave";

    // Light sanity check for manually entered times
    if (!clearTimes && check_in && check_out) {
      if (new Date(check_out) <= new Date(check_in)) {
        return res.status(400).json({
          success: false,
          message: "Check-out time must be after check-in time.",
        });
      }
    }

    const payload = {
      employee_id,
      date,
      status,
      notes: notes || null,
      check_in: clearTimes ? null : check_in ? new Date(check_in) : record?.check_in || null,
      check_out: clearTimes ? null : check_out ? new Date(check_out) : record?.check_out || null,
    };

    if (record) {
      await record.update(payload);
    } else {
      record = await Attendance.create(payload);
    }

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully.",
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
