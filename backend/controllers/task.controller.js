
import { Op, literal } from "sequelize";

import Task from "../models/Tasks.js";
import Employee from "../models/Employee.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Shop from "../models/Shop.js";

import {
  createNotification,
  notifyShopAdmins,
  notifyCustomer,
} from "./notification.controller.js";

/* ============================================================
   CONSTANTS
============================================================ */

const TASK_TYPES = [
  "pickup",
  "wash",
  "dry",
  "iron",
  "pack",
  "delivery",
];

const TASK_SEQUENCE = [
  "pickup",
  "wash",
  "dry",
  "iron",
  "pack",
  "delivery",
];

const TASK_SEQUENCE_MAP = {
  pickup: 1,
  wash: 2,
  dry: 3,
  iron: 4,
  pack: 5,
  delivery: 6,
};

const TASK_TYPE_LABELS = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  picked_up: "Picked Up",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_STATUS_RANK = {
  pending: 0,
  picked_up: 1,
  processing: 2,
  ready_for_delivery: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: 6,
};

/* ============================================================
   AUTH / TENANT HELPERS
============================================================ */

const getShopId = (req) => {
  const shopId = req.user?.shopId;

  if (!shopId) return null;

  return Number(shopId);
};

const getEmployeeId = (req) => {
  if (req.user?.role !== "employee") {
    return null;
  }

  return Number(req.user.id);
};

const requireShop = (req, res) => {
  const shopId = getShopId(req);

  if (!shopId) {
    res.status(403).json({
      success: false,
      message: "Shop context is required.",
    });

    return null;
  }

  return shopId;
};

const requireEmployeeContext = (req, res) => {
  const shopId = getShopId(req);
  const employeeId = getEmployeeId(req);

  if (!shopId || !employeeId) {
    res.status(403).json({
      success: false,
      message: "Employee shop context is missing.",
    });

    return null;
  }

  return {
    shopId,
    employeeId,
  };
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

const isValidTaskType = (type) => {
  return TASK_TYPES.includes(type);
};

const getTaskSequence = (type) => {
  return TASK_SEQUENCE_MAP[type] || null;
};

const getTaskLabel = (type) => {
  return TASK_TYPE_LABELS[type] || type;
};

const getStatusLabel = (status) => {
  return ORDER_STATUS_LABELS[status] || status;
};

/* ============================================================
   TASK QUERY HELPERS
============================================================ */

const getOrderTasksSorted = async (orderId, shopId) => {
  return Task.findAll({
    where: {
      order_id: Number(orderId),
      shop_id: Number(shopId),
    },
    order: [
      ["sequence", "ASC"],
      ["id", "ASC"],
    ],
  });
};

/*
 * One task type should normally exist only once per order.
 * If old duplicate data exists, latest ID wins.
 */
const latestTasksByType = (tasks = []) => {
  const map = {};

  for (const task of tasks) {
    if (
      !map[task.task_type] ||
      Number(task.id) > Number(map[task.task_type].id)
    ) {
      map[task.task_type] = task;
    }
  }

  return map;
};

/* ============================================================
   STRICT WORKFLOW
============================================================ */

/*
 * Returns ALL previous ASSIGNED tasks that are not completed.
 *
 * Missing task = not assigned = ignored.
 *
 * Example:
 *
 * pickup  completed
 * wash    completed
 * dry     pending
 * iron    missing
 * pack    pending
 *
 * For pack:
 * dry is blocker
 *
 * For delivery:
 * dry + pack are blockers
 */
const getBlockingTasks = (task, tasks = []) => {
  if (!task) return [];

  const currentSequence = getTaskSequence(task.task_type);

  if (!currentSequence) return [];

  const latest = latestTasksByType(tasks);

  return TASK_SEQUENCE
    .filter((type) => {
      const sequence = getTaskSequence(type);

      if (sequence >= currentSequence) {
        return false;
      }

      const previousTask = latest[type];

      /*
       * If task type was never assigned,
       * it is NOT a blocker.
       */
      if (!previousTask) {
        return false;
      }

      return previousTask.status !== "completed";
    })
    .map((type) => latest[type]);
};

const previousTasksCompleted = (taskType, tasks = []) => {
  const currentSequence = getTaskSequence(taskType);

  if (!currentSequence) return false;

  const fakeTask = {
    task_type: taskType,
  };

  return getBlockingTasks(fakeTask, tasks).length === 0;
};

/*
 * IMPORTANT:
 *
 * pending + true  = employee can start
 * pending + false = locked
 * in_progress     = active
 * completed       = finished
 */
const isTaskReady = (task, tasks = []) => {
  if (!task) return false;

  if (task.status === "completed") {
    return false;
  }

  if (task.status === "in_progress") {
    return true;
  }

  return getBlockingTasks(task, tasks).length === 0;
};

const getBlockedBy = (task, tasks = []) => {
  return getBlockingTasks(task, tasks).map((item) => ({
    id: item.id,
    task_type: item.task_type,
    label: getTaskLabel(item.task_type),
    status: item.status,
    employee_id: item.employee_id,
  }));
};

/* ============================================================
   NEXT TASK
============================================================ */

const findNextTask = (taskType, tasks = []) => {
  const currentSequence = getTaskSequence(taskType);

  if (!currentSequence) return null;

  const latest = latestTasksByType(tasks);

  for (const type of TASK_SEQUENCE) {
    const sequence = getTaskSequence(type);

    if (sequence <= currentSequence) {
      continue;
    }

    const nextTask = latest[type];

    if (nextTask && nextTask.status !== "completed") {
      return nextTask;
    }
  }

  return null;
};

const findFirstTask = (tasks = []) => {
  const latest = latestTasksByType(tasks);

  for (const type of TASK_SEQUENCE) {
    const task = latest[type];

    if (task && task.status !== "completed") {
      return task;
    }
  }

  return null;
};

/* ============================================================
   ORDER STATUS
============================================================ */

const calculateOrderStatus = (
  tasks = [],
  currentOrderStatus = "pending",
) => {
  if (!tasks.length) {
    return currentOrderStatus || "pending";
  }

  const latest = latestTasksByType(tasks);

  /*
   * Delivery completed
   */
  if (latest.delivery?.status === "completed") {
    return "delivered";
  }

  /*
   * Delivery started
   */
  if (latest.delivery?.status === "in_progress") {
    return "out_for_delivery";
  }

  /*
   * Pack completed
   */
  if (latest.pack?.status === "completed") {
    return "ready_for_delivery";
  }

  /*
   * Any processing task started/completed
   */
  const processingTypes = ["wash", "dry", "iron"];

  const processingStarted = processingTypes.some((type) => {
    return (
      latest[type] &&
      ["in_progress", "completed"].includes(latest[type].status)
    );
  });

  if (processingStarted) {
    return "processing";
  }

  /*
   * Pickup started/completed
   */
  if (
    latest.pickup &&
    ["in_progress", "completed"].includes(latest.pickup.status)
  ) {
    return "picked_up";
  }

  return currentOrderStatus || "pending";
};

/* ============================================================
   ADMIN WHERE
============================================================ */

const buildTaskWhereForAdmin = (req, extra = {}) => {
  const where = {
    ...extra,
  };

  const shopId = getShopId(req);

  /*
   * Shop admin = own shop.
   * Super admin = can access all shops if shopId is absent.
   */
  if (shopId) {
    where.shop_id = shopId;
  }

  return where;
};

/* ============================================================
   ADMIN — GET ALL TASKS
   GET /api/tasks
============================================================ */

export const getAllTasks = async (req, res) => {
  try {
    const {
      employee_id,
      status,
      task_type,
      order_id,
    } = req.query;

    const where = buildTaskWhereForAdmin(req);

    if (employee_id) {
      where.employee_id = Number(employee_id);
    }

    if (order_id) {
      where.order_id = Number(order_id);
    }

    if (status) {
      where.status = status;
    }

    if (task_type) {
      if (!isValidTaskType(task_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task_type.",
        });
      }

      where.task_type = task_type;
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "id",
            "name",
            "email",
            "designation",
            "shop_id",
            "status",
          ],
          required: false,
        },
        {
          model: Order,
          as: "order",
          attributes: [
            "id",
            "status",
            "total_amount",
            "pickup_address",
            "delivery_address",
            "shop_id",
          ],
          required: false,
        },
      ],

      order: [
        ["sequence", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get All Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — ASSIGN TASKS
   POST /api/tasks
============================================================ */

export const assignTask = async (req, res) => {
  try {
    const adminShopId = requireShop(req, res);

    if (!adminShopId) return;

    // --------------------------------------------------------
    // SHOP
    // --------------------------------------------------------

    const shop = await Shop.findByPk(adminShopId, {
      attributes: ["id", "slug"],
    });

    if (!shop?.slug) {
      return res.status(403).json({
        success: false,
        message: "Shop slug is missing.",
      });
    }

    const shopSlug = shop.slug;

    // --------------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------------

    const {
      order_id,
      tasks = [],
      customer_name,
      customer_phone,
      customer_address,
      notes,

      // ------------------------------------------------------
      // LEGACY FIELDS
      // ------------------------------------------------------
      // Kept only for backward compatibility.
      // New frontend should use tasks[].
      assignments,
      scheduled_time,
      priority = "normal",
      employee_id,
      task_type,
      task_types,
      force = false,
      force_conflicts = false,
    } = req.body;

    /*
     * force / force_conflicts
     *
     * false:
     *   Check employee schedule conflict.
     *
     * true:
     *   Admin explicitly selected "Assign Anyway".
     */

    const allowConflicts =
      force === true ||
      force_conflicts === true;

    // --------------------------------------------------------
    // NORMALIZE NEW TASK FORMAT
    // --------------------------------------------------------

    let normalizedTasks = [];

    /*
     * NEW FORMAT
     *
     * tasks: [
     *   {
     *     task_type,
     *     employee_id,
     *     scheduled_time,
     *     priority
     *   }
     * ]
     */

    if (Array.isArray(tasks) && tasks.length > 0) {
      normalizedTasks = tasks.map((task) => ({
        task_type: task?.task_type,
        employee_id: Number(task?.employee_id),
        scheduled_time: task?.scheduled_time,
        priority:
          task?.priority || "normal",
      }));
    }

    /*
     * --------------------------------------------------------
     * OLD FORMAT SUPPORT
     * --------------------------------------------------------
     *
     * This keeps older frontend/API calls working.
     *
     * Old format:
     *
     * assignments: [
     *   {
     *     employee_id: 5,
     *     task_types: ["pickup", "delivery"]
     *   }
     * ]
     *
     * scheduled_time:
     *   "2026-09-10T10:00"
     */

    if (
      normalizedTasks.length === 0 &&
      Array.isArray(assignments) &&
      assignments.length > 0
    ) {
      if (!scheduled_time) {
        return res.status(400).json({
          success: false,
          message:
            "scheduled_time is required for legacy assignments.",
        });
      }

      for (const assignment of assignments) {
        const assignedEmployeeId =
          Number(assignment?.employee_id);

        let types =
          assignment?.task_types;

        if (!Array.isArray(types)) {
          types = assignment?.task_type
            ? [assignment.task_type]
            : [];
        }

        for (const type of types) {
          normalizedTasks.push({
            task_type: type,
            employee_id:
              assignedEmployeeId,
            scheduled_time,
            priority,
          });
        }
      }
    }

    /*
     * --------------------------------------------------------
     * SINGLE LEGACY TASK
     * --------------------------------------------------------
     */

    if (
      normalizedTasks.length === 0 &&
      employee_id
    ) {
      let oldTypes = [];

      if (
        Array.isArray(task_types) &&
        task_types.length
      ) {
        oldTypes = task_types;
      } else if (task_type) {
        oldTypes = [task_type];
      }

      if (!oldTypes.length) {
        return res.status(400).json({
          success: false,
          message:
            "Provide tasks[] or task_type/task_types.",
        });
      }

      if (!scheduled_time) {
        return res.status(400).json({
          success: false,
          message:
            "scheduled_time is required.",
        });
      }

      normalizedTasks = oldTypes.map(
        (type) => ({
          task_type: type,
          employee_id:
            Number(employee_id),
          scheduled_time,
          priority,
        }),
      );
    }

    // --------------------------------------------------------
    // AT LEAST ONE TASK
    // --------------------------------------------------------

    if (normalizedTasks.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one task is required.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE TASKS
    // --------------------------------------------------------

    const seenTaskTypes = new Set();

    const preparedTasks = [];

    for (const task of normalizedTasks) {
      const type = task.task_type;
      const employeeId =
        Number(task.employee_id);

      // ------------------------------------------------------
      // TASK TYPE
      // ------------------------------------------------------

      if (!type || !isValidTaskType(type)) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid task_type: ${type}`,
        });
      }

      // ------------------------------------------------------
      // DUPLICATE TASK TYPE IN SAME REQUEST
      // ------------------------------------------------------

      if (seenTaskTypes.has(type)) {
        return res.status(400).json({
          success: false,
          message:
            `${getTaskLabel(
              type,
            )} is assigned more than once.`,
        });
      }

      seenTaskTypes.add(type);

      // ------------------------------------------------------
      // EMPLOYEE
      // ------------------------------------------------------

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message:
            `${getTaskLabel(
              type,
            )} requires an employee.`,
        });
      }

      // ------------------------------------------------------
      // SCHEDULED TIME
      // ------------------------------------------------------

      if (!task.scheduled_time) {
        return res.status(400).json({
          success: false,
          message:
            `scheduled_time is required for ${getTaskLabel(
              type,
            )}.`,
        });
      }

      const scheduledDate =
        new Date(task.scheduled_time);

      if (
        Number.isNaN(
          scheduledDate.getTime(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid scheduled_time for ${getTaskLabel(
              type,
            )}.`,
        });
      }

      // ------------------------------------------------------
      // NO PAST SCHEDULE
      // ------------------------------------------------------

      if (scheduledDate < new Date()) {
        return res.status(400).json({
          success: false,
          message:
            `Scheduled time for ${getTaskLabel(
              type,
            )} cannot be in the past.`,
        });
      }

      // ------------------------------------------------------
      // PRIORITY
      // ------------------------------------------------------

      const taskPriority =
        task.priority || "normal";

      if (
        !["normal", "urgent"].includes(
          taskPriority,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid priority for ${getTaskLabel(
              type,
            )}.`,
        });
      }

      preparedTasks.push({
        task_type: type,
        employee_id: employeeId,
        scheduled_time: scheduledDate,
        priority: taskPriority,
      });
    }

    // --------------------------------------------------------
    // SORT BY WORKFLOW SEQUENCE
    // --------------------------------------------------------

    preparedTasks.sort(
      (a, b) =>
        getTaskSequence(a.task_type) -
        getTaskSequence(b.task_type),
    );

    // --------------------------------------------------------
    // FIND ORDER
    // --------------------------------------------------------

    let resolvedOrderId = order_id
      ? Number(order_id)
      : null;

    let order = null;

    let resolvedName =
      String(
        customer_name || "",
      ).trim();

    let resolvedPhone =
      String(
        customer_phone || "",
      ).trim() || null;

    let resolvedAddress =
      String(
        customer_address || "",
      ).trim() || null;

    // --------------------------------------------------------
    // ORDER VALIDATION
    // --------------------------------------------------------

    if (resolvedOrderId) {
      order = await Order.findOne({
        where: {
          id: resolvedOrderId,
          shop_id: adminShopId,
        },

        include: [
          {
            model: Customer,
            as: "customer",
            attributes: [
              "id",
              "userId",
              "name",
              "phone",
              "address",
              "city",
              "shopId",
            ],
            required: false,
          },
        ],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found in your shop.",
        });
      }

      // ------------------------------------------------------
      // DELIVERED / CANCELLED ORDER
      // ------------------------------------------------------

      if (
        order.status === "delivered" ||
        order.status === "cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Cannot assign tasks to a ${order.status} order.`,
        });
      }

      // ------------------------------------------------------
      // EXISTING TASKS
      // ------------------------------------------------------

      const existingTasks =
        await Task.findAll({
          where: {
            shop_id: adminShopId,
            order_id:
              resolvedOrderId,
          },

          attributes: [
            "id",
            "task_type",
            "employee_id",
            "status",
            "sequence",
            "scheduled_time",
            "priority",
          ],
        });

      const existingTypes =
        new Set(
          existingTasks.map(
            (task) =>
              task.task_type,
          ),
        );

      const duplicateTypes =
        preparedTasks
          .map(
            (task) =>
              task.task_type,
          )
          .filter(
            (type) =>
              existingTypes.has(type),
          );

      if (
        duplicateTypes.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            `These tasks are already assigned for this order: ` +
            duplicateTypes
              .map(getTaskLabel)
              .join(", ") +
            `. Use reassign instead.`,
        });
      }

      // ------------------------------------------------------
      // CUSTOMER DATA
      // ------------------------------------------------------

      /*
       * When an order is selected, order/customer
       * information is the source of truth.
       */

      resolvedName =
        order.customer?.name ||
        String(
          order.pickup_address || "",
        ).trim() ||
        `Order #${order.id}`;

      resolvedPhone =
        order.customer?.phone ||
        null;

      resolvedAddress =
        [
          order.customer?.address,
          order.customer?.city,
        ]
          .filter(Boolean)
          .join(", ") ||
        order.pickup_address ||
        null;

      // ------------------------------------------------------
      // LEGACY ORDER EMPLOYEE
      // ------------------------------------------------------

      if (
        !order.employee_id &&
        preparedTasks.length > 0
      ) {
        order.employee_id =
          Number(
            preparedTasks[0]
              .employee_id,
          );

        await order.save();
      }
    }

    // --------------------------------------------------------
    // CUSTOMER REQUIRED FOR NON-ORDER TASK
    // --------------------------------------------------------

    if (!resolvedName) {
      return res.status(400).json({
        success: false,
        message:
          "customer_name is required when order_id is not provided.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE EMPLOYEES
    // --------------------------------------------------------

    const employeeIds = [
      ...new Set(
        preparedTasks.map(
          (task) =>
            Number(
              task.employee_id,
            ),
        ),
      ),
    ];

    const employees =
      await Employee.findAll({
        where: {
          id: {
            [Op.in]: employeeIds,
          },

          shop_id: adminShopId,
          status: "active",
        },

        attributes: [
          "id",
          "name",
          "email",
          "designation",
          "shop_id",
          "status",
        ],
      });

    if (
      employees.length !==
      employeeIds.length
    ) {
      const foundIds =
        new Set(
          employees.map(
            (employee) =>
              Number(employee.id),
          ),
        );

      const invalidIds =
        employeeIds.filter(
          (id) =>
            !foundIds.has(id),
        );

      return res.status(404).json({
        success: false,
        message:
          `Employee(s) not found in your shop or inactive: ` +
          invalidIds.join(", "),
      });
    }

    // --------------------------------------------------------
    // SCHEDULE CONFLICT CHECK
    // --------------------------------------------------------
    //
    // Conflict means:
    //
    // SAME SHOP
    // SAME EMPLOYEE
    // SAME SCHEDULED TIME
    //
    // This is ONLY a warning.
    // It is NOT a hard block.
    //
    // Admin can:
    //
    // Choose Another Employee
    // OR
    // Assign Anyway
    //
    // --------------------------------------------------------

    const conflicts = [];

    for (
      const preparedTask of preparedTasks
    ) {
      const employeeId =
        Number(
          preparedTask.employee_id,
        );

      const conflictingTasks =
        await Task.findAll({
          where: {
            shop_id:
              adminShopId,

            employee_id:
              employeeId,

            scheduled_time:
              preparedTask.scheduled_time,
          },

          include: [
            {
              model: Employee,
              as: "employee",
              attributes: [
                "id",
                "name",
              ],
              required: false,
            },
          ],

          order: [
            [
              "scheduled_time",
              "ASC",
            ],
          ],
        });

      for (
        const conflictTask of conflictingTasks
      ) {
        conflicts.push({
          employee_id:
            employeeId,

          employee_name:
            employees.find(
              (employee) =>
                Number(
                  employee.id,
                ) === employeeId,
            )?.name ||
            "Unknown",

          task_type:
            preparedTask.task_type,

          task_label:
            getTaskLabel(
              preparedTask.task_type,
            ),

          scheduled_time:
            preparedTask.scheduled_time,

          priority:
            preparedTask.priority,

          conflict_task: {
            id:
              conflictTask.id,

            task_type:
              conflictTask.task_type,

            task_label:
              getTaskLabel(
                conflictTask.task_type,
              ),

            order_id:
              conflictTask.order_id,

            scheduled_time:
              conflictTask.scheduled_time,

            priority:
              conflictTask.priority,

            status:
              conflictTask.status,
          },
        });
      }
    }

    // --------------------------------------------------------
    // ALSO CHECK CONFLICTS BETWEEN NEW TASKS
    // --------------------------------------------------------
    //
    // Example:
    //
    // Pickup -> Ansh -> 10:00
    // Wash   -> Ansh -> 10:00
    //
    // Both are being created in this same request.
    //
    // This should also show a warning.
    //
    // --------------------------------------------------------

    for (
      let i = 0;
      i < preparedTasks.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < preparedTasks.length;
        j++
      ) {
        const first =
          preparedTasks[i];

        const second =
          preparedTasks[j];

        if (
          Number(
            first.employee_id,
          ) ===
            Number(
              second.employee_id,
            ) &&
          first.scheduled_time.getTime() ===
            second.scheduled_time.getTime()
        ) {
          const employee =
            employees.find(
              (item) =>
                Number(
                  item.id,
                ) ===
                Number(
                  first.employee_id,
                ),
            );

          conflicts.push({
            employee_id:
              Number(
                first.employee_id,
              ),

            employee_name:
              employee?.name ||
              "Unknown",

            task_type:
              second.task_type,

            task_label:
              getTaskLabel(
                second.task_type,
              ),

            scheduled_time:
              second.scheduled_time,

            priority:
              second.priority,

            conflict_task: {
              id: null,

              task_type:
                first.task_type,

              task_label:
                getTaskLabel(
                  first.task_type,
                ),

              order_id:
                resolvedOrderId,

              scheduled_time:
                first.scheduled_time,

              priority:
                first.priority,

              status:
                "new",
            },
          });
        }
      }
    }

    // --------------------------------------------------------
    // RETURN CONFLICT WARNING
    // --------------------------------------------------------

    if (
      conflicts.length > 0 &&
      !allowConflicts
    ) {
      return res.status(409).json({
        success: false,

        conflict: true,

        message:
          "One or more employees already have tasks scheduled at the same time.",

        conflicts,
      });
    }

    // --------------------------------------------------------
    // CREATE TASKS
    // --------------------------------------------------------

    const createdTasks = [];

    /*
     * IMPORTANT:
     *
     * Every task uses ITS OWN:
     *
     * employee_id
     * scheduled_time
     * priority
     *
     * NO automatic +30 minutes.
     */

    for (
      const preparedTask of preparedTasks
    ) {
      const task =
        await Task.create({
          shop_id:
            adminShopId,

          employee_id:
            Number(
              preparedTask.employee_id,
            ),

          order_id:
            resolvedOrderId,

          customer_name:
            resolvedName,

          customer_phone:
            resolvedPhone,

          customer_address:
            resolvedAddress,

          task_type:
            preparedTask.task_type,

          sequence:
            getTaskSequence(
              preparedTask.task_type,
            ),

          scheduled_time:
            preparedTask.scheduled_time,

          priority:
            preparedTask.priority,

          /*
           * Initially everything is pending.
           *
           * After creation we calculate which task
           * is actually ready according to workflow.
           */

          status:
            "pending",

          activated_at:
            null,

          started_at:
            null,

          completed_at:
            null,

          notes:
            notes || null,
        });

      createdTasks.push(task);
    }

    // --------------------------------------------------------
    // DETERMINE FIRST READY TASK
    // --------------------------------------------------------
    //
    // Missing task types do NOT block.
    //
    // Example:
    //
    // pickup = not assigned
    // wash   = assigned
    //
    // Wash can start immediately.
    //
    // But:
    //
    // pickup = assigned and pending
    // wash   = assigned
    //
    // Wash must remain pending.
    //
    // --------------------------------------------------------

    if (
      resolvedOrderId &&
      createdTasks.length > 0
    ) {
      const allTasks =
        await getOrderTasksSorted(
          resolvedOrderId,
          adminShopId,
        );

      /*
       * Find the first newly-created task whose
       * previous ASSIGNED workflow tasks are all completed.
       */

      const sortedCreatedTasks =
        [...createdTasks].sort(
          (a, b) =>
            Number(a.sequence) -
            Number(b.sequence),
        );

      let firstReadyTask = null;

      for (
        const createdTask of
          sortedCreatedTasks
      ) {
        const previousTasks =
          allTasks.filter(
            (existingTask) =>
              Number(
                existingTask.sequence,
              ) <
              Number(
                createdTask.sequence,
              ),
          );

        const previousIncomplete =
          previousTasks.some(
            (previousTask) =>
              previousTask.status !==
              "completed",
          );

        if (
          !previousIncomplete
        ) {
          firstReadyTask =
            createdTask;

          break;
        }
      }

      /*
       * If there is a first ready task,
       * make ONLY that task in_progress.
       */

      if (firstReadyTask) {
        firstReadyTask.status =
          "in_progress";

        firstReadyTask.activated_at =
          new Date();

        firstReadyTask.started_at =
          new Date();

        await firstReadyTask.save();
      }
    } else if (
      createdTasks.length > 0
    ) {
      /*
       * Standalone task without order.
       *
       * First task can start immediately.
       */

      const firstTask =
        createdTasks[0];

      firstTask.status =
        "in_progress";

      firstTask.activated_at =
        new Date();

      firstTask.started_at =
        new Date();

      await firstTask.save();
    }

    // --------------------------------------------------------
    // UPDATE ORDER STATUS
    // --------------------------------------------------------

    if (order) {
      const allTasks =
        await getOrderTasksSorted(
          resolvedOrderId,
          adminShopId,
        );

      const newStatus =
        calculateOrderStatus(
          allTasks,
          order.status,
        );

      const currentRank =
        ORDER_STATUS_RANK[
          order.status
        ] ?? 0;

      const newRank =
        ORDER_STATUS_RANK[
          newStatus
        ] ?? 0;

      /*
       * Never move an order backwards.
       */

      if (
        newStatus &&
        newStatus !==
          "cancelled" &&
        newRank >
          currentRank
      ) {
        order.status =
          newStatus;

        await order.save();
      }
    }

    // --------------------------------------------------------
    // EMPLOYEE NOTIFICATIONS
    // --------------------------------------------------------

    for (
      const task of createdTasks
    ) {
      const employeeId =
        Number(
          task.employee_id,
        );

      const label =
        getTaskLabel(
          task.task_type,
        );

      const employee =
        employees.find(
          (item) =>
            Number(
              item.id,
            ) === employeeId,
        );

      try {
        await createNotification({
          shopId:
            adminShopId,

          employeeId,

          taskId:
            task.id,

          orderId:
            resolvedOrderId,

          title:
            task.status ===
            "in_progress"
              ? "New task ready"
              : "New task assigned",

          message:
            `${label} task assigned for ` +
            `${resolvedName}` +
            `${
              resolvedOrderId
                ? ` (Order #${resolvedOrderId})`
                : ""
            }. ` +
            (
              task.status ===
              "in_progress"
                ? "It is ready to start now."
                : "It will become ready after previous workflow tasks are completed."
            ),

          type:
            "task",

          link:
            `/${shopSlug}/employee/mytask`,
        });
      } catch (
        notificationError
      ) {
        console.error(
          "Employee notification error:",
          notificationError.message,
        );
      }
    }

    // --------------------------------------------------------
    // ADMIN NOTIFICATION
    // --------------------------------------------------------

    try {
      await notifyShopAdmins(
        adminShopId,
        {
          title:
            "Tasks assigned",

          message:
            `${createdTasks.length} task` +
            `${
              createdTasks.length >
              1
                ? "s"
                : ""
            } assigned for ` +
            `${
              resolvedOrderId
                ? `Order #${resolvedOrderId}`
                : resolvedName
            }.`,

          type:
            "task",

          link:
            "/admin/tasks",
        },
      );
    } catch (error) {
      console.error(
        "Admin notification error:",
        error.message,
      );
    }

    // --------------------------------------------------------
    // CUSTOMER NOTIFICATION
    // --------------------------------------------------------

    if (resolvedOrderId) {
      try {
        const orderWithCustomer =
          await Order.findOne({
            where: {
              id:
                resolvedOrderId,

              shop_id:
                adminShopId,
            },

            include: [
              {
                model: Customer,
                as: "customer",
                attributes: [
                  "id",
                  "userId",
                  "name",
                  "shopId",
                ],
                required: false,
              },
            ],
          });

        if (
          orderWithCustomer?.customer
        ) {
          await notifyCustomer(
            orderWithCustomer.customer,
            {
              title:
                "Order task updated",

              message:
                `Tasks have been assigned for ` +
                `your order #${resolvedOrderId}.`,

              type:
                "task",

              orderId:
                resolvedOrderId,

              link:
                `/customer/orders/${resolvedOrderId}`,
            },
          );
        }
      } catch (error) {
        console.error(
          "Customer notification error:",
          error.message,
        );
      }
    }

    // --------------------------------------------------------
    // GET CREATED TASKS WITH RELATIONS
    // --------------------------------------------------------

    const responseTasks =
      await Task.findAll({
        where: {
          id: {
            [Op.in]:
              createdTasks.map(
                (task) =>
                  task.id,
              ),
          },

          shop_id:
            adminShopId,
        },

        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "name",
              "email",
              "designation",
              "shop_id",
            ],
          },

          {
            model: Order,
            as: "order",
            attributes: [
              "id",
              "status",
              "total_amount",
              "shop_id",
            ],
            required: false,
          },
        ],

        order: [
          ["sequence", "ASC"],
        ],
      });

    // --------------------------------------------------------
    // SUCCESS RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        `${responseTasks.length} task` +
        `${
          responseTasks.length >
          1
            ? "s"
            : ""
        } created successfully.`,

      data:
        responseTasks.length === 1
          ? responseTasks[0]
          : responseTasks,
    });
  } catch (error) {
    console.error(
      "Assign Task Error:",
      error,
    );

    // --------------------------------------------------------
    // SEQUELIZE VALIDATION ERROR
    // --------------------------------------------------------

    if (
      error.name ===
      "SequelizeValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.errors?.[0]
            ?.message ||
          error.message,
      });
    }

    // --------------------------------------------------------
    // UNIQUE CONSTRAINT ERROR
    // --------------------------------------------------------

    if (
      error.name ===
      "SequelizeUniqueConstraintError"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This task is already assigned for this order.",
      });
    }

    // --------------------------------------------------------
    // GENERAL ERROR
    // --------------------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — MY TASKS
   GET /api/tasks/my-tasks
============================================================ */

export const getMyTasks = async (req, res) => {
  try {
    const context =
      requireEmployeeContext(req, res);

    if (!context) return;

    const {
      shopId,
      employeeId,
    } = context;

    const {
      status,
      type,
      date,
    } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      if (!isValidTaskType(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task type.",
        });
      }

      where.task_type = type;
    }

    if (date) {
      const start =
        new Date(`${date}T00:00:00`);

      const end =
        new Date(`${date}T23:59:59`);

      where.scheduled_time = {
        [Op.between]: [
          start,
          end,
        ],
      };
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Order,
          as: "order",
          attributes: [
            "id",
            "status",
            "total_amount",
            "pickup_address",
            "delivery_address",
            "shop_id",
          ],
          required: false,
        },
      ],

      order: [
        [
          literal(
            "CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END",
          ),
          "ASC",
        ],
        ["sequence", "ASC"],
        ["scheduled_time", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    const orderCache = new Map();

    const response = [];

    for (const task of tasks) {
      let orderTasks = [];

      if (task.order_id) {
        const key =
          `${shopId}-${task.order_id}`;

        if (!orderCache.has(key)) {
          const allTasks =
            await getOrderTasksSorted(
              task.order_id,
              shopId,
            );

          orderCache.set(
            key,
            allTasks,
          );
        }

        orderTasks =
          orderCache.get(key);
      }

      const data = task.toJSON();

      data.isReady =
        isTaskReady(
          task,
          orderTasks,
        );

      data.blockedBy =
        getBlockedBy(
          task,
          orderTasks,
        );

      response.push(data);
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error(
      "Get My Tasks Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — MY TASK STATS
   GET /api/tasks/my-tasks/stats
============================================================ */

export const getMyTaskStats = async (
  req,
  res,
) => {
  try {
    const context =
      requireEmployeeContext(req, res);

    if (!context) return;

    const {
      shopId,
      employeeId,
    } = context;

    const { date } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (date) {
      const start =
        new Date(`${date}T00:00:00`);

      const end =
        new Date(`${date}T23:59:59`);

      where.scheduled_time = {
        [Op.between]: [
          start,
          end,
        ],
      };
    }

    const [
      total,
      pending,
      inProgress,
      completed,
    ] = await Promise.all([
      Task.count({ where }),

      Task.count({
        where: {
          ...where,
          status: "pending",
        },
      }),

      Task.count({
        where: {
          ...where,
          status: "in_progress",
        },
      }),

      Task.count({
        where: {
          ...where,
          status: "completed",
        },
      }),
    ]);

    return res.status(200).json({
      success: true,

      data: {
        total,
        pending,
        inProgress,
        completed,
      },
    });
  } catch (error) {
    console.error(
      "Get My Task Stats Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — GET SINGLE TASK
   GET /api/tasks/:id
============================================================ */

export const getTaskById = async (
  req,
  res,
) => {
  try {
    const context =
      requireEmployeeContext(req, res);

    if (!context) return;

    const {
      shopId,
      employeeId,
    } = context;

    const taskId =
      Number(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task =
      await Task.findOne({
        where: {
          id: taskId,
          shop_id: shopId,
          employee_id: employeeId,
        },

        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "name",
              "email",
              "designation",
              "shop_id",
            ],
            required: false,
          },

          {
            model: Order,
            as: "order",
            attributes: [
              "id",
              "status",
              "total_amount",
              "shop_id",
              "pickup_address",
              "delivery_address",
              "pickup_date",
              "pickup_time",
              "delivery_date",
              "delivery_note",
            ],
            required: false,

            include: [
              {
                model: Customer,
                as: "customer",
                attributes: [
                  "id",
                  "userId",
                  "name",
                  "email",
                  "phone",
                  "address",
                  "city",
                  "shopId",
                ],
                required: false,
              },
            ],
          },
        ],
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    let allOrderTasks = [];

    if (task.order_id) {
      allOrderTasks =
        await getOrderTasksSorted(
          task.order_id,
          shopId,
        );
    }

    const data = task.toJSON();

    data.isReady =
      isTaskReady(
        task,
        allOrderTasks,
      );

    data.blockedBy =
      getBlockedBy(
        task,
        allOrderTasks,
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get Task By ID Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — UPDATE TASK STATUS
   PATCH /api/tasks/:id/status
============================================================ */

export const updateTaskStatus = async (
  req,
  res,
) => {
  try {
    const context =
      requireEmployeeContext(req, res);

    if (!context) return;

    const {
      shopId,
      employeeId,
    } = context;

    const taskId =
      Number(req.params.id);

    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "in_progress",
      "completed",
    ];

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    /* --------------------------------------------------------
       GET TASK
    -------------------------------------------------------- */

    const task =
      await Task.findOne({
        where: {
          id: taskId,
          shop_id: shopId,
          employee_id: employeeId,
        },

        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "name",
              "shop_id",
            ],
            required: false,
          },

          {
            model: Order,
            as: "order",
            attributes: [
              "id",
              "status",
              "shop_id",
              "delivery_time",
              "customer_id",
            ],
            required: false,

            include: [
              {
                model: Customer,
                as: "customer",
                attributes: [
                  "id",
                  "userId",
                  "name",
                  "shopId",
                ],
                required: false,
              },
            ],
          },
        ],
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    /* --------------------------------------------------------
       COMPLETED TASK CANNOT CHANGE
    -------------------------------------------------------- */

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Completed task cannot be changed.",
      });
    }

    /*
     * Do not allow pending -> pending etc.
     */
    if (task.status === status) {
      return res.status(200).json({
        success: true,
        message:
          "Task already has this status.",
        data: task,
      });
    }

    /* --------------------------------------------------------
       GET ALL ORDER TASKS
    -------------------------------------------------------- */

    let allOrderTasks = [];

    if (task.order_id) {
      allOrderTasks =
        await getOrderTasksSorted(
          task.order_id,
          shopId,
        );
    }

    /* --------------------------------------------------------
       STRICT WORKFLOW VALIDATION
    -------------------------------------------------------- */

    if (
      task.order_id &&
      (
        status === "in_progress" ||
        status === "completed"
      )
    ) {
      const blockingTasks =
        getBlockingTasks(
          task,
          allOrderTasks,
        );

      if (blockingTasks.length) {
        return res.status(400).json({
          success: false,

          message:
            `Cannot start ${getTaskLabel(
              task.task_type,
            )} yet. Complete these first: ` +
            blockingTasks
              .map(
                (item) =>
                  `${getTaskLabel(
                    item.task_type,
                  )} (${item.status})`,
              )
              .join(", "),

          blockedBy:
            blockingTasks.map(
              (item) => ({
                id: item.id,
                task_type:
                  item.task_type,
                label:
                  getTaskLabel(
                    item.task_type,
                  ),
                status:
                  item.status,
                employee_id:
                  item.employee_id,
              }),
            ),
        });
      }
    }

    /* --------------------------------------------------------
       STRICT STATE TRANSITION
    -------------------------------------------------------- */

    /*
     * pending -> completed is NOT allowed.
     *
     * Employee must first start the task.
     */
    if (
      status === "completed" &&
      task.status !== "in_progress"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Start the task before completing it.",
      });
    }

    /* --------------------------------------------------------
       ONE ACTIVE TASK PER EMPLOYEE
    -------------------------------------------------------- */

    if (status === "in_progress") {
      const existingActive =
        await Task.findOne({
          where: {
            shop_id: shopId,
            employee_id: employeeId,
            status: "in_progress",

            id: {
              [Op.ne]: task.id,
            },
          },
        });

      if (existingActive) {
        /*
         * We do NOT silently pause another task.
         *
         * This prevents accidentally changing another order.
         */
        return res.status(409).json({
          success: false,
          message:
            `You already have an active ${getTaskLabel(
              existingActive.task_type,
            )} task. Complete it before starting another task.`,

          activeTask: {
            id: existingActive.id,
            task_type:
              existingActive.task_type,
            status:
              existingActive.status,
            order_id:
              existingActive.order_id,
          },
        });
      }
    }

    /* --------------------------------------------------------
       LIFECYCLE TIMESTAMPS
    -------------------------------------------------------- */

    if (status === "in_progress") {
      task.started_at =
        task.started_at || new Date();

      task.activated_at =
        task.activated_at || new Date();
    }

    if (status === "completed") {
      task.completed_at =
        task.completed_at || new Date();
    }

    task.status = status;

    await task.save();

    /* --------------------------------------------------------
       REFRESH TASKS
    -------------------------------------------------------- */

    if (task.order_id) {
      allOrderTasks =
        await getOrderTasksSorted(
          task.order_id,
          shopId,
        );
    }

    /* --------------------------------------------------------
       NEXT TASK
    -------------------------------------------------------- */

    let nextTask = null;

    if (
      status === "completed" &&
      task.order_id
    ) {
      nextTask =
        findNextTask(
          task.task_type,
          allOrderTasks,
        );
    }

    let nextTaskReady = false;

    if (nextTask) {
      nextTaskReady =
        isTaskReady(
          nextTask,
          allOrderTasks,
        );
    }

    /* --------------------------------------------------------
       UPDATE ORDER STATUS
    -------------------------------------------------------- */

    let freshOrder = null;

    if (task.order_id) {
      freshOrder =
        await Order.findOne({
          where: {
            id: task.order_id,
            shop_id: shopId,
          },

          include: [
            {
              model: Customer,
              as: "customer",
              attributes: [
                "id",
                "userId",
                "name",
                "shopId",
              ],
              required: false,
            },
          ],
        });
    }

    const previousOrderStatus =
      freshOrder?.status ||
      task.order?.status ||
      null;

    if (
      freshOrder &&
      freshOrder.status !== "cancelled"
    ) {
      const calculatedStatus =
        calculateOrderStatus(
          allOrderTasks,
          freshOrder.status,
        );

      const currentRank =
        ORDER_STATUS_RANK[
          freshOrder.status
        ] ?? 0;

      const calculatedRank =
        ORDER_STATUS_RANK[
          calculatedStatus
        ] ?? 0;

      if (
        calculatedStatus &&
        calculatedRank > currentRank
      ) {
        freshOrder.status =
          calculatedStatus;

        if (
          calculatedStatus === "delivered"
        ) {
          freshOrder.delivery_time =
              freshOrder.delivery_time = new Date().toISOString();
        }

        await freshOrder.save();
      }
    }

    /* --------------------------------------------------------
       ADMIN NOTIFICATION
    -------------------------------------------------------- */

    const taskLabel =
      getTaskLabel(
        task.task_type,
      );

    const employeeName =
      task.employee?.name ||
      "An employee";

    const actionWord =
      status === "completed"
        ? "completed"
        : status === "in_progress"
          ? "started"
          : "updated";

    try {
      await notifyShopAdmins(
        shopId,
        {
          title:
            "Task update from employee",

          message:
            `${employeeName} ${actionWord} ` +
            `the ${taskLabel} task` +
            `${
              task.order_id
                ? ` for order #${task.order_id}`
                : ""
            }.`,

          type: "task",
          link: "/admin/tasks",
        },
      );
    } catch (error) {
      console.error(
        "Admin task notification error:",
        error.message,
      );
    }

    /* --------------------------------------------------------
       NEXT EMPLOYEE NOTIFICATION
    -------------------------------------------------------- */

    if (
      status === "completed" &&
      nextTask &&
      nextTask.employee_id &&
      Number(nextTask.employee_id) !==
        employeeId
    ) {
      try {
        await createNotification({
          shopId,

          employeeId:
            Number(nextTask.employee_id),

          taskId: nextTask.id,

          orderId:
            task.order_id,

          title:
            `${taskLabel} completed — ` +
            `${getTaskLabel(
              nextTask.task_type,
            )} is ready`,

          message:
            `${taskLabel} completed by ` +
            `${employeeName} for order ` +
            `#${task.order_id}. ` +
            `Your ${getTaskLabel(
              nextTask.task_type,
            )} task is now ready to start.`,

          type: "task",

          link:
            "/employee/my-tasks",
        });
      } catch (error) {
        console.error(
          "Next employee notification error:",
          error.message,
        );
      }
    }

    /* --------------------------------------------------------
       CUSTOMER NOTIFICATION
    -------------------------------------------------------- */

    const effectiveOrder =
      freshOrder || task.order;

    if (
      effectiveOrder?.customer
    ) {
      const currentOrderStatus =
        effectiveOrder.status;

      const orderId =
        effectiveOrder.id;

      try {
        if (
          task.task_type === "delivery" &&
          status === "completed"
        ) {
          await notifyCustomer(
            effectiveOrder.customer,
            {
              title:
                "Order delivered",

              message:
                `Your order #${orderId} ` +
                `has been delivered successfully.`,

              type: "order",

              orderId,

              link:
                "/customer/reviews",
            },
          );
        } else if (
          previousOrderStatus !==
          currentOrderStatus
        ) {
          await notifyCustomer(
            effectiveOrder.customer,
            {
              title:
                "Order updated",

              message:
                `Your order #${orderId} ` +
                `is now ${getStatusLabel(
                  currentOrderStatus,
                )}.`,

              type: "order",

              orderId,

              link:
                `/customer/orders/${orderId}`,
            },
          );
        }
      } catch (error) {
        console.error(
          "Customer task notification error:",
          error.message,
        );
      }
    }

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return res.status(200).json({
      success: true,

      message:
        "Task status updated successfully.",

      data: {
        task,

        nextTask,

        nextTaskReady,

        order: freshOrder,

        /*
         * Useful for frontend/customer tracking.
         */
        workflow: allOrderTasks.map(
          (item) => ({
            id: item.id,
            task_type:
              item.task_type,
            label:
              getTaskLabel(
                item.task_type,
              ),
            sequence:
              item.sequence,
            status:
              item.status,
            employee_id:
              item.employee_id,
            isReady:
              isTaskReady(
                item,
                allOrderTasks,
              ),
            blockedBy:
              getBlockedBy(
                item,
                allOrderTasks,
              ),
          }),
        ),
      },
    });
  } catch (error) {
    console.error(
      "Update Task Status Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — UPDATE NOTES
   PATCH /api/tasks/:id/notes
============================================================ */

export const updateTaskNotes = async (
  req,
  res,
) => {
  try {
    const context =
      requireEmployeeContext(req, res);

    if (!context) return;

    const {
      shopId,
      employeeId,
    } = context;

    const task =
      await Task.findOne({
        where: {
          id: Number(req.params.id),
          shop_id: shopId,
          employee_id: employeeId,
        },
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    task.notes =
      req.body.notes ?? task.notes;

    await task.save();

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(
      "Update Task Notes Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — GET ORDER TASKS
   GET /api/tasks/order/:orderId

   Also useful for customer tracking if your customer
   controller proxies/calls this logic.
============================================================ */

export const getOrderTasks = async (
  req,
  res,
) => {
  try {
    const shopId =
      requireShop(req, res);

    if (!shopId) return;

    const orderId =
      Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order =
      await Order.findOne({
        where: {
          id: orderId,
          shop_id: shopId,
        },

        include: [
          {
            model: Customer,
            as: "customer",
            attributes: [
              "id",
              "userId",
              "name",
              "phone",
              "address",
              "city",
              "shopId",
            ],
            required: false,
          },
        ],
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const tasks =
      await Task.findAll({
        where: {
          order_id: orderId,
          shop_id: shopId,
        },

        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "name",
              "email",
              "designation",
              "shop_id",
            ],
            required: false,
          },
        ],

        order: [
          ["sequence", "ASC"],
          ["id", "ASC"],
        ],
      });

    const response =
      tasks.map((task) => {
        const data =
          task.toJSON();

        data.isReady =
          isTaskReady(
            task,
            tasks,
          );

        data.blockedBy =
          getBlockedBy(
            task,
            tasks,
          );

        data.label =
          getTaskLabel(
            task.task_type,
          );

        return data;
      });

    return res.status(200).json({
      success: true,

      data: response,

      order: {
        id: order.id,
        status: order.status,
        customer: order.customer,
      },

      /*
       * Easy for customer tracking UI.
       */
      workflow: response,
    });
  } catch (error) {
    console.error(
      "Get Order Tasks Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — REASSIGN TASK
   PATCH /api/tasks/:id/reassign
============================================================ */

export const reassignTask = async (req, res) => {
  try {
    const shopId = requireShop(req, res);

    if (!shopId) return;

    const taskId = Number(req.params.id);
    const newEmployeeId = Number(req.body.employee_id);

    // false = check conflict
    // true = admin explicitly clicked "Assign Anyway"
    const force = req.body.force === true;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!newEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "employee_id is required.",
      });
    }

    // --------------------------------------------------------
    // SHOP
    // --------------------------------------------------------

    const shop = await Shop.findByPk(shopId, {
      attributes: ["id", "slug"],
    });

    if (!shop?.slug) {
      return res.status(403).json({
        success: false,
        message: "Shop slug is missing.",
      });
    }

    // --------------------------------------------------------
    // FIND TASK
    // --------------------------------------------------------

    const task = await Task.findOne({
      where: {
        id: taskId,
        shop_id: shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "id",
            "name",
            "shop_id",
          ],
          required: false,
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // --------------------------------------------------------
    // COMPLETED TASK CANNOT BE REASSIGNED
    // --------------------------------------------------------

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot reassign a completed task.",
      });
    }

    // --------------------------------------------------------
    // FIND NEW EMPLOYEE
    // --------------------------------------------------------

    const newEmployee = await Employee.findOne({
      where: {
        id: newEmployeeId,
        shop_id: shopId,
        status: "active",
      },
    });

    if (!newEmployee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found in your shop or employee is inactive.",
      });
    }

    // --------------------------------------------------------
    // SAME EMPLOYEE CHECK
    // --------------------------------------------------------

    if (
      Number(task.employee_id) === newEmployeeId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task is already assigned to this employee.",
      });
    }

    // --------------------------------------------------------
    // DUPLICATE TASK TYPE CHECK
    // --------------------------------------------------------

    if (task.order_id) {
      const duplicate = await Task.findOne({
        where: {
          shop_id: shopId,
          order_id: task.order_id,
          task_type: task.task_type,

          id: {
            [Op.ne]: taskId,
          },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            `Another ${getTaskLabel(
              task.task_type,
            )} task already exists for this order.`,
        });
      }
    }

    // --------------------------------------------------------
    // SCHEDULE CONFLICT CHECK
    // --------------------------------------------------------
    //
    // We DO NOT change the existing task's:
    //
    // scheduled_time
    // priority
    // sequence
    // status
    //
    // Only employee_id will change.
    //
    // If the new employee already has another task at
    // exactly the same scheduled time, return a WARNING.
    //
    // Admin can then:
    //
    // 1. Choose Another Employee
    // 2. Assign Anyway
    //
    // --------------------------------------------------------

    const conflictingTasks = await Task.findAll({
      where: {
        shop_id: shopId,

        employee_id: newEmployeeId,

        scheduled_time: task.scheduled_time,

        // Do not compare the task with itself
        id: {
          [Op.ne]: taskId,
        },
      },

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "id",
            "name",
          ],
          required: false,
        },
      ],

      order: [
        ["scheduled_time", "ASC"],
      ],
    });

    // --------------------------------------------------------
    // CONFLICT FOUND
    // --------------------------------------------------------

    if (
      conflictingTasks.length > 0 &&
      !force
    ) {
      return res.status(409).json({
        success: false,

        conflict: true,

        message:
          `${newEmployee.name} already has ` +
          `${
            conflictingTasks.length === 1
              ? "another task"
              : "other tasks"
          } scheduled at the same time.`,

        task: {
          id: task.id,

          task_type:
            task.task_type,

          task_label:
            getTaskLabel(
              task.task_type,
            ),

          order_id:
            task.order_id,

          scheduled_time:
            task.scheduled_time,

          priority:
            task.priority,

          status:
            task.status,
        },

        employee: {
          id:
            newEmployee.id,

          name:
            newEmployee.name,
        },

        conflicts:
          conflictingTasks.map(
            (conflictTask) => ({
              id:
                conflictTask.id,

              task_type:
                conflictTask.task_type,

              task_label:
                getTaskLabel(
                  conflictTask.task_type,
                ),

              order_id:
                conflictTask.order_id,

              scheduled_time:
                conflictTask.scheduled_time,

              priority:
                conflictTask.priority,

              status:
                conflictTask.status,
            }),
          ),
      });
    }

    // --------------------------------------------------------
    // REASSIGN TASK
    // --------------------------------------------------------

    const oldEmployeeName =
      task.employee?.name ||
      "Unassigned";

    /*
     * IMPORTANT:
     *
     * Only employee_id is changed.
     *
     * scheduled_time remains unchanged.
     * priority remains unchanged.
     * sequence remains unchanged.
     * started_at remains unchanged.
     * completed_at remains unchanged.
     */

    task.employee_id = newEmployeeId;

    // --------------------------------------------------------
    // WORKFLOW DEPENDENCY CHECK
    // --------------------------------------------------------

    /*
     * Reassigning an employee must NEVER bypass
     * workflow dependency.
     *
     * Example:
     *
     * Pickup = pending
     * Wash   = in_progress
     *
     * If Wash is reassigned while Pickup is not complete,
     * Wash must remain pending.
     */

    if (task.order_id) {
      const allTasks =
        await getOrderTasksSorted(
          task.order_id,
          shopId,
        );

      if (
        task.status === "in_progress" &&
        !isTaskReady(
          task,
          allTasks,
        )
      ) {
        task.status = "pending";
      }
    }

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    await task.save();

    // --------------------------------------------------------
    // NEW EMPLOYEE NOTIFICATION
    // --------------------------------------------------------

    try {
      await createNotification({
        shopId,

        employeeId:
          newEmployeeId,

        taskId:
          task.id,

        orderId:
          task.order_id,

        title:
          "Task reassigned to you",

        message:
          `${getTaskLabel(
            task.task_type,
          )} task` +
          `${
            task.order_id
              ? ` for order #${task.order_id}`
              : ""
          } has been reassigned to you from ` +
          `${oldEmployeeName}.`,

        type: "task",

        link:
          `/${shop.slug}/employee/mytask`,
      });
    } catch (error) {
      console.error(
        "Reassign notification error:",
        error.message,
      );
    }

    // --------------------------------------------------------
    // ADMIN NOTIFICATION
    // --------------------------------------------------------

    try {
      await notifyShopAdmins(
        shopId,
        {
          title:
            "Task reassigned",

          message:
            `${getTaskLabel(
              task.task_type,
            )} task` +
            `${
              task.order_id
                ? ` for order #${task.order_id}`
                : ""
            } reassigned from ` +
            `${oldEmployeeName} to ` +
            `${newEmployee.name}.`,

          type: "task",

          link:
            "/admin/tasks",
        },
      );
    } catch (error) {
      console.error(
        "Admin reassign notification error:",
        error.message,
      );
    }

    // --------------------------------------------------------
    // GET UPDATED TASK
    // --------------------------------------------------------

    const updated = await Task.findOne({
      where: {
        id: taskId,
        shop_id: shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: [
            "id",
            "name",
            "email",
            "designation",
            "shop_id",
          ],
        },

        {
          model: Order,
          as: "order",
          attributes: [
            "id",
            "status",
            "shop_id",
          ],
          required: false,
        },
      ],
    });

    // --------------------------------------------------------
    // SUCCESS RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        `${getTaskLabel(
          task.task_type,
        )} reassigned to ` +
        `${newEmployee.name}.`,

      data: updated,
    });
  } catch (error) {
    console.error(
      "Reassign Task Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — TASK HISTORY
   GET /api/tasks/history
============================================================ */

export const getAdminTaskHistory = async (
  req,
  res,
) => {
  try {
    const shopId =
      requireShop(req, res);

    if (!shopId) return;

    const {
      employee_id,
      customer,
      order_id,
      task_type,
      status,
      startDate,
      endDate,
    } = req.query;

    const where = {
      shop_id: shopId,
    };

    if (employee_id) {
      where.employee_id =
        Number(employee_id);
    }

    if (order_id) {
      where.order_id =
        Number(order_id);
    }

    if (task_type) {
      if (!isValidTaskType(task_type)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid task_type.",
        });
      }

      where.task_type =
        task_type;
    }

    if (status) {
      where.status = status;
    }

    if (
      customer &&
      String(customer).trim()
    ) {
      where.customer_name = {
        [Op.like]:
          `%${String(
            customer,
          ).trim()}%`,
      };
    }

    if (startDate && endDate) {
      where.scheduled_time = {
        [Op.between]: [
          new Date(
            `${startDate}T00:00:00`,
          ),
          new Date(
            `${endDate}T23:59:59`,
          ),
        ],
      };
    } else if (startDate) {
      where.scheduled_time = {
        [Op.gte]:
          new Date(
            `${startDate}T00:00:00`,
          ),
      };
    } else if (endDate) {
      where.scheduled_time = {
        [Op.lte]:
          new Date(
            `${endDate}T23:59:59`,
          ),
      };
    }

    const tasks =
      await Task.findAll({
        where,

        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "name",
              "email",
              "designation",
              "shop_id",
            ],
            required: false,
          },

          {
            model: Order,
            as: "order",
            attributes: [
              "id",
              "status",
              "total_amount",
              "shop_id",
            ],
            required: false,

            include: [
              {
                model: Customer,
                as: "customer",
                attributes: [
                  "id",
                  "name",
                  "phone",
                  "shopId",
                ],
                required: false,
              },
            ],
          },
        ],

        order: [
          ["sequence", "ASC"],
          ["createdAt", "DESC"],
        ],
      });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error(
      "Get Admin Task History Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — TASK HISTORY
   GET /api/tasks/my-history
============================================================ */

export const getEmployeeTaskHistory = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);
    if (!context) return;

    const { shopId, employeeId } = context;

    const tasks = await Task.findAll({
      where: {
        shop_id: shopId,
        employee_id: employeeId,
        status: "completed",
      },
      order: [
        ["completed_at", "DESC"],
        ["id", "DESC"],
      ],
      include: [
        {
          model: Order,
          as: "order",
          attributes: [
            "id",
            "status",
            "total_amount",
            "pickup_address",
            "delivery_address",
          ],
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "name", "phone", "email"],
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("getEmployeeTaskHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee task history.",
      error: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — CUSTOMER TASKS
   GET /api/tasks/my-customer-tasks
============================================================ */

export const getMyCustomerTasks = async (
  req,
  res,
) => {
  try {
    const context =
      requireEmployeeContext(req, res);

    if (!context) return;

    const {
      shopId,
      employeeId,
    } = context;

    const tasks =
      await Task.findAll({
        where: {
          shop_id: shopId,
          employee_id: employeeId,
        },

        include: [
          {
            model: Order,
            as: "order",
            attributes: [
              "id",
              "status",
              "total_amount",
              "shop_id",
            ],
            required: false,

            include: [
              {
                model: Customer,
                as: "customer",
                attributes: [
                  "id",
                  "name",
                  "phone",
                  "address",
                  "city",
                  "shopId",
                ],
                required: false,
              },
            ],
          },
        ],

        order: [
          ["sequence", "ASC"],
          ["createdAt", "DESC"],
        ],
      });

    const grouped = {};

    for (const task of tasks) {
      const key =
        task.customer_name ||
        task.order?.customer?.name ||
        "Unknown";

      if (!grouped[key]) {
        grouped[key] = {
          customerName: key,

          customerPhone:
            task.customer_phone ||
            task.order?.customer?.phone ||
            null,

          customerAddress:
            task.customer_address ||
            task.order?.customer?.address ||
            null,

          customerCity:
            task.order?.customer?.city ||
            null,

          tasks: [],
        };
      }

      grouped[key].tasks.push(
        task,
      );
    }

    return res.status(200).json({
      success: true,
      data: Object.values(
        grouped,
      ),
    });
  } catch (error) {
    console.error(
      "Get My Customer Tasks Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

