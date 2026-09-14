// import { Op, literal } from "sequelize";

// import Task from "../models/Tasks.js";
// import Employee from "../models/Employee.js";
// import Order from "../models/Order.js";
// import Customer from "../models/Customer.js";
// import Shop from "../models/Shop.js";

// import {
//   createNotification,
//   notifyShopAdmins,
//   notifyCustomer,
// } from "./notification.controller.js";

// /* ============================================================
//    CONSTANTS
// ============================================================ */

// const TASK_TYPES = [
//   "pickup",
//   "wash",
//   "dry",
//   "iron",
//   "pack",
//   "delivery",
// ];

// const TASK_SEQUENCE = [
//   "pickup",
//   "wash",
//   "dry",
//   "iron",
//   "pack",
//   "delivery",
// ];

// const TASK_SEQUENCE_MAP = {
//   pickup: 1,
//   wash: 2,
//   dry: 3,
//   iron: 4,
//   pack: 5,
//   delivery: 6,
// };

// const TASK_TYPE_LABELS = {
//   pickup: "Pickup",
//   wash: "Wash",
//   dry: "Dry Cleaning",
//   iron: "Ironing",
//   pack: "Packing",
//   delivery: "Delivery",
// };

// const ORDER_STATUS_LABELS = {
//   pending: "Pending",
//   picked_up: "Picked Up",
//   processing: "Processing",
//   ready_for_delivery: "Ready for Delivery",
//   out_for_delivery: "Out for Delivery",
//   delivered: "Delivered",
//   cancelled: "Cancelled",
// };

// const ORDER_STATUS_RANK = {
//   pending: 0,
//   picked_up: 1,
//   processing: 2,
//   ready_for_delivery: 3,
//   out_for_delivery: 4,
//   delivered: 5,
//   cancelled: 6,
// };

// /* ============================================================
//    BASIC HELPERS
// ============================================================ */

// function isValidTaskType(type) {
//   return TASK_TYPES.includes(type);
// }

// function getTaskSequence(taskType) {
//   return TASK_SEQUENCE_MAP[taskType] || 0;
// }

// function getTaskLabel(taskType) {
//   return TASK_TYPE_LABELS[taskType] || taskType;
// }

// /* ============================================================
//    SHOP / TENANT HELPERS
// ============================================================ */

// function getShopId(req) {
//   const shopId = req.user?.shopId;

//   if (!shopId) return null;

//   const parsed = Number(shopId);

//   return Number.isFinite(parsed) ? parsed : null;
// }

// function getEmployeeId(req) {
//   if (req.user?.role !== "employee") return null;

//   const employeeId = Number(req.user?.id);

//   return Number.isFinite(employeeId) ? employeeId : null;
// }

// function requireEmployeeContext(req, res) {
//   const shopId = getShopId(req);
//   const employeeId = getEmployeeId(req);

//   if (!shopId || !employeeId) {
//     res.status(403).json({
//       success: false,
//       message: "Employee shop context is missing.",
//     });

//     return null;
//   }

//   return {
//     shopId,
//     employeeId,
//   };
// }

// /* ============================================================
//    ADMIN TENANT SCOPE
// ============================================================ */

// function buildTaskWhereForAdmin(req) {
//   const where = {};

//   if (req.user?.shopId) {
//     where["$employee.shop_id$"] = {
//       [Op.or]: [req.user.shopId, null],
//     };
//   }

//   return where;
// }

// /* ============================================================
//    ORDER STATUS
// ============================================================ */

// function impliedOrderStatus(taskType, taskStatus) {
//   if (taskStatus === "pending") {
//     return null;
//   }

//   switch (taskType) {
//     case "pickup":
//       return taskStatus === "completed"
//         ? "processing"
//         : "picked_up";

//     case "wash":
//     case "dry":
//     case "iron":
//     case "pack":
//       return taskStatus === "completed"
//         ? "ready_for_delivery"
//         : "processing";

//     case "delivery":
//       return taskStatus === "completed"
//         ? "delivered"
//         : "out_for_delivery";

//     default:
//       return null;
//   }
// }

// /* ============================================================
//    ORDER TASK HELPERS
// ============================================================ */

// /**
//  * Get every task belonging to an order.
//  *
//  * IMPORTANT:
//  * shop_id is also checked so one shop cannot accidentally use
//  * another shop's order tasks for workflow validation.
//  */
// async function getOrderTasksSorted(orderId, shopId = null) {
//   const where = {
//     order_id: orderId,
//   };

//   if (shopId) {
//     where.shop_id = shopId;
//   }

//   return Task.findAll({
//     where,
//     order: [
//       ["sequence", "ASC"],
//       ["createdAt", "ASC"],
//       ["id", "ASC"],
//     ],
//   });
// }

// /**
//  * When an order has multiple instances of the same task type,
//  * only the latest instance is used for sequence validation.
//  *
//  * Example:
//  *
//  * pickup #1 completed
//  * pickup #2 pending
//  *
//  * Latest pickup (#2) is considered.
//  */
// function latestTasksByType(allOrderTasks = []) {
//   const map = {};

//   for (const task of allOrderTasks) {
//     if (
//       !map[task.task_type] ||
//       Number(task.id) > Number(map[task.task_type].id)
//     ) {
//       map[task.task_type] = task;
//     }
//   }

//   return map;
// }

// /**
//  * Previous TASK TYPES that DO NOT EXIST are ignored.
//  *
//  * Example:
//  *
//  * pickup = completed
//  * wash   = completed
//  * dry    = NOT ASSIGNED
//  * iron   = pending
//  *
//  * Iron is allowed from dependency perspective because dry does not exist.
//  */
// function previousTasksCompleted(taskType, allOrderTasks = []) {
//   const currentIndex = TASK_SEQUENCE.indexOf(taskType);

//   if (currentIndex === -1) {
//     return false;
//   }

//   const latest = latestTasksByType(allOrderTasks);

//   return TASK_SEQUENCE
//     .slice(0, currentIndex)
//     .every((type) => {
//       if (!latest[type]) {
//         return true;
//       }

//       return latest[type].status === "completed";
//     });
// }

// /**
//  * Returns the actual incomplete previous assigned tasks.
//  */
// function getBlockingTasks(taskType, allOrderTasks = []) {
//   const currentSequence = getTaskSequence(taskType);
//   const latest = latestTasksByType(allOrderTasks);

//   return TASK_SEQUENCE
//     .filter((type) => getTaskSequence(type) < currentSequence)
//     .map((type) => latest[type])
//     .filter(Boolean)
//     .filter((task) => task.status !== "completed");
// }

// /**
//  * Find the next assigned task in workflow.
//  *
//  * IMPORTANT:
//  * This does NOT auto-start anything.
//  */
// function findNextTask(currentType, allOrderTasks = []) {
//   const currentSequence = getTaskSequence(currentType);
//   const latest = latestTasksByType(allOrderTasks);

//   for (const type of TASK_SEQUENCE) {
//     if (getTaskSequence(type) <= currentSequence) {
//       continue;
//     }

//     if (latest[type] && latest[type].status !== "completed") {
//       return latest[type];
//     }
//   }

//   return null;
// }

// /* ============================================================
//    SCHEDULE HELPERS
// ============================================================ */

// /**
//  * scheduled_time is the EARLIEST allowed start time.
//  *
//  * Before scheduled time:
//  *   cannot start.
//  *
//  * At / after scheduled time:
//  *   can start if workflow dependencies are complete.
//  *
//  * Being late does NOT invalidate the task.
//  */
// function isTaskScheduleReached(task, now = new Date()) {
//   if (!task?.scheduled_time) {
//     return true;
//   }

//   const scheduled = new Date(task.scheduled_time);

//   if (Number.isNaN(scheduled.getTime())) {
//     return false;
//   }

//   return scheduled.getTime() <= now.getTime();
// }

// /**
//  * A task is late when:
//  *
//  * scheduled_time < now
//  * AND
//  * task is not completed.
//  */
// function isTaskLate(task, now = new Date()) {
//   if (!task?.scheduled_time) {
//     return false;
//   }

//   if (task.status === "completed") {
//     return false;
//   }

//   const scheduled = new Date(task.scheduled_time);

//   if (Number.isNaN(scheduled.getTime())) {
//     return false;
//   }

//   return scheduled.getTime() < now.getTime();
// }

// /**
//  * COMPLETE readiness rule.
//  *
//  * A task is ready only when BOTH are true:
//  *
//  * 1. Previous assigned workflow tasks are completed.
//  * 2. Its own scheduled time has arrived.
//  *
//  * Urgent priority NEVER bypasses these rules.
//  */
// function isTaskReady(
//   task,
//   allOrderTasks = [],
//   now = new Date()
// ) {
//   if (!task) {
//     return false;
//   }

//   if (task.status === "completed") {
//     return false;
//   }

//   const workflowReady = previousTasksCompleted(
//     task.task_type,
//     allOrderTasks
//   );

//   if (!workflowReady) {
//     return false;
//   }

//   return isTaskScheduleReached(task, now);
// }

// /**
//  * Gives frontend a useful reason why task is not ready.
//  */
// function getTaskWaitingReason(
//   task,
//   allOrderTasks = [],
//   now = new Date()
// ) {
//   if (!task) {
//     return null;
//   }

//   const blockingTasks = getBlockingTasks(
//     task.task_type,
//     allOrderTasks
//   );

//   if (blockingTasks.length > 0) {
//     return {
//       type: "workflow",
//       tasks: blockingTasks.map((item) => ({
//         id: item.id,
//         task_type: item.task_type,
//         label: getTaskLabel(item.task_type),
//         status: item.status,
//         employee_id: item.employee_id,
//       })),
//     };
//   }

//   if (!isTaskScheduleReached(task, now)) {
//     const scheduled = new Date(task.scheduled_time);

//     return {
//       type: "schedule",
//       scheduled_time: task.scheduled_time,
//       scheduled_label: scheduled.toLocaleString(),
//     };
//   }

//   return null;
// }

// /**
//  * Add computed workflow/schedule fields to task response.
//  */
// function serializeTaskReadiness(
//   task,
//   allOrderTasks = [],
//   now = new Date()
// ) {
//   const data =
//     typeof task.toJSON === "function"
//       ? task.toJSON()
//       : { ...task };

//   const blockingTasks = getBlockingTasks(
//     task.task_type,
//     allOrderTasks
//   );

//   const scheduleReached = isTaskScheduleReached(
//     task,
//     now
//   );

//   const late = isTaskLate(task, now);

//   const ready =
//     task.status !== "completed" &&
//     blockingTasks.length === 0 &&
//     scheduleReached;

//   data.isReady = ready;
//   data.scheduleReached = scheduleReached;
//   data.isLate = late;

//   data.workflowReady = blockingTasks.length === 0;

//   data.blockingTasks = blockingTasks.map((item) => ({
//     id: item.id,
//     task_type: item.task_type,
//     label: getTaskLabel(item.task_type),
//     status: item.status,
//     employee_id: item.employee_id,
//   }));

//   const waitingReason = getTaskWaitingReason(
//     task,
//     allOrderTasks,
//     now
//   );

//   data.waitingReason = waitingReason;

//   if (waitingReason?.type === "workflow") {
//     data.waitingFor = waitingReason.tasks.map(
//       (item) => item.label
//     );
//   } else {
//     data.waitingFor = [];
//   }

//   return data;
// }

// /* ============================================================
//    ASSIGN MULTIPLE TASKS
// ============================================================ */

// async function assignMultipleTasks(
//   req,
//   res,
//   {
//     order_id,
//     customer_name,
//     customer_phone,
//     customer_address,
//     notes,
//     tasks,
//   }
// ) {
//   if (!Array.isArray(tasks) || tasks.length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: "At least one task is required.",
//     });
//   }

//   /* ----------------------------------------------------------
//      VALIDATE ALL ROWS BEFORE CREATING ANY TASK
//   ---------------------------------------------------------- */

//   for (const t of tasks) {
//     if (
//       !t.task_type ||
//       !TASK_TYPES.includes(t.task_type)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid task_type: ${t.task_type}`,
//       });
//     }

//     if (!t.employee_id || !t.scheduled_time) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `employee_id and scheduled_time are required for ${
//             TASK_TYPE_LABELS[t.task_type] || t.task_type
//           }`,
//       });
//     }

//     const scheduled = new Date(t.scheduled_time);

//     if (Number.isNaN(scheduled.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `Invalid scheduled_time for ${
//             TASK_TYPE_LABELS[t.task_type] || t.task_type
//           }.`,
//       });
//     }

//     /**
//      * Admin cannot create a brand-new task in the past.
//      *
//      * Once created, however, the employee is allowed to
//      * complete it late.
//      */
//     if (scheduled.getTime() < Date.now()) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `Scheduled time for ${
//             TASK_TYPE_LABELS[t.task_type] || t.task_type
//           } cannot be in the past.`,
//       });
//     }

//     if (
//       t.priority &&
//       !["normal", "urgent"].includes(t.priority)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `Invalid priority for ${
//             TASK_TYPE_LABELS[t.task_type] || t.task_type
//           }.`,
//       });
//     }
//   }

//   const adminShopId = getShopId(req);

//   let resolvedOrderId = order_id
//     ? Number(order_id)
//     : null;

//   let resolvedName = String(
//     customer_name || ""
//   ).trim();

//   let resolvedPhone =
//     String(customer_phone || "").trim() || null;

//   let resolvedAddress =
//     String(customer_address || "").trim() || null;

//   let order = null;

//   /* ----------------------------------------------------------
//      ORDER
//   ---------------------------------------------------------- */

//   if (resolvedOrderId) {
//     const orderWhere = {
//       id: resolvedOrderId,
//     };

//     if (adminShopId) {
//       orderWhere.shop_id = adminShopId;
//     }

//     order = await Order.findOne({
//       where: orderWhere,
//       include: [
//         {
//           model: Customer,
//           as: "customer",
//           attributes: [
//             "name",
//             "phone",
//             "address",
//             "city",
//           ],
//           required: false,
//         },
//       ],
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found in your shop.",
//       });
//     }

//     if (
//       order.status === "delivered" ||
//       order.status === "cancelled"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `Cannot assign tasks to a ${order.status} order.`,
//       });
//     }

//     resolvedOrderId = order.id;

//     /* --------------------------------------------------------
//        DUPLICATE CHECK
//        Same Order + Same Task + Same Employee = BLOCKED
//     -------------------------------------------------------- */

//     const existingTasks = await Task.findAll({
//       where: {
//         order_id: resolvedOrderId,
//         ...(adminShopId
//           ? { shop_id: adminShopId }
//           : {}),
//       },
//       attributes: [
//         "id",
//         "task_type",
//         "employee_id",
//       ],
//     });

//     const duplicateRows = tasks.filter((t) =>
//       existingTasks.some(
//         (existing) =>
//           existing.task_type === t.task_type &&
//           Number(existing.employee_id) ===
//             Number(t.employee_id)
//       )
//     );

//     if (duplicateRows.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `This task is already assigned to this employee: ${
//             duplicateRows
//               .map(
//                 (t) =>
//                   TASK_TYPE_LABELS[t.task_type] ||
//                   t.task_type
//               )
//               .join(", ")
//           }. Assign a different task type or employee.`,
//       });
//     }

//     /**
//      * Order.employee_id is only the primary/owner employee.
//      *
//      * It does NOT mean every task must belong to this employee.
//      */
//     if (!order.employee_id) {
//       order.employee_id = Number(
//         tasks[0].employee_id
//       );

//       await order.save();
//     }

//     if (!resolvedName) {
//       resolvedName =
//         order.customer?.name ||
//         String(
//           order.pickup_address || ""
//         ).trim() ||
//         `Order #${order.id}`;
//     }

//     if (!resolvedPhone) {
//       resolvedPhone =
//         order.customer?.phone || null;
//     }

//     if (!resolvedAddress) {
//       resolvedAddress =
//         String(
//           order.customer
//             ? [
//                 order.customer.address,
//                 order.customer.city,
//               ]
//                 .filter(Boolean)
//                 .join(", ")
//             : ""
//         ).trim() ||
//         order.pickup_address ||
//         null;
//     }
//   }

//   /* ----------------------------------------------------------
//      NON-ORDER TASK CUSTOMER
//   ---------------------------------------------------------- */

//   if (!resolvedName) {
//     return res.status(400).json({
//       success: false,
//       message:
//         "customer_name is required (or link the task to an order).",
//     });
//   }

//   /* ----------------------------------------------------------
//      CREATE TASKS
//   ---------------------------------------------------------- */

//   const createdTasks = [];

//   for (const t of tasks) {
//     const employee = await Employee.findByPk(
//       Number(t.employee_id)
//     );

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message:
//           `Employee not found for ${
//             TASK_TYPE_LABELS[t.task_type] ||
//             t.task_type
//           }`,
//       });
//     }

//     if (
//       adminShopId &&
//       employee.shop_id &&
//       Number(employee.shop_id) !==
//         Number(adminShopId)
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You can only assign tasks to employees of your shop.",
//       });
//     }

//     const taskShopId =
//       adminShopId || employee.shop_id;

//     if (!taskShopId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Task shop could not be determined.",
//       });
//     }

//     const task = await Task.create({
//       shop_id: Number(taskShopId),
//       order_id: resolvedOrderId,
//       employee_id: Number(t.employee_id),

//       customer_name: resolvedName,
//       customer_phone: resolvedPhone,
//       customer_address: resolvedAddress,

//       task_type: t.task_type,

//       sequence:
//         TASK_SEQUENCE_MAP[t.task_type] || 1,

//       scheduled_time: t.scheduled_time,

//       priority:
//         t.priority || "normal",

//       status: "pending",

//       activated_at: null,
//       started_at: null,
//       completed_at: null,

//       notes: notes || null,
//     });

//     const created = await Task.findByPk(
//       task.id,
//       {
//         include: [
//           {
//             model: Employee,
//             as: "employee",
//             attributes: [
//               "id",
//               "name",
//               "email",
//               "designation",
//             ],
//           },
//           {
//             model: Order,
//             as: "order",
//             attributes: [
//               "id",
//               "status",
//               "total_amount",
//             ],
//             required: false,
//           },
//         ],
//       }
//     );

//     createdTasks.push(created);

//     /* --------------------------------------------------------
//        EMPLOYEE NOTIFICATION
//     -------------------------------------------------------- */

//     const scheduledLabel =
//       new Date(
//         t.scheduled_time
//       ).toLocaleString([], {
//         day: "2-digit",
//         month: "short",
//         hour: "2-digit",
//         minute: "2-digit",
//       });

//     await createNotification({
//       employeeId: Number(
//         t.employee_id
//       ),
//       orderId: resolvedOrderId,
//       title: "New task assigned",
//       message:
//         `${getTaskLabel(t.task_type)} task for ${
//           resolvedName
//         }${
//           resolvedOrderId
//             ? ` (order #${resolvedOrderId})`
//             : ""
//         } is scheduled for ${scheduledLabel}.`,
//       type: "task",
//       link: "/employee/mytask",
//     });
//   }

//   /* ----------------------------------------------------------
//      CUSTOMER NOTIFICATION
//   ---------------------------------------------------------- */

//   if (resolvedOrderId) {
//     try {
//       const orderWithCustomer =
//         await Order.findByPk(
//           resolvedOrderId,
//           {
//             include: [
//               {
//                 model: Customer,
//                 as: "customer",
//                 attributes: [
//                   "id",
//                   "userId",
//                   "name",
//                 ],
//                 required: false,
//               },
//             ],
//           }
//         );

//       if (orderWithCustomer?.customer) {
//         await notifyCustomer(
//           orderWithCustomer.customer,
//           {
//             title: "Task assigned to your order",
//             message:
//               `${tasks.length > 1 ? "Tasks have" : "A task has"} been assigned for your order #${resolvedOrderId}.`,
//             type: "task",
//             orderId: resolvedOrderId,
//             link: `/customer/orders/${resolvedOrderId}`,
//           }
//         );
//       }
//     } catch (notificationError) {
//       console.error(
//         "Customer notification error:",
//         notificationError.message
//       );
//     }
//   }

//   return res.status(201).json({
//     success: true,
//     message:
//       createdTasks.length > 1
//         ? `${createdTasks.length} tasks created successfully`
//         : "Task assigned successfully",
//     data:
//       createdTasks.length === 1
//         ? createdTasks[0]
//         : createdTasks,
//   });
// }

// /* ============================================================
//    ADMIN
//    GET ALL TASKS
// ============================================================ */

// export const getAllTasks = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       employee_id,
//       order_id,
//       status,
//       task_type,
//     } = req.query;

//     const where =
//       buildTaskWhereForAdmin(req);

//     if (employee_id) {
//       where.employee_id =
//         Number(employee_id);
//     }

//     if (order_id) {
//       where.order_id =
//         Number(order_id);
//     }

//     if (status) {
//       where.status = status;
//     }

//     if (task_type) {
//       if (!isValidTaskType(task_type)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid task_type.",
//         });
//       }

//       where.task_type = task_type;
//     }

//     const tasks = await Task.findAll({
//       where,

//       include: [
//         {
//           model: Employee,
//           as: "employee",
//           attributes: [
//             "id",
//             "name",
//             "email",
//             "designation",
//             "shop_id",
//             "status",
//           ],
//         },
//         {
//           model: Order,
//           as: "order",
//           attributes: [
//             "id",
//             "status",
//             "total_amount",
//             "pickup_address",
//             "delivery_address",
//           ],
//           required: false,
//         },
//       ],

//       order: [
//         [
//           literal(
//             "CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END"
//           ),
//           "ASC",
//         ],
//         ["sequence", "ASC"],
//         ["scheduled_time", "ASC"],
//         ["createdAt", "DESC"],
//       ],
//     });

//     return res.status(200).json({
//       success: true,
//       data: tasks,
//     });
//   } catch (error) {
//     console.error(
//       "Get All Tasks Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    ADMIN
//    ASSIGN TASK
// ============================================================ */

// export const assignTask = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       order_id,
//       employee_id,
//       customer_name,
//       customer_phone,
//       customer_address,
//       task_type,
//       task_types,
//       tasks,
//       scheduled_time,
//       priority,
//       notes,
//     } = req.body;

//     /* --------------------------------------------------------
//        NEW MODAL FORMAT
//     -------------------------------------------------------- */

//     if (
//       Array.isArray(tasks) &&
//       tasks.length > 0
//     ) {
//       return await assignMultipleTasks(
//         req,
//         res,
//         {
//           order_id,
//           customer_name,
//           customer_phone,
//           customer_address,
//           notes,
//           tasks,
//         }
//       );
//     }

//     /* --------------------------------------------------------
//        LEGACY FORMAT
//     -------------------------------------------------------- */

//     if (
//       !employee_id ||
//       !scheduled_time
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "employee_id and scheduled_time are required",
//       });
//     }

//     const baseTime =
//       new Date(scheduled_time);

//     if (Number.isNaN(baseTime.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid scheduled_time.",
//       });
//     }

//     if (
//       baseTime.getTime() < Date.now()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Scheduled time cannot be in the past.",
//       });
//     }

//     /* --------------------------------------------------------
//        TASK TYPES
//     -------------------------------------------------------- */

//     let typesToCreate = [];

//     if (
//       Array.isArray(task_types) &&
//       task_types.length > 0
//     ) {
//       for (const type of task_types) {
//         if (!TASK_TYPES.includes(type)) {
//           return res.status(400).json({
//             success: false,
//             message:
//               `Invalid task_type: ${type}`,
//           });
//         }
//       }

//       typesToCreate = [
//         ...new Set(task_types),
//       ];
//     } else if (task_type) {
//       if (!TASK_TYPES.includes(task_type)) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid task_type",
//         });
//       }

//       typesToCreate = [task_type];
//     } else {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Provide task_type (single) or task_types (array).",
//       });
//     }

//     /* --------------------------------------------------------
//        EMPLOYEE
//     -------------------------------------------------------- */

//     const employee =
//       await Employee.findByPk(
//         Number(employee_id)
//       );

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     const adminShopId =
//       getShopId(req);

//     if (
//       adminShopId &&
//       employee.shop_id &&
//       Number(employee.shop_id) !==
//         Number(adminShopId)
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You can only assign tasks to employees of your shop.",
//       });
//     }

//     /* --------------------------------------------------------
//        ORDER
//     -------------------------------------------------------- */

//     let resolvedOrderId =
//       order_id
//         ? Number(order_id)
//         : null;

//     let resolvedName =
//       String(
//         customer_name || ""
//       ).trim();

//     let resolvedPhone =
//       String(
//         customer_phone || ""
//       ).trim() || null;

//     let resolvedAddress =
//       String(
//         customer_address || ""
//       ).trim() || null;

//     let order = null;

//     if (resolvedOrderId) {
//       const orderWhere = {
//         id: resolvedOrderId,
//       };

//       if (adminShopId) {
//         orderWhere.shop_id =
//           adminShopId;
//       }

//       order = await Order.findOne({
//         where: orderWhere,
//         include: [
//           {
//             model: Customer,
//             as: "customer",
//             attributes: [
//               "name",
//               "phone",
//               "address",
//               "city",
//             ],
//             required: false,
//           },
//         ],
//       });

//       if (!order) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Order not found in your shop.",
//         });
//       }

//       if (
//         order.status === "delivered" ||
//         order.status === "cancelled"
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             `Cannot assign tasks to a ${order.status} order.`,
//         });
//       }

//       /* ------------------------------------------------------
//          DUPLICATE
//       ------------------------------------------------------ */

//       const existingTasks =
//         await Task.findAll({
//           where: {
//             order_id:
//               resolvedOrderId,

//             ...(adminShopId
//               ? {
//                   shop_id:
//                     adminShopId,
//                 }
//               : {}),
//           },

//           attributes: [
//             "id",
//             "task_type",
//             "employee_id",
//           ],
//         });

//       const duplicates =
//         typesToCreate.filter(
//           (type) =>
//             existingTasks.some(
//               (existing) =>
//                 existing.task_type ===
//                   type &&
//                 Number(
//                   existing.employee_id
//                 ) ===
//                   Number(employee_id)
//             )
//         );

//       if (duplicates.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message:
//             `This task is already assigned to this employee: ${
//               duplicates
//                 .map(
//                   (type) =>
//                     getTaskLabel(type)
//                 )
//                 .join(", ")
//             }.`,
//         });
//       }

//       if (!order.employee_id) {
//         order.employee_id =
//           Number(employee_id);

//         await order.save();
//       }

//       if (!resolvedName) {
//         resolvedName =
//           order.customer?.name ||
//           String(
//             order.pickup_address || ""
//           ).trim() ||
//           `Order #${order.id}`;
//       }

//       if (!resolvedPhone) {
//         resolvedPhone =
//           order.customer?.phone ||
//           null;
//       }

//       if (!resolvedAddress) {
//         resolvedAddress =
//           String(
//             order.customer
//               ? [
//                   order.customer.address,
//                   order.customer.city,
//                 ]
//                   .filter(Boolean)
//                   .join(", ")
//               : ""
//           ).trim() ||
//           order.pickup_address ||
//           null;
//       }
//     }

//     if (!resolvedName) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "customer_name is required (or link the task to an order).",
//       });
//     }

//     /* --------------------------------------------------------
//        CREATE
//     -------------------------------------------------------- */

//     const createdTasks = [];

//     for (
//       let i = 0;
//       i < typesToCreate.length;
//       i++
//     ) {
//       const currentType =
//         typesToCreate[i];

//       const taskTime =
//         new Date(
//           baseTime.getTime() +
//             i * 30 * 60 * 1000
//         );

//       const task =
//         await Task.create({
//           shop_id:
//             adminShopId ||
//             employee.shop_id,

//           order_id:
//             resolvedOrderId,

//           employee_id:
//             Number(employee_id),

//           customer_name:
//             resolvedName,

//           customer_phone:
//             resolvedPhone,

//           customer_address:
//             resolvedAddress,

//           task_type:
//             currentType,

//           sequence:
//             TASK_SEQUENCE_MAP[
//               currentType
//             ] || 1,

//           scheduled_time:
//             taskTime,

//           priority:
//             priority || "normal",

//           status: "pending",

//           activated_at: null,
//           started_at: null,
//           completed_at: null,

//           notes:
//             notes || null,
//         });

//       createdTasks.push(task);
//     }

//     /* --------------------------------------------------------
//        NOTIFY EMPLOYEE
//     -------------------------------------------------------- */

//     const scheduledLabel =
//       new Date(
//         scheduled_time
//       ).toLocaleString([], {
//         day: "2-digit",
//         month: "short",
//         hour: "2-digit",
//         minute: "2-digit",
//       });

//     await createNotification({
//       employeeId:
//         Number(employee_id),

//       orderId:
//         resolvedOrderId,

//       title:
//         typesToCreate.length > 1
//           ? "Multiple tasks assigned"
//           : "New task assigned",

//       message:
//         `${
//           typesToCreate.length > 1
//             ? "Tasks"
//             : getTaskLabel(
//                 typesToCreate[0]
//               )
//         } for ${resolvedName}${
//           resolvedOrderId
//             ? ` (order #${resolvedOrderId})`
//             : ""
//         } scheduled from ${scheduledLabel}.`,

//       type: "task",

//       link:
//         "/employee/mytask",
//     });

//     /* --------------------------------------------------------
//        CUSTOMER
//     -------------------------------------------------------- */

//     if (resolvedOrderId) {
//       try {
//         const orderWithCustomer =
//           await Order.findByPk(
//             resolvedOrderId,
//             {
//               include: [
//                 {
//                   model: Customer,
//                   as: "customer",
//                   attributes: [
//                     "id",
//                     "userId",
//                     "name",
//                   ],
//                   required: false,
//                 },
//               ],
//             }
//           );

//         if (
//           orderWithCustomer?.customer
//         ) {
//           await notifyCustomer(
//             orderWithCustomer.customer,
//             {
//               title:
//                 "Task assigned to your order",

//               message:
//                 `Tasks have been assigned for your order #${resolvedOrderId}.`,

//               type: "task",

//               orderId:
//                 resolvedOrderId,

//               link:
//                 `/customer/orders/${resolvedOrderId}`,
//             }
//           );
//         }
//       } catch (error) {
//         console.error(
//           "Customer notification error:",
//           error.message
//         );
//       }
//     }

//     return res.status(201).json({
//       success: true,

//       message:
//         createdTasks.length > 1
//           ? `${createdTasks.length} tasks created successfully`
//           : "Task assigned successfully",

//       data:
//         createdTasks.length === 1
//           ? createdTasks[0]
//           : createdTasks,
//     });
//   } catch (error) {
//     console.error(
//       "Assign Task Error:",
//       error
//     );

//     if (
//       error.name ===
//       "SequelizeValidationError"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           error.errors?.[0]?.message ||
//           error.message,
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    EMPLOYEE — MY TASKS
// ============================================================ */

// export const getMyTasks = async (
//   req,
//   res
// ) => {
//   try {
//     const context =
//       requireEmployeeContext(
//         req,
//         res
//       );

//     if (!context) return;

//     const {
//       shopId,
//       employeeId,
//     } = context;

//     const {
//       status,
//       type,
//       date,
//     } = req.query;

//     const where = {
//       shop_id: shopId,
//       employee_id: employeeId,
//     };

//     if (status) {
//       if (
//         ![
//           "pending",
//           "in_progress",
//           "completed",
//         ].includes(status)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid status.",
//         });
//       }

//       where.status = status;
//     }

//     if (type) {
//       if (!isValidTaskType(type)) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid task type.",
//         });
//       }

//       where.task_type = type;
//     }

//     if (date) {
//       const start =
//         new Date(
//           `${date}T00:00:00`
//         );

//       const end =
//         new Date(
//           `${date}T23:59:59`
//         );

//       if (
//         Number.isNaN(
//           start.getTime()
//         ) ||
//         Number.isNaN(
//           end.getTime()
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid date.",
//         });
//       }

//       where.scheduled_time = {
//         [Op.between]: [
//           start,
//           end,
//         ],
//       };
//     }

//     const tasks =
//       await Task.findAll({
//         where,

//         include: [
//           {
//             model: Order,
//             as: "order",
//             attributes: [
//               "id",
//               "status",
//               "total_amount",
//               "pickup_address",
//               "delivery_address",
//             ],
//             required: false,
//           },
//         ],

//         order: [
//           [
//             literal(
//               "CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END"
//             ),
//             "ASC",
//           ],
//           ["sequence", "ASC"],
//           ["scheduled_time", "ASC"],
//           ["createdAt", "DESC"],
//         ],
//       });

//     const now = new Date();

//     const orderCache =
//       new Map();

//     const response = [];

//     for (const task of tasks) {
//       let orderTasks = [];

//       if (task.order_id) {
//         const cacheKey =
//           `${shopId}-${task.order_id}`;

//         if (
//           !orderCache.has(
//             cacheKey
//           )
//         ) {
//           const allTasks =
//             await getOrderTasksSorted(
//               task.order_id,
//               shopId
//             );

//           orderCache.set(
//             cacheKey,
//             allTasks
//           );
//         }

//         orderTasks =
//           orderCache.get(
//             cacheKey
//           );
//       }

//       response.push(
//         serializeTaskReadiness(
//           task,
//           orderTasks,
//           now
//         )
//       );
//     }

//     return res.status(200).json({
//       success: true,
//       data: response,
//     });
//   } catch (error) {
//     console.error(
//       "Get My Tasks Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    EMPLOYEE — TASK STATS
// ============================================================ */

// export const getMyTaskStats = async (
//   req,
//   res
// ) => {
//   try {
//     const context =
//       requireEmployeeContext(
//         req,
//         res
//       );

//     if (!context) return;

//     const {
//       shopId,
//       employeeId,
//     } = context;

//     const { date } =
//       req.query;

//     const where = {
//       shop_id: shopId,
//       employee_id: employeeId,
//     };

//     if (date) {
//       const start =
//         new Date(
//           `${date}T00:00:00`
//         );

//       const end =
//         new Date(
//           `${date}T23:59:59`
//         );

//       where.scheduled_time = {
//         [Op.between]: [
//           start,
//           end,
//         ],
//       };
//     }

//     const [
//       total,
//       pending,
//       inProgress,
//       completed,
//     ] = await Promise.all([
//       Task.count({
//         where,
//       }),

//       Task.count({
//         where: {
//           ...where,
//           status: "pending",
//         },
//       }),

//       Task.count({
//         where: {
//           ...where,
//           status: "in_progress",
//         },
//       }),

//       Task.count({
//         where: {
//           ...where,
//           status: "completed",
//         },
//       }),
//     ]);

//     return res.status(200).json({
//       success: true,

//       data: {
//         total,
//         pending,
//         inProgress,
//         completed,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Get My Task Stats Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    EMPLOYEE — GET SINGLE TASK
// ============================================================ */

// export const getTaskById = async (
//   req,
//   res
// ) => {
//   try {
//     const context =
//       requireEmployeeContext(
//         req,
//         res
//       );

//     if (!context) return;

//     const {
//       shopId,
//       employeeId,
//     } = context;

//     const task =
//       await Task.findOne({
//         where: {
//           id: req.params.id,
//           employee_id:
//             employeeId,
//           shop_id: shopId,
//         },

//         include: [
//           {
//             model: Order,
//             as: "order",

//             attributes: [
//               "id",
//               "status",
//               "total_amount",
//               "pickup_address",
//               "delivery_address",
//               "pickup_date",
//               "pickup_time",
//               "delivery_date",
//               "delivery_note",
//             ],

//             required: false,

//             include: [
//               {
//                 model: Customer,
//                 as: "customer",

//                 attributes: [
//                   "id",
//                   "userId",
//                   "name",
//                   "email",
//                   "phone",
//                   "address",
//                   "city",
//                 ],

//                 required: false,
//               },
//             ],
//           },
//         ],
//       });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Task not found",
//       });
//     }

//     let orderTasks = [];

//     if (task.order_id) {
//       orderTasks =
//         await getOrderTasksSorted(
//           task.order_id,
//           shopId
//         );
//     }

//     const data =
//       serializeTaskReadiness(
//         task,
//         orderTasks,
//         new Date()
//       );

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     console.error(
//       "Get Task By ID Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    EMPLOYEE — UPDATE TASK STATUS
// ============================================================ */

// /**
//  * PATCH /api/tasks/:id/status
//  *
//  * Allowed:
//  *   pending
//  *   in_progress
//  *   completed
//  *
//  * IMPORTANT:
//  *
//  * pending -> in_progress
//  *   requires:
//  *   1. previous assigned tasks completed
//  *   2. scheduled time reached
//  *
//  * in_progress -> completed
//  *   allowed after task has actually started.
//  *
//  * pending -> completed
//  *   BLOCKED.
//  *
//  * Next task:
//  *   NEVER auto-starts.
//  *
//  * Late:
//  *   ALLOWED.
//  */
// export const updateTaskStatus = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       status,
//     } = req.body;

//     const allowedStatuses = [
//       "pending",
//       "in_progress",
//       "completed",
//     ];

//     if (
//       !allowedStatuses.includes(status)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid status value",
//       });
//     }

//     const context =
//       requireEmployeeContext(
//         req,
//         res
//       );

//     if (!context) return;

//     const {
//       shopId,
//       employeeId,
//     } = context;

//     /* ----------------------------------------------------------
//        GET TASK
//     ---------------------------------------------------------- */

//     const task =
//       await Task.findOne({
//         where: {
//           id: req.params.id,
//           employee_id:
//             employeeId,
//           shop_id: shopId,
//         },

//         include: [
//           {
//             model: Employee,
//             as: "employee",
//             attributes: [
//               "id",
//               "name",
//               "shop_id",
//             ],
//           },

//           {
//             model: Order,
//             as: "order",

//             attributes: [
//               "id",
//               "status",
//               "shop_id",
//               "delivery_time",
//               "customer_id",
//             ],

//             required: false,

//             include: [
//               {
//                 model: Customer,
//                 as: "customer",

//                 attributes: [
//                   "id",
//                   "userId",
//                   "name",
//                 ],

//                 required: false,
//               },
//             ],
//           },
//         ],
//       });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Task not found",
//       });
//     }

//     /* ----------------------------------------------------------
//        NO CHANGE
//     ---------------------------------------------------------- */

//     if (task.status === status) {
//       return res.status(200).json({
//         success: true,
//         message:
//           "Task status is already set to this value.",
//         data: task,
//       });
//     }

//     /* ----------------------------------------------------------
//        COMPLETED TASK CANNOT BE CHANGED
//     ---------------------------------------------------------- */

//     if (
//       task.status === "completed"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Completed task cannot be changed.",
//       });
//     }

//     /* ----------------------------------------------------------
//        PENDING -> COMPLETED BLOCK
//     ---------------------------------------------------------- */

//     if (
//       status === "completed" &&
//       task.status !== "in_progress"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Start the task first, then complete it.",
//       });
//     }

//     /* ----------------------------------------------------------
//        ORDER TASKS
//     ---------------------------------------------------------- */

//     let allOrderTasks = [];

//     if (task.order_id) {
//       allOrderTasks =
//         await getOrderTasksSorted(
//           task.order_id,
//           shopId
//         );
//     }

//     /* ----------------------------------------------------------
//        START / COMPLETE VALIDATION
//     ---------------------------------------------------------- */

//     if (
//       status === "in_progress" ||
//       status === "completed"
//     ) {
//       const blockingTasks =
//         getBlockingTasks(
//           task.task_type,
//           allOrderTasks
//         );

//       /* --------------------------------------------------------
//          WORKFLOW BLOCK
//       -------------------------------------------------------- */

//       if (
//         blockingTasks.length > 0
//       ) {
//         const labels =
//           blockingTasks
//             .map(
//               (item) =>
//                 `${getTaskLabel(
//                   item.task_type
//                 )} (${item.status})`
//             )
//             .join(", ");

//         return res.status(400).json({
//           success: false,

//           message:
//             `Cannot ${
//               status === "in_progress"
//                 ? "start"
//                 : "complete"
//             } this task yet. Complete these first: ${labels}.`,

//           code:
//             "WORKFLOW_NOT_READY",

//           blockingTasks:
//             blockingTasks.map(
//               (item) => ({
//                 id: item.id,
//                 task_type:
//                   item.task_type,
//                 label:
//                   getTaskLabel(
//                     item.task_type
//                   ),
//                 status:
//                   item.status,
//               })
//             ),
//         });
//       }

//       /* --------------------------------------------------------
//          SCHEDULE BLOCK
//       -------------------------------------------------------- */

//       if (
//         !isTaskScheduleReached(
//           task,
//           new Date()
//         )
//       ) {
//         const scheduled =
//           new Date(
//             task.scheduled_time
//           );

//         return res.status(400).json({
//           success: false,

//           message:
//             `This task is scheduled to start at ${scheduled.toLocaleString()}. You cannot start it before that time.`,

//           code:
//             "TASK_NOT_SCHEDULED_YET",

//           scheduled_time:
//             task.scheduled_time,
//         });
//       }
//     }

//     /* ----------------------------------------------------------
//        ONE ACTIVE TASK PER EMPLOYEE
//     ---------------------------------------------------------- */

//     if (
//       status === "in_progress" &&
//       task.status !== "in_progress"
//     ) {
//       const existingActive =
//         await Task.findOne({
//           where: {
//             shop_id: shopId,
//             employee_id:
//               employeeId,

//             status:
//               "in_progress",

//             id: {
//               [Op.ne]:
//                 task.id,
//             },
//           },
//         });

//       if (existingActive) {
//         /**
//          * IMPORTANT:
//          *
//          * We only pause the existing task because one employee
//          * can work on one task at a time.
//          *
//          * This is NOT workflow auto-start.
//          */
//         existingActive.status =
//           "pending";

//         await existingActive.save();

//         await createNotification({
//           employeeId:
//             employeeId,

//           taskId:
//             existingActive.id,

//           orderId:
//             existingActive.order_id,

//           title:
//             `Task paused: ${getTaskLabel(
//               existingActive.task_type
//             )}`,

//           message:
//             `Your ${getTaskLabel(
//               existingActive.task_type
//             )} task has been paused so you can work on another task. You can resume it later.`,

//           type:
//             "task",

//           link:
//             "/employee/mytask",
//         });
//       }
//     }

//     /* ----------------------------------------------------------
//        LIFECYCLE TIMESTAMPS
//     ---------------------------------------------------------- */

//     const now =
//       new Date();

//     if (
//       status === "in_progress"
//     ) {
//       if (!task.started_at) {
//         task.started_at =
//           now;
//       }

//       /**
//        * activated_at represents when the task became available.
//        *
//        * Since the employee manually starts it,
//        * we can set activated_at at first start if it doesn't
//        * already exist.
//        */
//       if (!task.activated_at) {
//         task.activated_at =
//           now;
//       }
//     }

//     if (
//       status === "completed"
//     ) {
//       if (!task.started_at) {
//         task.started_at =
//           now;
//       }

//       if (!task.activated_at) {
//         task.activated_at =
//           task.started_at;
//       }

//       task.completed_at =
//         task.completed_at ||
//         now;
//     }

//     task.status =
//       status;

//     await task.save();

//     /* ----------------------------------------------------------
//        REFRESH TASK
//     ---------------------------------------------------------- */

//     const updatedTask =
//       await Task.findByPk(
//         task.id,
//         {
//           include: [
//             {
//               model: Employee,
//               as: "employee",
//               attributes: [
//                 "id",
//                 "name",
//                 "email",
//                 "designation",
//                 "shop_id",
//               ],
//             },

//             {
//               model: Order,
//               as: "order",
//               attributes: [
//                 "id",
//                 "status",
//                 "total_amount",
//                 "pickup_address",
//                 "delivery_address",
//                 "delivery_time",
//                 "customer_id",
//                 "shop_id",
//               ],
//               required: false,
//             },
//           ],
//         }
//       );

//     /* ----------------------------------------------------------
//        ORDER STATUS UPDATE
//     ---------------------------------------------------------- */

//     let freshOrder = null;

//     if (task.order_id) {
//       freshOrder =
//         await Order.findOne({
//           where: {
//             id:
//               task.order_id,
//             shop_id:
//               shopId,
//           },

//           include: [
//             {
//               model: Customer,
//               as: "customer",
//               attributes: [
//                 "id",
//                 "userId",
//                 "name",
//               ],
//               required: false,
//             },
//           ],
//         });
//     }

//     const previousOrderStatus =
//       freshOrder?.status ||
//       task.order?.status ||
//       null;

//     if (
//       freshOrder &&
//       freshOrder.status !==
//         "cancelled"
//     ) {
//       const implied =
//         impliedOrderStatus(
//           task.task_type,
//           status
//         );

//       const currentRank =
//         ORDER_STATUS_RANK[
//           freshOrder.status
//         ] ?? -1;

//       const impliedRank =
//         ORDER_STATUS_RANK[
//           implied
//         ] ?? -1;

//       /**
//        * Never move an order backward.
//        */
//       if (
//         implied &&
//         impliedRank >
//           currentRank
//       ) {
//         freshOrder.status =
//           implied;

//         if (
//           implied ===
//           "delivered"
//         ) {
//           /**
//            * Order.delivery_time is STRING in this project.
//            */
//           freshOrder.delivery_time =
//             new Date().toISOString();
//         }

//         await freshOrder.save();
//       }
//     }

//     /* ----------------------------------------------------------
//        IMPORTANT:
//        DO NOT AUTO-START NEXT TASK
//     ---------------------------------------------------------- */

//     let nextTask = null;
//     let nextEmployee = null;

//     if (
//       status === "completed" &&
//       task.order_id
//     ) {
//       allOrderTasks =
//         await getOrderTasksSorted(
//           task.order_id,
//           shopId
//         );

//       nextTask =
//         findNextTask(
//           task.task_type,
//           allOrderTasks
//         );

//       if (
//         nextTask &&
//         nextTask.employee_id
//       ) {
//         nextEmployee =
//           await Employee.findByPk(
//             nextTask.employee_id,
//             {
//               attributes: [
//                 "id",
//                 "name",
//               ],
//             }
//           ).catch(
//             () => null
//           );
//       }

//       /**
//        * DO NOT DO THIS:
//        *
//        * next.status = "in_progress";
//        *
//        * The next employee must click Start.
//        *
//        * It remains pending.
//        */
//     }

//     /* ----------------------------------------------------------
//        NEXT TASK READINESS
//     ---------------------------------------------------------- */

//     let nextTaskReadiness =
//       null;

//     if (nextTask) {
//       nextTaskReadiness =
//         serializeTaskReadiness(
//           nextTask,
//           allOrderTasks,
//           new Date()
//         );
//     }

//     /* ----------------------------------------------------------
//        NOTIFICATION DATA
//     ---------------------------------------------------------- */

//     const shopIdForAdmin =
//       task.employee?.shop_id ||
//       freshOrder?.shop_id ||
//       task.order?.shop_id ||
//       shopId;

//     const typeLabel =
//       getTaskLabel(
//         task.task_type
//       );

//     const orderId =
//       task.order?.id ||
//       task.order_id;

//     const customerName =
//       task.customer_name ||
//       task.order?.customer?.name ||
//       "the customer";

//     const newOrderStatus =
//       freshOrder?.status ||
//       task.order?.status ||
//       null;

//     const orderStatusChanged =
//       previousOrderStatus !==
//         newOrderStatus &&
//       Boolean(
//         newOrderStatus
//       );

//     /* ----------------------------------------------------------
//        ADMIN NOTIFICATION
//     ---------------------------------------------------------- */

//     if (
//       status === "completed"
//     ) {
//       let adminMessage =
//         `${task.employee?.name || "An employee"} completed the ${typeLabel} task for ${customerName}'s Order #${orderId}.`;

//       if (
//         nextTask &&
//         nextEmployee
//       ) {
//         const nextLabel =
//           getTaskLabel(
//             nextTask.task_type
//           );

//         const nextReady =
//           nextTaskReadiness?.isReady;

//         if (nextReady) {
//           adminMessage +=
//             ` Next task (${nextLabel}) is now ready for ${nextEmployee.name} to start.`;
//         } else if (
//           nextTaskReadiness?.waitingReason
//             ?.type ===
//           "schedule"
//         ) {
//           const scheduled =
//             new Date(
//               nextTask.scheduled_time
//             );

//           adminMessage +=
//             ` Next task (${nextLabel}) is assigned to ${nextEmployee.name}, but it is scheduled for ${scheduled.toLocaleString()}.`;
//         } else {
//           adminMessage +=
//             ` Next task (${nextLabel}) is assigned to ${nextEmployee.name} and is waiting for its prerequisites.`;
//         }
//       } else if (
//         task.task_type ===
//         "delivery"
//       ) {
//         adminMessage +=
//           " Order is now delivered!";
//       } else if (
//         task.task_type !==
//         "pickup"
//       ) {
//         adminMessage +=
//           " Order is ready for delivery — assign a delivery employee.";
//       }

//       if (
//         orderStatusChanged
//       ) {
//         adminMessage +=
//           ` Order status: ${
//             ORDER_STATUS_LABELS[
//               previousOrderStatus
//             ] ||
//             previousOrderStatus
//           } → ${
//             ORDER_STATUS_LABELS[
//               newOrderStatus
//             ] ||
//             newOrderStatus
//           }.`;
//       }

//       await notifyShopAdmins(
//         shopIdForAdmin,
//         {
//           title:
//             `Task completed: ${typeLabel}`,

//           message:
//             adminMessage,

//           type:
//             "task",

//           orderId:
//             orderId,

//           link:
//             "/admin/tasks",
//         }
//       );
//     } else {
//       const actionWord =
//         status === "in_progress"
//           ? "started"
//           : "updated";

//       await notifyShopAdmins(
//         shopIdForAdmin,
//         {
//           title:
//             "Task update from employee",

//           message:
//             `${task.employee?.name || "An employee"} ${actionWord} the ${typeLabel} task for Order #${orderId}.${
//               orderStatusChanged
//                 ? ` Order status: ${
//                     ORDER_STATUS_LABELS[
//                       previousOrderStatus
//                     ] ||
//                     previousOrderStatus
//                   } → ${
//                     ORDER_STATUS_LABELS[
//                       newOrderStatus
//                     ] ||
//                     newOrderStatus
//                   }.`
//                 : ""
//             }`,

//           type:
//             "task",

//           orderId:
//             orderId,

//           link:
//             "/admin/tasks",
//         }
//       );
//     }

//     /* ----------------------------------------------------------
//        NEXT EMPLOYEE NOTIFICATION
//     ---------------------------------------------------------- */

//     if (
//       status === "completed" &&
//       nextTask
//     ) {
//       const completedLabel =
//         getTaskLabel(
//           task.task_type
//         );

//       const nextLabel =
//         getTaskLabel(
//           nextTask.task_type
//         );

//       const nextReady =
//         nextTaskReadiness?.isReady;

//       if (
//         nextTask.employee_id !==
//         task.employee_id
//       ) {
//         let message =
//           `${task.employee?.name || "An employee"} completed ${completedLabel} for ${customerName}'s Order #${orderId}.`;

//         if (nextReady) {
//           message +=
//             ` Your ${nextLabel} task is ready to start.`;
//         } else if (
//           nextTaskReadiness
//             ?.waitingReason
//             ?.type ===
//           "schedule"
//         ) {
//           const scheduled =
//             new Date(
//               nextTask.scheduled_time
//             );

//           message +=
//             ` Your ${nextLabel} task is scheduled for ${scheduled.toLocaleString()}. It will become ready at that time.`;
//         } else {
//           message +=
//             ` Your ${nextLabel} task is waiting for the previous workflow task(s) to complete.`;
//         }

//         await createNotification({
//           employeeId:
//             nextTask.employee_id,

//           taskId:
//             nextTask.id,

//           orderId:
//             orderId,

//           title:
//             `${completedLabel} completed — ${nextLabel}`,

//           message:
//             message,

//           type:
//             "task",

//           link:
//             "/employee/mytask",
//         });
//       } else {
//         let message =
//           `Your ${completedLabel.toLowerCase()} task for ${customerName}'s Order #${orderId} is completed.`;

//         if (nextReady) {
//           message +=
//             ` Your next task is ${nextLabel} and is ready to start.`;
//         } else if (
//           nextTaskReadiness
//             ?.waitingReason
//             ?.type ===
//           "schedule"
//         ) {
//           const scheduled =
//             new Date(
//               nextTask.scheduled_time
//             );

//           message +=
//             ` Your next task is ${nextLabel}, scheduled for ${scheduled.toLocaleString()}.`;
//         } else {
//           message +=
//             ` Your next task is ${nextLabel}, but it is waiting for its prerequisites.`;
//         }

//         await createNotification({
//           employeeId:
//             nextTask.employee_id,

//           taskId:
//             nextTask.id,

//           orderId:
//             orderId,

//           title:
//             `${completedLabel} completed — next: ${nextLabel}`,

//           message:
//             message,

//           type:
//             "task",

//           link:
//             "/employee/mytask",
//         });
//       }
//     }

//     /* ----------------------------------------------------------
//        CUSTOMER NOTIFICATION
//     ---------------------------------------------------------- */

//     const effectiveOrder =
//       freshOrder ||
//       task.order;

//     if (effectiveOrder) {
//       const orderStatus =
//         effectiveOrder.status;

//       const customerObj =
//         effectiveOrder.customer ||
//         null;

//       /* --------------------------------------------------------
//          DELIVERY COMPLETED
//       -------------------------------------------------------- */

//       if (
//         task.task_type ===
//           "delivery" &&
//         status ===
//           "completed"
//       ) {
//         await notifyCustomer(
//           customerObj,
//           {
//             title:
//               "Order delivered — Review us!",

//             message:
//               `Your order #${orderId} has been delivered! We'd love your feedback — write a review to share your experience.`,

//             type:
//               "order",

//             orderId:
//               orderId,

//             link:
//               "/customer/reviews",
//           }
//         );
//       } else if (
//         orderStatusChanged
//       ) {
//         await notifyCustomer(
//           customerObj,
//           {
//             title:
//               "Order status updated",

//             message:
//               `Your order #${orderId} is now ${
//                 ORDER_STATUS_LABELS[
//                   orderStatus
//                 ] ||
//                 orderStatus
//               }.`,

//             type:
//               "order",

//             orderId:
//               orderId,

//             link:
//               `/customer/orders/${orderId}`,
//           }
//         );
//       }
//     }

//     /* ----------------------------------------------------------
//        FINAL RESPONSE
//     ---------------------------------------------------------- */

//     const finalTask =
//       updatedTask ||
//       task;

//     let finalOrderTasks =
//       allOrderTasks;

//     if (
//       finalTask.order_id &&
//       (!finalOrderTasks ||
//         finalOrderTasks.length === 0)
//     ) {
//       finalOrderTasks =
//         await getOrderTasksSorted(
//           finalTask.order_id,
//           shopId
//         );
//     }

//     const responseTask =
//       serializeTaskReadiness(
//         finalTask,
//         finalOrderTasks,
//         new Date()
//       );

//     return res.status(200).json({
//       success: true,

//       message:
//         status === "in_progress"
//           ? "Task started successfully."
//           : "Task completed successfully.",

//       data: responseTask,

//       nextTask:
//         nextTask
//           ? nextTaskReadiness
//           : null,
//     });
//   } catch (error) {
//     console.error(
//       "Update Task Status Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    EMPLOYEE — UPDATE NOTES
// ============================================================ */

// export const updateTaskNotes = async (
//   req,
//   res
// ) => {
//   try {
//     const context =
//       requireEmployeeContext(
//         req,
//         res
//       );

//     if (!context) return;

//     const {
//       shopId,
//       employeeId,
//     } = context;

//     const task =
//       await Task.findOne({
//         where: {
//           id: req.params.id,
//           employee_id:
//             employeeId,
//           shop_id: shopId,
//         },
//       });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Task not found",
//       });
//     }

//     task.notes =
//       req.body.notes ??
//       task.notes;

//     await task.save();

//     return res.status(200).json({
//       success: true,
//       data: task,
//     });
//   } catch (error) {
//     console.error(
//       "Update Task Notes Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    ADMIN — GET ORDER TASKS
// ============================================================ */

// export const getOrderTasks = async (
//   req,
//   res
// ) => {
//   try {
//     const orderId =
//       Number(req.params.orderId);

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid order ID.",
//       });
//     }

//     const adminShopId =
//       getShopId(req);

//     const orderWhere = {
//       id: orderId,
//     };

//     if (adminShopId) {
//       orderWhere.shop_id =
//         adminShopId;
//     }

//     const order =
//       await Order.findOne({
//         where:
//           orderWhere,
//       });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Order not found.",
//       });
//     }

//     const taskWhere = {
//       order_id:
//         orderId,
//     };

//     if (adminShopId) {
//       taskWhere.shop_id =
//         adminShopId;
//     }

//     const tasks =
//       await Task.findAll({
//         where:
//           taskWhere,

//         include: [
//           {
//             model: Employee,
//             as: "employee",
//             attributes: [
//               "id",
//               "name",
//               "email",
//               "designation",
//               "shop_id",
//             ],
//           },
//         ],

//         order: [
//           ["sequence", "ASC"],
//           ["scheduled_time", "ASC"],
//           ["createdAt", "ASC"],
//         ],
//       });

//     const now =
//       new Date();

//     const response =
//       tasks.map(
//         (task) =>
//           serializeTaskReadiness(
//             task,
//             tasks,
//             now
//           )
//       );

//     return res.status(200).json({
//       success: true,
//       data: response,
//     });
//   } catch (error) {
//     console.error(
//       "Get Order Tasks Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    ADMIN — REASSIGN TASK
// ============================================================ */

// /**
//  * Body:
//  *
//  * {
//  *   employee_id: 12,
//  *   force: false
//  * }
//  *
//  * Same-time employee conflict is only a warning on frontend.
//  *
//  * Backend does NOT block reassignment because of schedule overlap.
//  */
// export const reassignTask = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       employee_id,
//       force = false,
//     } = req.body;

//     if (!employee_id) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "employee_id is required",
//       });
//     }

//     const taskId =
//       Number(req.params.id);

//     if (!taskId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid task ID.",
//       });
//     }

//     const adminShopId =
//       getShopId(req);

//     /* ----------------------------------------------------------
//        GET TASK
//     ---------------------------------------------------------- */

//     const task =
//       await Task.findByPk(
//         taskId,
//         {
//           include: [
//             {
//               model: Employee,
//               as: "employee",
//               attributes: [
//                 "id",
//                 "name",
//                 "shop_id",
//               ],
//             },

//             {
//               model: Order,
//               as: "order",
//               attributes: [
//                 "id",
//                 "shop_id",
//               ],
//               required: false,
//             },
//           ],
//         }
//       );

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Task not found",
//       });
//     }

//     /* ----------------------------------------------------------
//        SHOP ACCESS
//     ---------------------------------------------------------- */

//     const taskShopId =
//       task.shop_id ||
//       task.employee?.shop_id ||
//       task.order?.shop_id;

//     if (
//       adminShopId &&
//       taskShopId &&
//       Number(taskShopId) !==
//         Number(adminShopId)
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "Cannot reassign tasks from another shop.",
//       });
//     }

//     /* ----------------------------------------------------------
//        COMPLETED TASK
//     ---------------------------------------------------------- */

//     if (
//       task.status ===
//       "completed"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Cannot reassign a completed task.",
//       });
//     }

//     /* ----------------------------------------------------------
//        NEW EMPLOYEE
//     ---------------------------------------------------------- */

//     const newEmployee =
//       await Employee.findByPk(
//         Number(employee_id)
//       );

//     if (!newEmployee) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Employee not found",
//       });
//     }

//     if (
//       adminShopId &&
//       newEmployee.shop_id &&
//       Number(
//         newEmployee.shop_id
//       ) !==
//         Number(adminShopId)
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "Cannot assign to an employee from a different shop.",
//       });
//     }

//     /* ----------------------------------------------------------
//        SAME EMPLOYEE
//     ---------------------------------------------------------- */

//     if (
//       Number(task.employee_id) ===
//       Number(employee_id)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Task is already assigned to this employee.",
//       });
//     }

//     /* ----------------------------------------------------------
//        DUPLICATE TASK
//     ---------------------------------------------------------- */

//     if (task.order_id) {
//       const duplicate =
//         await Task.findOne({
//           where: {
//             order_id:
//               task.order_id,

//             task_type:
//               task.task_type,

//             employee_id:
//               Number(employee_id),

//             id: {
//               [Op.ne]:
//                 taskId,
//             },

//             ...(adminShopId
//               ? {
//                   shop_id:
//                     adminShopId,
//                 }
//               : {}),
//           },
//         });

//       if (duplicate) {
//         return res.status(409).json({
//           success: false,
//           message:
//             `A ${getTaskLabel(
//               task.task_type
//             )} task is already assigned to this employee for this order.`,
//         });
//       }
//     }

//     /* ----------------------------------------------------------
//        PRESERVE OLD STATE SAFELY
//     ---------------------------------------------------------- */

//     const oldEmployeeId =
//       Number(
//         task.employee_id
//       );

//     const oldEmployeeName =
//       task.employee?.name ||
//       "previous employee";

//     /**
//      * If an in-progress task is reassigned,
//      * the new employee must manually start it.
//      *
//      * We do NOT automatically start it.
//      */
//     if (
//       task.status ===
//       "in_progress"
//     ) {
//       task.status =
//         "pending";
//     }

//     task.employee_id =
//       Number(employee_id);

//     /**
//      * If reassigned, activate again only when employee
//      * manually starts it.
//      */
//     task.activated_at =
//       null;

//     task.started_at =
//       null;

//     /**
//      * completed_at should normally be null because completed
//      * tasks cannot be reassigned.
//      */
//     task.completed_at =
//       null;

//     await task.save();

//     /* ----------------------------------------------------------
//        NEW EMPLOYEE NOTIFICATION
//     ---------------------------------------------------------- */

//     await createNotification({
//       employeeId:
//         Number(employee_id),

//       taskId:
//         task.id,

//       orderId:
//         task.order_id,

//       title:
//         "Task reassigned to you",

//       message:
//         `${getTaskLabel(
//           task.task_type
//         )} task${
//           task.order_id
//             ? ` for Order #${task.order_id}`
//             : ""
//         } has been reassigned to you from ${oldEmployeeName}. Please start it manually when it becomes ready.`,

//       type:
//         "task",

//       link:
//         "/employee/mytask",
//     });

//     /* ----------------------------------------------------------
//        OLD EMPLOYEE NOTIFICATION
//     ---------------------------------------------------------- */

//     if (
//       oldEmployeeId &&
//       oldEmployeeId !==
//         Number(employee_id)
//     ) {
//       await createNotification({
//         employeeId:
//           oldEmployeeId,

//         taskId:
//           task.id,

//         orderId:
//           task.order_id,

//         title:
//           "Task reassigned",

//         message:
//           `The ${getTaskLabel(
//             task.task_type
//           )} task${
//             task.order_id
//               ? ` for Order #${task.order_id}`
//               : ""
//           } has been reassigned to another employee.`,

//         type:
//           "task",

//         link:
//           "/employee/mytask",
//       }).catch(
//         (notificationError) => {
//           console.error(
//             "Old employee notification error:",
//             notificationError.message
//           );
//         }
//       );
//     }

//     /* ----------------------------------------------------------
//        RELOAD
//     ---------------------------------------------------------- */

//     const updated =
//       await Task.findByPk(
//         taskId,
//         {
//           include: [
//             {
//               model: Employee,
//               as: "employee",
//               attributes: [
//                 "id",
//                 "name",
//                 "email",
//                 "designation",
//                 "shop_id",
//               ],
//             },

//             {
//               model: Order,
//               as: "order",
//               attributes: [
//                 "id",
//                 "status",
//                 "total_amount",
//               ],
//               required: false,
//             },
//           ],
//         }
//       );

//     /* ----------------------------------------------------------
//        RETURN
//     ---------------------------------------------------------- */

//     return res.status(200).json({
//       success: true,

//       message:
//         `${getTaskLabel(
//           task.task_type
//         )} reassigned to ${newEmployee.name}`,

//       data: updated,

//       warning:
//         force
//           ? null
//           : "Employee schedule conflicts are treated as warnings only. The task can still be assigned.",
//     });
//   } catch (error) {
//     console.error(
//       "Reassign Task Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// /* ============================================================
//    ADMIN — TASK HISTORY
// ============================================================ */

// export const getAdminTaskHistory =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const {
//         employee_id,
//         customer,
//         order_id,
//         task_type,
//         status,
//         startDate,
//         endDate,
//       } = req.query;

//       const adminShopId =
//         getShopId(req);

//       const where = {};

//       if (adminShopId) {
//         where["$employee.shop_id$"] =
//           {
//             [Op.or]: [
//               adminShopId,
//               null,
//             ],
//           };
//       }

//       if (employee_id) {
//         where.employee_id =
//           Number(employee_id);
//       }

//       if (order_id) {
//         where.order_id =
//           Number(order_id);
//       }

//       if (task_type) {
//         if (
//           !isValidTaskType(
//             task_type
//           )
//         ) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Invalid task_type.",
//           });
//         }

//         where.task_type =
//           task_type;
//       }

//       if (status) {
//         if (
//           ![
//             "pending",
//             "in_progress",
//             "completed",
//           ].includes(status)
//         ) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Invalid status.",
//           });
//         }

//         where.status =
//           status;
//       }

//       if (
//         customer &&
//         String(customer).trim()
//       ) {
//         where.customer_name = {
//           [Op.like]:
//             `%${String(
//               customer
//             ).trim()}%`,
//         };
//       }

//       if (
//         startDate &&
//         endDate
//       ) {
//         where.scheduled_time =
//           {
//             [Op.between]: [
//               new Date(
//                 `${startDate}T00:00:00`
//               ),

//               new Date(
//                 `${endDate}T23:59:59`
//               ),
//             ],
//           };
//       } else if (
//         startDate
//       ) {
//         where.scheduled_time =
//           {
//             [Op.gte]:
//               new Date(
//                 `${startDate}T00:00:00`
//               ),
//           };
//       } else if (
//         endDate
//       ) {
//         where.scheduled_time =
//           {
//             [Op.lte]:
//               new Date(
//                 `${endDate}T23:59:59`
//               ),
//           };
//       }

//       const tasks =
//         await Task.findAll({
//           where,

//           include: [
//             {
//               model: Employee,
//               as: "employee",
//               attributes: [
//                 "id",
//                 "name",
//                 "email",
//                 "designation",
//                 "shop_id",
//               ],
//             },

//             {
//               model: Order,
//               as: "order",
//               attributes: [
//                 "id",
//                 "status",
//                 "total_amount",
//               ],
//               required: false,

//               include: [
//                 {
//                   model: Customer,
//                   as: "customer",
//                   attributes: [
//                     "id",
//                     "name",
//                     "phone",
//                   ],
//                   required: false,
//                 },
//               ],
//             },
//           ],

//           order: [
//             [
//               "createdAt",
//               "DESC",
//             ],
//           ],
//         });

//       return res.status(200).json({
//         success: true,
//         data: tasks,
//       });
//     } catch (error) {
//       console.error(
//         "Get Admin Task History Error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };

// /* ============================================================
//    EMPLOYEE — TASK HISTORY
// ============================================================ */

// export const getEmployeeTaskHistory =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const context =
//         requireEmployeeContext(
//           req,
//           res
//         );

//       if (!context) return;

//       const {
//         shopId,
//         employeeId,
//       } = context;

//       const {
//         status,
//         task_type,
//         startDate,
//         endDate,
//       } = req.query;

//       const where = {
//         shop_id: shopId,
//         employee_id:
//           employeeId,
//       };

//       if (status) {
//         if (
//           ![
//             "pending",
//             "in_progress",
//             "completed",
//           ].includes(status)
//         ) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Invalid status.",
//           });
//         }

//         where.status =
//           status;
//       }

//       if (task_type) {
//         if (
//           !isValidTaskType(
//             task_type
//           )
//         ) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Invalid task type.",
//           });
//         }

//         where.task_type =
//           task_type;
//       }

//       if (
//         startDate &&
//         endDate
//       ) {
//         where.scheduled_time =
//           {
//             [Op.between]: [
//               new Date(
//                 `${startDate}T00:00:00`
//               ),

//               new Date(
//                 `${endDate}T23:59:59`
//               ),
//             ],
//           };
//       } else if (
//         startDate
//       ) {
//         where.scheduled_time =
//           {
//             [Op.gte]:
//               new Date(
//                 `${startDate}T00:00:00`
//               ),
//           };
//       } else if (
//         endDate
//       ) {
//         where.scheduled_time =
//           {
//             [Op.lte]:
//               new Date(
//                 `${endDate}T23:59:59`
//               ),
//           };
//       }

//       const tasks =
//         await Task.findAll({
//           where,

//           include: [
//             {
//               model: Order,
//               as: "order",
//               attributes: [
//                 "id",
//                 "status",
//                 "total_amount",
//                 "pickup_address",
//                 "delivery_address",
//               ],
//               required: false,

//               include: [
//                 {
//                   model: Customer,
//                   as: "customer",
//                   attributes: [
//                     "id",
//                     "name",
//                     "phone",
//                     "address",
//                     "city",
//                   ],
//                   required: false,
//                 },
//               ],
//             },
//           ],

//           order: [
//             [
//               "createdAt",
//               "DESC",
//             ],
//           ],
//         });

//       return res.status(200).json({
//         success: true,
//         data: tasks,
//       });
//     } catch (error) {
//       console.error(
//         "Get Employee Task History Error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };

// /* ============================================================
//    EMPLOYEE — CUSTOMER TASKS
// ============================================================ */

// export const getMyCustomerTasks =
//   async (
//     req,
//     res
//   ) => {
//     try {
//       const context =
//         requireEmployeeContext(
//           req,
//           res
//         );

//       if (!context) return;

//       const {
//         shopId,
//         employeeId,
//       } = context;

//       const tasks =
//         await Task.findAll({
//           where: {
//             shop_id:
//               shopId,

//             employee_id:
//               employeeId,
//           },

//           include: [
//             {
//               model: Order,
//               as: "order",

//               attributes: [
//                 "id",
//                 "status",
//                 "total_amount",
//               ],

//               required: false,

//               include: [
//                 {
//                   model: Customer,
//                   as: "customer",

//                   attributes: [
//                     "id",
//                     "name",
//                     "phone",
//                     "address",
//                     "city",
//                   ],

//                   required: false,
//                 },
//               ],
//             },
//           ],

//           order: [
//             [
//               "createdAt",
//               "DESC",
//             ],
//           ],
//         });

//       const grouped = {};

//       for (const task of tasks) {
//         const key =
//           task.customer_name ||
//           "Unknown";

//         if (!grouped[key]) {
//           grouped[key] = {
//             customerName:
//               key,

//             customerPhone:
//               task.customer_phone ||
//               task.order?.customer
//                 ?.phone ||
//               null,

//             customerAddress:
//               task.customer_address ||
//               task.order?.customer
//                 ?.address ||
//               null,

//             customerCity:
//               task.order?.customer
//                 ?.city ||
//               null,

//             tasks: [],
//           };
//         }

//         grouped[key].tasks.push(
//           task
//         );
//       }

//       return res.status(200).json({
//         success: true,
//         data:
//           Object.values(
//             grouped
//           ),
//       });
//     } catch (error) {
//       console.error(
//         "Get My Customer Tasks Error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };

import { Op, literal } from "sequelize";
import sequelize from "../config/database.js";
import Task from "../models/Tasks.js";
import Employee from "../models/Employee.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Shop from "../models/Shop.js";
import { consumeTaskInventory } from "../services/taskInventory.service.js";

import {
  createNotification,
  notifyShopAdmins,
  notifyCustomer,
} from "./notification.controller.js";

/* ============================================================
   CONSTANTS
============================================================ */

const TASK_TYPES = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

const TASK_SEQUENCE = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

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
   BASIC HELPERS
============================================================ */

function isValidTaskType(type) {
  return TASK_TYPES.includes(type);
}

function getTaskSequence(taskType) {
  return TASK_SEQUENCE_MAP[taskType] || 0;
}

function getTaskLabel(taskType) {
  return TASK_TYPE_LABELS[taskType] || taskType;
}

/* ============================================================
   SHOP / TENANT HELPERS
============================================================ */

function getShopId(req) {
  const shopId = req.user?.shopId;

  if (!shopId) return null;

  const parsed = Number(shopId);

  return Number.isFinite(parsed) ? parsed : null;
}

function getEmployeeId(req) {
  if (req.user?.role !== "employee") return null;

  const employeeId = Number(req.user?.id);

  return Number.isFinite(employeeId) ? employeeId : null;
}

function requireEmployeeContext(req, res) {
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
}

/* ============================================================
   ADMIN TENANT SCOPE
============================================================ */

function buildTaskWhereForAdmin(req) {
  const where = {};

  if (req.user?.shopId) {
    where["$employee.shop_id$"] = {
      [Op.or]: [req.user.shopId, null],
    };
  }

  return where;
}

/* ============================================================
   ORDER STATUS
============================================================ */

function impliedOrderStatus(taskType, taskStatus) {
  if (taskStatus === "pending") {
    return null;
  }

  switch (taskType) {
    case "pickup":
      return taskStatus === "completed" ? "processing" : "picked_up";

    case "wash":
    case "dry":
    case "iron":
    case "pack":
      return taskStatus === "completed" ? "ready_for_delivery" : "processing";

    case "delivery":
      return taskStatus === "completed" ? "delivered" : "out_for_delivery";

    default:
      return null;
  }
}

/* ============================================================
   ORDER TASK HELPERS
============================================================ */

/**
 * Get every task belonging to an order.
 *
 * IMPORTANT:
 * shop_id is also checked so one shop cannot accidentally use
 * another shop's order tasks for workflow validation.
 */
async function getOrderTasksSorted(orderId, shopId = null) {
  const where = {
    order_id: orderId,
  };

  if (shopId) {
    where.shop_id = shopId;
  }

  return Task.findAll({
    where,
    order: [
      ["sequence", "ASC"],
      ["createdAt", "ASC"],
      ["id", "ASC"],
    ],
  });
}

/**
 * When an order has multiple instances of the same task type,
 * only the latest instance is used for sequence validation.
 *
 * Example:
 *
 * pickup #1 completed
 * pickup #2 pending
 *
 * Latest pickup (#2) is considered.
 */
function latestTasksByType(allOrderTasks = []) {
  const map = {};

  for (const task of allOrderTasks) {
    if (
      !map[task.task_type] ||
      Number(task.id) > Number(map[task.task_type].id)
    ) {
      map[task.task_type] = task;
    }
  }

  return map;
}

/**
 * Previous TASK TYPES that DO NOT EXIST are ignored.
 *
 * Example:
 *
 * pickup = completed
 * wash   = completed
 * dry    = NOT ASSIGNED
 * iron   = pending
 *
 * Iron is allowed from dependency perspective because dry does not exist.
 */
function previousTasksCompleted(taskType, allOrderTasks = []) {
  const currentIndex = TASK_SEQUENCE.indexOf(taskType);

  if (currentIndex === -1) {
    return false;
  }

  const latest = latestTasksByType(allOrderTasks);

  return TASK_SEQUENCE.slice(0, currentIndex).every((type) => {
    if (!latest[type]) {
      return true;
    }

    return latest[type].status === "completed";
  });
}

/**
 * Returns the actual incomplete previous assigned tasks.
 */
function getBlockingTasks(taskType, allOrderTasks = []) {
  const currentSequence = getTaskSequence(taskType);
  const latest = latestTasksByType(allOrderTasks);

  return TASK_SEQUENCE.filter((type) => getTaskSequence(type) < currentSequence)
    .map((type) => latest[type])
    .filter(Boolean)
    .filter((task) => task.status !== "completed");
}

/**
 * Find the next assigned task in workflow.
 *
 * IMPORTANT:
 * This does NOT auto-start anything.
 */
function findNextTask(currentType, allOrderTasks = []) {
  const currentSequence = getTaskSequence(currentType);
  const latest = latestTasksByType(allOrderTasks);

  for (const type of TASK_SEQUENCE) {
    if (getTaskSequence(type) <= currentSequence) {
      continue;
    }

    if (latest[type] && latest[type].status !== "completed") {
      return latest[type];
    }
  }

  return null;
}

/* ============================================================
   SCHEDULE HELPERS
============================================================ */

/**
 * scheduled_time is the EARLIEST allowed start time.
 *
 * Before scheduled time:
 *   cannot start.
 *
 * At / after scheduled time:
 *   can start if workflow dependencies are complete.
 *
 * Being late does NOT invalidate the task.
 */
function isTaskScheduleReached(task, now = new Date()) {
  if (!task?.scheduled_time) {
    return true;
  }

  const scheduled = new Date(task.scheduled_time);

  if (Number.isNaN(scheduled.getTime())) {
    return false;
  }

  return scheduled.getTime() <= now.getTime();
}

/**
 * A task is late when:
 *
 * scheduled_time < now
 * AND
 * task is not completed.
 */
function isTaskLate(task, now = new Date()) {
  if (!task?.scheduled_time) {
    return false;
  }

  if (task.status === "completed") {
    return false;
  }

  const scheduled = new Date(task.scheduled_time);

  if (Number.isNaN(scheduled.getTime())) {
    return false;
  }

  return scheduled.getTime() < now.getTime();
}

/**
 * COMPLETE readiness rule.
 *
 * A task is ready only when BOTH are true:
 *
 * 1. Previous assigned workflow tasks are completed.
 * 2. Its own scheduled time has arrived.
 *
 * Urgent priority NEVER bypasses these rules.
 */
function isTaskReady(task, allOrderTasks = [], now = new Date()) {
  if (!task) {
    return false;
  }

  if (task.status === "completed") {
    return false;
  }

  const workflowReady = previousTasksCompleted(task.task_type, allOrderTasks);

  if (!workflowReady) {
    return false;
  }

  return isTaskScheduleReached(task, now);
}

/**
 * Gives frontend a useful reason why task is not ready.
 */
function getTaskWaitingReason(task, allOrderTasks = [], now = new Date()) {
  if (!task) {
    return null;
  }

  const blockingTasks = getBlockingTasks(task.task_type, allOrderTasks);

  if (blockingTasks.length > 0) {
    return {
      type: "workflow",
      tasks: blockingTasks.map((item) => ({
        id: item.id,
        task_type: item.task_type,
        label: getTaskLabel(item.task_type),
        status: item.status,
        employee_id: item.employee_id,
      })),
    };
  }

  if (!isTaskScheduleReached(task, now)) {
    const scheduled = new Date(task.scheduled_time);

    return {
      type: "schedule",
      scheduled_time: task.scheduled_time,
      scheduled_label: scheduled.toLocaleString(),
    };
  }

  return null;
}

/**
 * Add computed workflow/schedule fields to task response.
 */
function serializeTaskReadiness(task, allOrderTasks = [], now = new Date()) {
  const data = typeof task.toJSON === "function" ? task.toJSON() : { ...task };

  const blockingTasks = getBlockingTasks(task.task_type, allOrderTasks);

  const scheduleReached = isTaskScheduleReached(task, now);

  const late = isTaskLate(task, now);

  const ready =
    task.status !== "completed" &&
    blockingTasks.length === 0 &&
    scheduleReached;

  data.isReady = ready;
  data.scheduleReached = scheduleReached;
  data.isLate = late;

  data.workflowReady = blockingTasks.length === 0;

  data.blockingTasks = blockingTasks.map((item) => ({
    id: item.id,
    task_type: item.task_type,
    label: getTaskLabel(item.task_type),
    status: item.status,
    employee_id: item.employee_id,
  }));

  const waitingReason = getTaskWaitingReason(task, allOrderTasks, now);

  data.waitingReason = waitingReason;

  if (waitingReason?.type === "workflow") {
    data.waitingFor = waitingReason.tasks.map((item) => item.label);
  } else {
    data.waitingFor = [];
  }

  return data;
}

/* ============================================================
   ASSIGN MULTIPLE TASKS
============================================================ */

async function assignMultipleTasks(
  req,
  res,
  { order_id, customer_name, customer_phone, customer_address, notes, tasks },
) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one task is required.",
    });
  }

  /* ----------------------------------------------------------
     VALIDATE ALL ROWS BEFORE CREATING ANY TASK
  ---------------------------------------------------------- */

  for (const t of tasks) {
    if (!t.task_type || !TASK_TYPES.includes(t.task_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid task_type: ${t.task_type}`,
      });
    }

    if (!t.employee_id || !t.scheduled_time) {
      return res.status(400).json({
        success: false,
        message: `employee_id and scheduled_time are required for ${
          TASK_TYPE_LABELS[t.task_type] || t.task_type
        }`,
      });
    }

    const scheduled = new Date(t.scheduled_time);

    if (Number.isNaN(scheduled.getTime())) {
      return res.status(400).json({
        success: false,
        message: `Invalid scheduled_time for ${
          TASK_TYPE_LABELS[t.task_type] || t.task_type
        }.`,
      });
    }

    /**
     * Admin cannot create a brand-new task in the past.
     *
     * Once created, however, the employee is allowed to
     * complete it late.
     */
    if (scheduled.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: `Scheduled time for ${
          TASK_TYPE_LABELS[t.task_type] || t.task_type
        } cannot be in the past.`,
      });
    }

    if (t.priority && !["normal", "urgent"].includes(t.priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority for ${
          TASK_TYPE_LABELS[t.task_type] || t.task_type
        }.`,
      });
    }
  }

  const adminShopId = getShopId(req);

  let resolvedOrderId = order_id ? Number(order_id) : null;

  let resolvedName = String(customer_name || "").trim();

  let resolvedPhone = String(customer_phone || "").trim() || null;

  let resolvedAddress = String(customer_address || "").trim() || null;

  let order = null;

  /* ----------------------------------------------------------
     ORDER
  ---------------------------------------------------------- */

  if (resolvedOrderId) {
    const orderWhere = {
      id: resolvedOrderId,
    };

    if (adminShopId) {
      orderWhere.shop_id = adminShopId;
    }

    order = await Order.findOne({
      where: orderWhere,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name", "phone", "address", "city"],
          required: false,
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found in your shop.",
      });
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot assign tasks to a ${order.status} order.`,
      });
    }

    resolvedOrderId = order.id;

    /* --------------------------------------------------------
       DUPLICATE CHECK
       Same Order + Same Task + Same Employee = BLOCKED
    -------------------------------------------------------- */

    const existingTasks = await Task.findAll({
      where: {
        order_id: resolvedOrderId,
        ...(adminShopId ? { shop_id: adminShopId } : {}),
      },
      attributes: ["id", "task_type", "employee_id"],
    });

    const duplicateRows = tasks.filter((t) =>
      existingTasks.some(
        (existing) =>
          existing.task_type === t.task_type &&
          Number(existing.employee_id) === Number(t.employee_id),
      ),
    );

    if (duplicateRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `This task is already assigned to this employee: ${duplicateRows
          .map((t) => TASK_TYPE_LABELS[t.task_type] || t.task_type)
          .join(", ")}. Assign a different task type or employee.`,
      });
    }

    /**
     * Order.employee_id is only the primary/owner employee.
     *
     * It does NOT mean every task must belong to this employee.
     */
    if (!order.employee_id) {
      order.employee_id = Number(tasks[0].employee_id);

      await order.save();
    }

    if (!resolvedName) {
      resolvedName =
        order.customer?.name ||
        String(order.pickup_address || "").trim() ||
        `Order #${order.id}`;
    }

    if (!resolvedPhone) {
      resolvedPhone = order.customer?.phone || null;
    }

    if (!resolvedAddress) {
      resolvedAddress =
        String(
          order.customer
            ? [order.customer.address, order.customer.city]
                .filter(Boolean)
                .join(", ")
            : "",
        ).trim() ||
        order.pickup_address ||
        null;
    }
  }

  /* ----------------------------------------------------------
     NON-ORDER TASK CUSTOMER
  ---------------------------------------------------------- */

  if (!resolvedName) {
    return res.status(400).json({
      success: false,
      message: "customer_name is required (or link the task to an order).",
    });
  }

  /* ----------------------------------------------------------
     CREATE TASKS
  ---------------------------------------------------------- */

  const createdTasks = [];

  for (const t of tasks) {
    const employee = await Employee.findByPk(Number(t.employee_id));

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee not found for ${
          TASK_TYPE_LABELS[t.task_type] || t.task_type
        }`,
      });
    }

    if (
      adminShopId &&
      employee.shop_id &&
      Number(employee.shop_id) !== Number(adminShopId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only assign tasks to employees of your shop.",
      });
    }

    const taskShopId = adminShopId || employee.shop_id;

    if (!taskShopId) {
      return res.status(400).json({
        success: false,
        message: "Task shop could not be determined.",
      });
    }

    const task = await Task.create({
      shop_id: Number(taskShopId),
      order_id: resolvedOrderId,
      employee_id: Number(t.employee_id),

      customer_name: resolvedName,
      customer_phone: resolvedPhone,
      customer_address: resolvedAddress,

      task_type: t.task_type,

      sequence: TASK_SEQUENCE_MAP[t.task_type] || 1,

      scheduled_time: t.scheduled_time,

      priority: t.priority || "normal",

      status: "pending",

      activated_at: null,
      started_at: null,
      completed_at: null,

      notes: notes || null,
    });

    const created = await Task.findByPk(task.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation"],
        },
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount"],
          required: false,
        },
      ],
    });

    createdTasks.push(created);

    /* --------------------------------------------------------
       EMPLOYEE NOTIFICATION
    -------------------------------------------------------- */

    const scheduledLabel = new Date(t.scheduled_time).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    await createNotification({
      employeeId: Number(t.employee_id),
      orderId: resolvedOrderId,
      shopId: Number(taskShopId),
      title: "New task assigned",
      message: `${getTaskLabel(t.task_type)} task for ${resolvedName}${
        resolvedOrderId ? ` (order #${resolvedOrderId})` : ""
      } is scheduled for ${scheduledLabel}.`,
      type: "task",
      link: "/employee/mytask",
    });
  }

  /* ----------------------------------------------------------
     CUSTOMER NOTIFICATION
  ---------------------------------------------------------- */

  if (resolvedOrderId) {
    try {
      const orderWithCustomer = await Order.findByPk(resolvedOrderId, {
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "userId", "name"],
            required: false,
          },
        ],
      });

      if (orderWithCustomer?.customer) {
        await notifyCustomer(orderWithCustomer.customer, {
          title: "Task assigned to your order",
          message: `${tasks.length > 1 ? "Tasks have" : "A task has"} been assigned for your order #${resolvedOrderId}.`,
          type: "task",
          orderId: resolvedOrderId,
          link: `/customer/orders/${resolvedOrderId}`,
        });
      }
    } catch (notificationError) {
      console.error("Customer notification error:", notificationError.message);
    }
  }

  return res.status(201).json({
    success: true,
    message:
      createdTasks.length > 1
        ? `${createdTasks.length} tasks created successfully`
        : "Task assigned successfully",
    data: createdTasks.length === 1 ? createdTasks[0] : createdTasks,
  });
}

/* ============================================================
   ADMIN
   GET ALL TASKS
============================================================ */

export const getAllTasks = async (req, res) => {
  try {
    const { employee_id, order_id, status, task_type } = req.query;

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
          ],
          required: false,
        },
      ],

      order: [
        [literal("CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END"), "ASC"],
        ["sequence", "ASC"],
        ["scheduled_time", "ASC"],
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
   ADMIN
   ASSIGN TASK
============================================================ */

export const assignTask = async (req, res) => {
  try {
    const {
      order_id,
      employee_id,
      customer_name,
      customer_phone,
      customer_address,
      task_type,
      task_types,
      tasks,
      scheduled_time,
      priority,
      notes,
    } = req.body;

    /* --------------------------------------------------------
       NEW MODAL FORMAT
    -------------------------------------------------------- */

    if (Array.isArray(tasks) && tasks.length > 0) {
      return await assignMultipleTasks(req, res, {
        order_id,
        customer_name,
        customer_phone,
        customer_address,
        notes,
        tasks,
      });
    }

    /* --------------------------------------------------------
       LEGACY FORMAT
    -------------------------------------------------------- */

    if (!employee_id || !scheduled_time) {
      return res.status(400).json({
        success: false,
        message: "employee_id and scheduled_time are required",
      });
    }

    const baseTime = new Date(scheduled_time);

    if (Number.isNaN(baseTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduled_time.",
      });
    }

    if (baseTime.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time cannot be in the past.",
      });
    }

    /* --------------------------------------------------------
       TASK TYPES
    -------------------------------------------------------- */

    let typesToCreate = [];

    if (Array.isArray(task_types) && task_types.length > 0) {
      for (const type of task_types) {
        if (!TASK_TYPES.includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid task_type: ${type}`,
          });
        }
      }

      typesToCreate = [...new Set(task_types)];
    } else if (task_type) {
      if (!TASK_TYPES.includes(task_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task_type",
        });
      }

      typesToCreate = [task_type];
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide task_type (single) or task_types (array).",
      });
    }

    /* --------------------------------------------------------
       EMPLOYEE
    -------------------------------------------------------- */

    const employee = await Employee.findByPk(Number(employee_id));

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const adminShopId = getShopId(req);

    if (
      adminShopId &&
      employee.shop_id &&
      Number(employee.shop_id) !== Number(adminShopId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only assign tasks to employees of your shop.",
      });
    }

    /* --------------------------------------------------------
       ORDER
    -------------------------------------------------------- */

    let resolvedOrderId = order_id ? Number(order_id) : null;

    let resolvedName = String(customer_name || "").trim();

    let resolvedPhone = String(customer_phone || "").trim() || null;

    let resolvedAddress = String(customer_address || "").trim() || null;

    let order = null;

    if (resolvedOrderId) {
      const orderWhere = {
        id: resolvedOrderId,
      };

      if (adminShopId) {
        orderWhere.shop_id = adminShopId;
      }

      order = await Order.findOne({
        where: orderWhere,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["name", "phone", "address", "city"],
            required: false,
          },
        ],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found in your shop.",
        });
      }

      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot assign tasks to a ${order.status} order.`,
        });
      }

      /* ------------------------------------------------------
         DUPLICATE
      ------------------------------------------------------ */

      const existingTasks = await Task.findAll({
        where: {
          order_id: resolvedOrderId,

          ...(adminShopId
            ? {
                shop_id: adminShopId,
              }
            : {}),
        },

        attributes: ["id", "task_type", "employee_id"],
      });

      const duplicates = typesToCreate.filter((type) =>
        existingTasks.some(
          (existing) =>
            existing.task_type === type &&
            Number(existing.employee_id) === Number(employee_id),
        ),
      );

      if (duplicates.length > 0) {
        return res.status(400).json({
          success: false,
          message: `This task is already assigned to this employee: ${duplicates
            .map((type) => getTaskLabel(type))
            .join(", ")}.`,
        });
      }

      if (!order.employee_id) {
        order.employee_id = Number(employee_id);

        await order.save();
      }

      if (!resolvedName) {
        resolvedName =
          order.customer?.name ||
          String(order.pickup_address || "").trim() ||
          `Order #${order.id}`;
      }

      if (!resolvedPhone) {
        resolvedPhone = order.customer?.phone || null;
      }

      if (!resolvedAddress) {
        resolvedAddress =
          String(
            order.customer
              ? [order.customer.address, order.customer.city]
                  .filter(Boolean)
                  .join(", ")
              : "",
          ).trim() ||
          order.pickup_address ||
          null;
      }
    }

    if (!resolvedName) {
      return res.status(400).json({
        success: false,
        message: "customer_name is required (or link the task to an order).",
      });
    }

    /* --------------------------------------------------------
       CREATE
    -------------------------------------------------------- */

    const createdTasks = [];

    for (let i = 0; i < typesToCreate.length; i++) {
      const currentType = typesToCreate[i];

      const taskTime = new Date(baseTime.getTime() + i * 30 * 60 * 1000);

      const task = await Task.create({
        shop_id: adminShopId || employee.shop_id,

        order_id: resolvedOrderId,

        employee_id: Number(employee_id),

        customer_name: resolvedName,

        customer_phone: resolvedPhone,

        customer_address: resolvedAddress,

        task_type: currentType,

        sequence: TASK_SEQUENCE_MAP[currentType] || 1,

        scheduled_time: taskTime,

        priority: priority || "normal",

        status: "pending",

        activated_at: null,
        started_at: null,
        completed_at: null,

        notes: notes || null,
      });

      createdTasks.push(task);
    }

    /* --------------------------------------------------------
       NOTIFY EMPLOYEE
    -------------------------------------------------------- */

    const scheduledLabel = new Date(scheduled_time).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    await createNotification({
      employeeId: Number(employee_id),
      shopId: Number(taskShopId),
      orderId: resolvedOrderId,

      title:
        typesToCreate.length > 1
          ? "Multiple tasks assigned"
          : "New task assigned",

      message: `${
        typesToCreate.length > 1 ? "Tasks" : getTaskLabel(typesToCreate[0])
      } for ${resolvedName}${
        resolvedOrderId ? ` (order #${resolvedOrderId})` : ""
      } scheduled from ${scheduledLabel}.`,

      type: "task",

      link: "/employee/mytask",
    });

    /* --------------------------------------------------------
       CUSTOMER
    -------------------------------------------------------- */

    if (resolvedOrderId) {
      try {
        const orderWithCustomer = await Order.findByPk(resolvedOrderId, {
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "userId", "name"],
              required: false,
            },
          ],
        });

        if (orderWithCustomer?.customer) {
          await notifyCustomer(orderWithCustomer.customer, {
            title: "Task assigned to your order",

            message: `Tasks have been assigned for your order #${resolvedOrderId}.`,

            type: "task",

            orderId: resolvedOrderId,

            link: `/customer/orders/${resolvedOrderId}`,
          });
        }
      } catch (error) {
        console.error("Customer notification error:", error.message);
      }
    }

    return res.status(201).json({
      success: true,

      message:
        createdTasks.length > 1
          ? `${createdTasks.length} tasks created successfully`
          : "Task assigned successfully",

      data: createdTasks.length === 1 ? createdTasks[0] : createdTasks,
    });
  } catch (error) {
    console.error("Assign Task Error:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: error.errors?.[0]?.message || error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — MY TASKS
============================================================ */

export const getMyTasks = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const { status, type, date } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (status) {
      if (!["pending", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status.",
        });
      }

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
      const start = new Date(`${date}T00:00:00`);

      const end = new Date(`${date}T23:59:59`);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date.",
        });
      }

      where.scheduled_time = {
        [Op.between]: [start, end],
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
          ],
          required: false,
        },
      ],

      order: [
        [literal("CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END"), "ASC"],
        ["sequence", "ASC"],
        ["scheduled_time", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    const now = new Date();

    const orderCache = new Map();

    const response = [];

    for (const task of tasks) {
      let orderTasks = [];

      if (task.order_id) {
        const cacheKey = `${shopId}-${task.order_id}`;

        if (!orderCache.has(cacheKey)) {
          const allTasks = await getOrderTasksSorted(task.order_id, shopId);

          orderCache.set(cacheKey, allTasks);
        }

        orderTasks = orderCache.get(cacheKey);
      }

      response.push(serializeTaskReadiness(task, orderTasks, now));
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get My Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — TASK STATS
============================================================ */

export const getMyTaskStats = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const { date } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (date) {
      const start = new Date(`${date}T00:00:00`);

      const end = new Date(`${date}T23:59:59`);

      where.scheduled_time = {
        [Op.between]: [start, end],
      };
    }

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.count({
        where,
      }),

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
    console.error("Get My Task Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — GET SINGLE TASK
============================================================ */

export const getTaskById = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const task = await Task.findOne({
      where: {
        id: req.params.id,
        employee_id: employeeId,
        shop_id: shopId,
      },

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
        message: "Task not found",
      });
    }

    let orderTasks = [];

    if (task.order_id) {
      orderTasks = await getOrderTasksSorted(task.order_id, shopId);
    }

    const data = serializeTaskReadiness(task, orderTasks, new Date());

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Task By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — UPDATE TASK STATUS
============================================================ */

/**
 * PATCH /api/tasks/:id/status
 *
 * Allowed:
 *   pending
 *   in_progress
 *   completed
 *
 * IMPORTANT:
 *
 * pending -> in_progress
 *   requires:
 *   1. previous assigned tasks completed
 *   2. scheduled time reached
 *
 * in_progress -> completed
 *   allowed after task has actually started.
 *
 * pending -> completed
 *   BLOCKED.
 *
 * Next task:
 *   NEVER auto-starts.
 *
 * Late:
 *   ALLOWED.
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, materials = [] } = req.body;

    const allowedStatuses = ["pending", "in_progress", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    /* ----------------------------------------------------------
       GET TASK
    ---------------------------------------------------------- */

    const task = await Task.findOne({
      where: {
        id: req.params.id,
        employee_id: employeeId,
        shop_id: shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "shop_id"],
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

              attributes: ["id", "userId", "name"],

              required: false,
            },
          ],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    /* ----------------------------------------------------------
       NO CHANGE
    ---------------------------------------------------------- */

    if (task.status === status) {
      return res.status(200).json({
        success: true,
        message: "Task status is already set to this value.",
        data: task,
      });
    }

    /* ----------------------------------------------------------
       COMPLETED TASK CANNOT BE CHANGED
    ---------------------------------------------------------- */

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed task cannot be changed.",
      });
    }

    /* ----------------------------------------------------------
       PENDING -> COMPLETED BLOCK
    ---------------------------------------------------------- */

    if (status === "completed" && task.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Start the task first, then complete it.",
      });
    }

    /* ----------------------------------------------------------
       ORDER TASKS
    ---------------------------------------------------------- */

    let allOrderTasks = [];

    if (task.order_id) {
      allOrderTasks = await getOrderTasksSorted(task.order_id, shopId);
    }

    /* ----------------------------------------------------------
   MATERIAL USAGE VALIDATION
   Only wash, dry, iron and pack can use inventory
---------------------------------------------------------- */

    const materialTaskTypes = ["wash", "dry", "iron", "pack"];

    if (
      status === "completed" &&
      materials.length > 0 &&
      !materialTaskTypes.includes(task.task_type)
    ) {
      return res.status(400).json({
        success: false,
        message: `Materials cannot be used for ${task.task_type} tasks.`,
        code: "MATERIALS_NOT_ALLOWED",
      });
    }

    /* ----------------------------------------------------------
       START / COMPLETE VALIDATION
    ---------------------------------------------------------- */

    if (status === "in_progress" || status === "completed") {
      const blockingTasks = getBlockingTasks(task.task_type, allOrderTasks);

      /* --------------------------------------------------------
         WORKFLOW BLOCK
      -------------------------------------------------------- */

      if (blockingTasks.length > 0) {
        const labels = blockingTasks
          .map((item) => `${getTaskLabel(item.task_type)} (${item.status})`)
          .join(", ");

        return res.status(400).json({
          success: false,

          message: `Cannot ${
            status === "in_progress" ? "start" : "complete"
          } this task yet. Complete these first: ${labels}.`,

          code: "WORKFLOW_NOT_READY",

          blockingTasks: blockingTasks.map((item) => ({
            id: item.id,
            task_type: item.task_type,
            label: getTaskLabel(item.task_type),
            status: item.status,
          })),
        });
      }

      /* --------------------------------------------------------
         SCHEDULE BLOCK
      -------------------------------------------------------- */

      if (!isTaskScheduleReached(task, new Date())) {
        const scheduled = new Date(task.scheduled_time);

        return res.status(400).json({
          success: false,

          message: `This task is scheduled to start at ${scheduled.toLocaleString()}. You cannot start it before that time.`,

          code: "TASK_NOT_SCHEDULED_YET",

          scheduled_time: task.scheduled_time,
        });
      }
    }

    /* ----------------------------------------------------------
       ONE ACTIVE TASK PER EMPLOYEE
    ---------------------------------------------------------- */

    if (status === "in_progress" && task.status !== "in_progress") {
      const existingActive = await Task.findOne({
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
        /**
         * IMPORTANT:
         *
         * We only pause the existing task because one employee
         * can work on one task at a time.
         *
         * This is NOT workflow auto-start.
         */
        existingActive.status = "pending";

        await existingActive.save();

        await createNotification({
          employeeId: employeeId,
          shopId: Number(shopId),
          taskId: existingActive.id,

          orderId: existingActive.order_id,

          title: `Task paused: ${getTaskLabel(existingActive.task_type)}`,

          message: `Your ${getTaskLabel(
            existingActive.task_type,
          )} task has been paused so you can work on another task. You can resume it later.`,

          type: "task",

          link: "/employee/mytask",
        });
      }
    }

    /* ----------------------------------------------------------
   LIFECYCLE TIMESTAMPS + INVENTORY
---------------------------------------------------------- */

    const now = new Date();

    const transaction = await sequelize.transaction();

    try {
      /* --------------------------------------------------------
     INVENTORY DEDUCTION
     Only when task is completed
  -------------------------------------------------------- */

      if (status === "completed" && materials.length > 0) {
        await consumeTaskInventory({
          shopId,
          taskId: task.id,
          orderId: task.order_id,
          employeeId,
          materials,
          transaction,
        });
      }

      /* --------------------------------------------------------
     LIFECYCLE TIMESTAMPS
  -------------------------------------------------------- */

      if (status === "in_progress") {
        if (!task.started_at) {
          task.started_at = now;
        }

        if (!task.activated_at) {
          task.activated_at = now;
        }
      }

      if (status === "completed") {
        if (!task.started_at) {
          task.started_at = now;
        }

        if (!task.activated_at) {
          task.activated_at = task.started_at;
        }

        task.completed_at = task.completed_at || now;
      }

      task.status = status;

      await task.save({ transaction });

      /* --------------------------------------------------------
     COMMIT
  -------------------------------------------------------- */

      await transaction.commit();
    } catch (error) {
      /* --------------------------------------------------------
     ROLLBACK
  -------------------------------------------------------- */

      await transaction.rollback();

      throw error;
    }

    /* ----------------------------------------------------------
       REFRESH TASK
    ---------------------------------------------------------- */

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation", "shop_id"],
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
            "delivery_time",
            "customer_id",
            "shop_id",
          ],
          required: false,
        },
      ],
    });

    /* ----------------------------------------------------------
       ORDER STATUS UPDATE
    ---------------------------------------------------------- */

    let freshOrder = null;

    if (task.order_id) {
      freshOrder = await Order.findOne({
        where: {
          id: task.order_id,
          shop_id: shopId,
        },

        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "userId", "name"],
            required: false,
          },
        ],
      });
    }

    const previousOrderStatus =
      freshOrder?.status || task.order?.status || null;

    if (freshOrder && freshOrder.status !== "cancelled") {
      const implied = impliedOrderStatus(task.task_type, status);

      const currentRank = ORDER_STATUS_RANK[freshOrder.status] ?? -1;

      const impliedRank = ORDER_STATUS_RANK[implied] ?? -1;

      /**
       * Never move an order backward.
       */
      if (implied && impliedRank > currentRank) {
        freshOrder.status = implied;

        if (implied === "delivered") {
          /**
           * Order.delivery_time is STRING in this project.
           */
          freshOrder.delivery_time = new Date().toISOString();
        }

        await freshOrder.save();
      }
    }

    /* ----------------------------------------------------------
       IMPORTANT:
       DO NOT AUTO-START NEXT TASK
    ---------------------------------------------------------- */

    let nextTask = null;
    let nextEmployee = null;

    if (status === "completed" && task.order_id) {
      allOrderTasks = await getOrderTasksSorted(task.order_id, shopId);

      nextTask = findNextTask(task.task_type, allOrderTasks);

      if (nextTask && nextTask.employee_id) {
        nextEmployee = await Employee.findByPk(nextTask.employee_id, {
          attributes: ["id", "name"],
        }).catch(() => null);
      }

      /**
       * DO NOT DO THIS:
       *
       * next.status = "in_progress";
       *
       * The next employee must click Start.
       *
       * It remains pending.
       */
    }

    /* ----------------------------------------------------------
       NEXT TASK READINESS
    ---------------------------------------------------------- */

    let nextTaskReadiness = null;

    if (nextTask) {
      nextTaskReadiness = serializeTaskReadiness(
        nextTask,
        allOrderTasks,
        new Date(),
      );
    }

    /* ----------------------------------------------------------
       NOTIFICATION DATA
    ---------------------------------------------------------- */

    const shopIdForAdmin =
      task.employee?.shop_id ||
      freshOrder?.shop_id ||
      task.order?.shop_id ||
      shopId;

    const typeLabel = getTaskLabel(task.task_type);

    const orderId = task.order?.id || task.order_id;

    const customerName =
      task.customer_name || task.order?.customer?.name || "the customer";

    const newOrderStatus = freshOrder?.status || task.order?.status || null;

    const orderStatusChanged =
      previousOrderStatus !== newOrderStatus && Boolean(newOrderStatus);

    /* ----------------------------------------------------------
       ADMIN NOTIFICATION
    ---------------------------------------------------------- */

    if (status === "completed") {
      let adminMessage = `${task.employee?.name || "An employee"} completed the ${typeLabel} task for ${customerName}'s Order #${orderId}.`;

      if (nextTask && nextEmployee) {
        const nextLabel = getTaskLabel(nextTask.task_type);

        const nextReady = nextTaskReadiness?.isReady;

        if (nextReady) {
          adminMessage += ` Next task (${nextLabel}) is now ready for ${nextEmployee.name} to start.`;
        } else if (nextTaskReadiness?.waitingReason?.type === "schedule") {
          const scheduled = new Date(nextTask.scheduled_time);

          adminMessage += ` Next task (${nextLabel}) is assigned to ${nextEmployee.name}, but it is scheduled for ${scheduled.toLocaleString()}.`;
        } else {
          adminMessage += ` Next task (${nextLabel}) is assigned to ${nextEmployee.name} and is waiting for its prerequisites.`;
        }
      } else if (task.task_type === "delivery") {
        adminMessage += " Order is now delivered!";
      } else if (task.task_type !== "pickup") {
        adminMessage +=
          " Order is ready for delivery — assign a delivery employee.";
      }

      if (orderStatusChanged) {
        adminMessage += ` Order status: ${
          ORDER_STATUS_LABELS[previousOrderStatus] || previousOrderStatus
        } → ${ORDER_STATUS_LABELS[newOrderStatus] || newOrderStatus}.`;
      }

      await notifyShopAdmins(shopIdForAdmin, {
        title: `Task completed: ${typeLabel}`,

        message: adminMessage,

        type: "task",

        orderId: orderId,

        link: "/admin/tasks",
      });
    } else {
      const actionWord = status === "in_progress" ? "started" : "updated";

      await notifyShopAdmins(shopIdForAdmin, {
        title: "Task update from employee",

        message: `${task.employee?.name || "An employee"} ${actionWord} the ${typeLabel} task for Order #${orderId}.${
          orderStatusChanged
            ? ` Order status: ${
                ORDER_STATUS_LABELS[previousOrderStatus] || previousOrderStatus
              } → ${ORDER_STATUS_LABELS[newOrderStatus] || newOrderStatus}.`
            : ""
        }`,

        type: "task",

        orderId: orderId,

        link: "/admin/tasks",
      });
    }

    /* ----------------------------------------------------------
       NEXT EMPLOYEE NOTIFICATION
    ---------------------------------------------------------- */

    if (status === "completed" && nextTask) {
      const completedLabel = getTaskLabel(task.task_type);

      const nextLabel = getTaskLabel(nextTask.task_type);

      const nextReady = nextTaskReadiness?.isReady;

      if (nextTask.employee_id !== task.employee_id) {
        let message = `${task.employee?.name || "An employee"} completed ${completedLabel} for ${customerName}'s Order #${orderId}.`;

        if (nextReady) {
          message += ` Your ${nextLabel} task is ready to start.`;
        } else if (nextTaskReadiness?.waitingReason?.type === "schedule") {
          const scheduled = new Date(nextTask.scheduled_time);

          message += ` Your ${nextLabel} task is scheduled for ${scheduled.toLocaleString()}. It will become ready at that time.`;
        } else {
          message += ` Your ${nextLabel} task is waiting for the previous workflow task(s) to complete.`;
        }

        await createNotification({
          employeeId: nextTask.employee_id,
          shopId: Number(shopId),
          taskId: nextTask.id,

          orderId: orderId,

          title: `${completedLabel} completed — ${nextLabel}`,

          message: message,

          type: "task",

          link: "/employee/mytask",
        });
      } else {
        let message = `Your ${completedLabel.toLowerCase()} task for ${customerName}'s Order #${orderId} is completed.`;

        if (nextReady) {
          message += ` Your next task is ${nextLabel} and is ready to start.`;
        } else if (nextTaskReadiness?.waitingReason?.type === "schedule") {
          const scheduled = new Date(nextTask.scheduled_time);

          message += ` Your next task is ${nextLabel}, scheduled for ${scheduled.toLocaleString()}.`;
        } else {
          message += ` Your next task is ${nextLabel}, but it is waiting for its prerequisites.`;
        }

        await createNotification({
          employeeId: nextTask.employee_id,
          shopId: Number(shopId),
          taskId: nextTask.id,

          orderId: orderId,

          title: `${completedLabel} completed — next: ${nextLabel}`,

          message: message,

          type: "task",

          link: "/employee/mytask",
        });
      }
    }

    /* ----------------------------------------------------------
       CUSTOMER NOTIFICATION
    ---------------------------------------------------------- */

    const effectiveOrder = freshOrder || task.order;

    if (effectiveOrder) {
      const orderStatus = effectiveOrder.status;

      const customerObj = effectiveOrder.customer || null;

      /* --------------------------------------------------------
         DELIVERY COMPLETED
      -------------------------------------------------------- */

      if (task.task_type === "delivery" && status === "completed") {
        await notifyCustomer(customerObj, {
          shopId: Number(shopId),
          title: "Order delivered — Review us!",

          message: `Your order #${orderId} has been delivered! We'd love your feedback — write a review to share your experience.`,

          type: "order",

          orderId: orderId,

          link: "/customer/reviews",
        });
      } else if (orderStatusChanged) {
        await notifyCustomer(customerObj, {
          title: "Order status updated",
          shopId: Number(shopId),
          message: `Your order #${orderId} is now ${
            ORDER_STATUS_LABELS[orderStatus] || orderStatus
          }.`,

          type: "order",

          orderId: orderId,

          link: `/customer/orders/${orderId}`,
        });
      }
    }

    /* ----------------------------------------------------------
       FINAL RESPONSE
    ---------------------------------------------------------- */

    const finalTask = updatedTask || task;

    let finalOrderTasks = allOrderTasks;

    if (
      finalTask.order_id &&
      (!finalOrderTasks || finalOrderTasks.length === 0)
    ) {
      finalOrderTasks = await getOrderTasksSorted(finalTask.order_id, shopId);
    }

    const responseTask = serializeTaskReadiness(
      finalTask,
      finalOrderTasks,
      new Date(),
    );

    return res.status(200).json({
      success: true,

      message:
        status === "in_progress"
          ? "Task started successfully."
          : "Task completed successfully.",

      data: responseTask,

      nextTask: nextTask ? nextTaskReadiness : null,
    });
  } catch (error) {
    console.error("Update Task Status Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — UPDATE NOTES
============================================================ */

export const updateTaskNotes = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const task = await Task.findOne({
      where: {
        id: req.params.id,
        employee_id: employeeId,
        shop_id: shopId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.notes = req.body.notes ?? task.notes;

    await task.save();

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Update Task Notes Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — GET ORDER TASKS
============================================================ */

export const getOrderTasks = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const adminShopId = getShopId(req);

    const orderWhere = {
      id: orderId,
    };

    if (adminShopId) {
      orderWhere.shop_id = adminShopId;
    }

    const order = await Order.findOne({
      where: orderWhere,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const taskWhere = {
      order_id: orderId,
    };

    if (adminShopId) {
      taskWhere.shop_id = adminShopId;
    }

    const tasks = await Task.findAll({
      where: taskWhere,

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation", "shop_id"],
        },
      ],

      order: [
        ["sequence", "ASC"],
        ["scheduled_time", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    const now = new Date();

    const response = tasks.map((task) =>
      serializeTaskReadiness(task, tasks, now),
    );

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get Order Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — REASSIGN TASK
============================================================ */

/**
 * Body:
 *
 * {
 *   employee_id: 12,
 *   force: false
 * }
 *
 * Same-time employee conflict is only a warning on frontend.
 *
 * Backend does NOT block reassignment because of schedule overlap.
 */
export const reassignTask = async (req, res) => {
  try {
    const { employee_id, force = false } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: "employee_id is required",
      });
    }

    const taskId = Number(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const adminShopId = getShopId(req);

    /* ----------------------------------------------------------
       GET TASK
    ---------------------------------------------------------- */

    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "shop_id"],
        },

        {
          model: Order,
          as: "order",
          attributes: ["id", "shop_id"],
          required: false,
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    /* ----------------------------------------------------------
       SHOP ACCESS
    ---------------------------------------------------------- */

    const taskShopId =
      task.shop_id || task.employee?.shop_id || task.order?.shop_id;

    if (
      adminShopId &&
      taskShopId &&
      Number(taskShopId) !== Number(adminShopId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot reassign tasks from another shop.",
      });
    }

    /* ----------------------------------------------------------
       COMPLETED TASK
    ---------------------------------------------------------- */

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot reassign a completed task.",
      });
    }

    /* ----------------------------------------------------------
       NEW EMPLOYEE
    ---------------------------------------------------------- */

    const newEmployee = await Employee.findByPk(Number(employee_id));

    if (!newEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (
      adminShopId &&
      newEmployee.shop_id &&
      Number(newEmployee.shop_id) !== Number(adminShopId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot assign to an employee from a different shop.",
      });
    }

    /* ----------------------------------------------------------
       SAME EMPLOYEE
    ---------------------------------------------------------- */

    if (Number(task.employee_id) === Number(employee_id)) {
      return res.status(400).json({
        success: false,
        message: "Task is already assigned to this employee.",
      });
    }

    /* ----------------------------------------------------------
       DUPLICATE TASK
    ---------------------------------------------------------- */

    if (task.order_id) {
      const duplicate = await Task.findOne({
        where: {
          order_id: task.order_id,

          task_type: task.task_type,

          employee_id: Number(employee_id),

          id: {
            [Op.ne]: taskId,
          },

          ...(adminShopId
            ? {
                shop_id: adminShopId,
              }
            : {}),
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `A ${getTaskLabel(
            task.task_type,
          )} task is already assigned to this employee for this order.`,
        });
      }
    }

    /* ----------------------------------------------------------
       PRESERVE OLD STATE SAFELY
    ---------------------------------------------------------- */

    const oldEmployeeId = Number(task.employee_id);

    const oldEmployeeName = task.employee?.name || "previous employee";

    /**
     * If an in-progress task is reassigned,
     * the new employee must manually start it.
     *
     * We do NOT automatically start it.
     */
    if (task.status === "in_progress") {
      task.status = "pending";
    }

    task.employee_id = Number(employee_id);

    /**
     * If reassigned, activate again only when employee
     * manually starts it.
     */
    task.activated_at = null;

    task.started_at = null;

    /**
     * completed_at should normally be null because completed
     * tasks cannot be reassigned.
     */
    task.completed_at = null;

    await task.save();

    /* ----------------------------------------------------------
       NEW EMPLOYEE NOTIFICATION
    ---------------------------------------------------------- */

    await createNotification({
      employeeId: Number(employee_id),
      shopId: Number(taskShopId),
      taskId: task.id,

      orderId: task.order_id,

      title: "Task reassigned to you",

      message: `${getTaskLabel(task.task_type)} task${
        task.order_id ? ` for Order #${task.order_id}` : ""
      } has been reassigned to you from ${oldEmployeeName}. Please start it manually when it becomes ready.`,

      type: "task",

      link: "/employee/mytask",
    });

    /* ----------------------------------------------------------
       OLD EMPLOYEE NOTIFICATION
    ---------------------------------------------------------- */

    if (oldEmployeeId && oldEmployeeId !== Number(employee_id)) {
      await createNotification({
        employeeId: oldEmployeeId,
        shopId: Number(taskShopId),
        taskId: task.id,

        orderId: task.order_id,

        title: "Task reassigned",

        message: `The ${getTaskLabel(task.task_type)} task${
          task.order_id ? ` for Order #${task.order_id}` : ""
        } has been reassigned to another employee.`,

        type: "task",

        link: "/employee/mytask",
      }).catch((notificationError) => {
        console.error(
          "Old employee notification error:",
          notificationError.message,
        );
      });
    }

    /* ----------------------------------------------------------
       RELOAD
    ---------------------------------------------------------- */

    const updated = await Task.findByPk(taskId, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation", "shop_id"],
        },

        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount"],
          required: false,
        },
      ],
    });

    /* ----------------------------------------------------------
       RETURN
    ---------------------------------------------------------- */

    return res.status(200).json({
      success: true,

      message: `${getTaskLabel(
        task.task_type,
      )} reassigned to ${newEmployee.name}`,

      data: updated,

      warning: force
        ? null
        : "Employee schedule conflicts are treated as warnings only. The task can still be assigned.",
    });
  } catch (error) {
    console.error("Reassign Task Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — TASK HISTORY
============================================================ */

export const getAdminTaskHistory = async (req, res) => {
  try {
    const {
      employee_id,
      customer,
      order_id,
      task_type,
      status,
      startDate,
      endDate,
    } = req.query;

    const adminShopId = getShopId(req);

    const where = {};

    if (adminShopId) {
      where["$employee.shop_id$"] = {
        [Op.or]: [adminShopId, null],
      };
    }

    if (employee_id) {
      where.employee_id = Number(employee_id);
    }

    if (order_id) {
      where.order_id = Number(order_id);
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

    if (status) {
      if (!["pending", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status.",
        });
      }

      where.status = status;
    }

    if (customer && String(customer).trim()) {
      where.customer_name = {
        [Op.like]: `%${String(customer).trim()}%`,
      };
    }

    if (startDate && endDate) {
      where.scheduled_time = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),

          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.scheduled_time = {
        [Op.gte]: new Date(`${startDate}T00:00:00`),
      };
    } else if (endDate) {
      where.scheduled_time = {
        [Op.lte]: new Date(`${endDate}T23:59:59`),
      };
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation", "shop_id"],
        },

        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount"],
          required: false,

          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "name", "phone"],
              required: false,
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get Admin Task History Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — TASK HISTORY
============================================================ */

export const getEmployeeTaskHistory = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const { status, task_type, startDate, endDate } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (status) {
      if (!["pending", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status.",
        });
      }

      where.status = status;
    }

    if (task_type) {
      if (!isValidTaskType(task_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task type.",
        });
      }

      where.task_type = task_type;
    }

    if (startDate && endDate) {
      where.scheduled_time = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),

          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.scheduled_time = {
        [Op.gte]: new Date(`${startDate}T00:00:00`),
      };
    } else if (endDate) {
      where.scheduled_time = {
        [Op.lte]: new Date(`${endDate}T23:59:59`),
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
          ],
          required: false,

          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "name", "phone", "address", "city"],
              required: false,
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get Employee Task History Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — CUSTOMER TASKS
============================================================ */

export const getMyCustomerTasks = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const tasks = await Task.findAll({
      where: {
        shop_id: shopId,

        employee_id: employeeId,
      },

      include: [
        {
          model: Order,
          as: "order",

          attributes: ["id", "status", "total_amount"],

          required: false,

          include: [
            {
              model: Customer,
              as: "customer",

              attributes: ["id", "name", "phone", "address", "city"],

              required: false,
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    const grouped = {};

    for (const task of tasks) {
      const key = task.customer_name || "Unknown";

      if (!grouped[key]) {
        grouped[key] = {
          customerName: key,

          customerPhone:
            task.customer_phone || task.order?.customer?.phone || null,

          customerAddress:
            task.customer_address || task.order?.customer?.address || null,

          customerCity: task.order?.customer?.city || null,

          tasks: [],
        };
      }

      grouped[key].tasks.push(task);
    }

    return res.status(200).json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error("Get My Customer Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
