// import React, { useMemo, useState } from "react";
// import {
//   CheckCircle2,
//   Clock3,
//   Loader2,
//   Play,
//   RefreshCw,
//   MapPin,
//   Phone,
//   User,
//   Package,
//   AlertCircle,
//   ChevronDown,
//   ChevronUp,
//   CalendarDays,
//   ClipboardList,
//   Truck,
//   WashingMachine,
//   Shirt,
//   PackageCheck,
//   Bike,
//   Search,
// } from "lucide-react";
// import toast from "react-hot-toast";

// import { useMyTasks } from "../../hooks/useMyTasks";

// /* ============================================================
//    CONSTANTS
// ============================================================ */

// const TASK_TYPE_LABEL = {
//   pickup: "Pickup",
//   wash: "Wash",
//   dry: "Dry Cleaning",
//   iron: "Ironing",
//   pack: "Packing",
//   delivery: "Delivery",
// };

// const TASK_TYPE_ICON = {
//   pickup: Truck,
//   wash: WashingMachine,
//   dry: WashingMachine,
//   iron: Shirt,
//   pack: PackageCheck,
//   delivery: Bike,
// };

// const STATUS_LABEL = {
//   pending: "Pending",
//   in_progress: "In Progress",
//   completed: "Completed",
// };

// const STATUS_FILTERS = [
//   {
//     value: "all",
//     label: "All Tasks",
//   },
//   {
//     value: "pending",
//     label: "Pending",
//   },
//   {
//     value: "in_progress",
//     label: "In Progress",
//   },
//   {
//     value: "completed",
//     label: "Completed",
//   },
// ];

// /* ============================================================
//    HELPERS
// ============================================================ */

// const formatTaskType = (type) => TASK_TYPE_LABEL[type] || type || "Task";

// const formatStatus = (status) => STATUS_LABEL[status] || status || "Unknown";

// const formatDateTime = (value) => {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "—";
//   }

//   return date.toLocaleString([], {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const formatDate = (value) => {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "—";
//   }

//   return date.toLocaleDateString([], {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// /* ============================================================
//    STATUS BADGE
// ============================================================ */

// function StatusBadge({ status }) {
//   if (status === "completed") {
//     return (
//       <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
//         <CheckCircle2 size={14} />
//         Completed
//       </span>
//     );
//   }

//   if (status === "in_progress") {
//     return (
//       <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
//         <Loader2 size={14} />
//         In Progress
//       </span>
//     );
//   }

//   return (
//     <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
//       <Clock3 size={14} />
//       Pending
//     </span>
//   );
// }

// /* ============================================================
//    PRIORITY BADGE
// ============================================================ */

// function PriorityBadge({ priority }) {
//   if (priority === "urgent") {
//     return (
//       <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
//         <AlertCircle size={13} />
//         URGENT
//       </span>
//     );
//   }

//   return (
//     <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
//       NORMAL
//     </span>
//   );
// }

// /* ============================================================
//    READY BADGE
// ============================================================ */

// function ReadyBadge({ task }) {
//   if (task.status === "completed") {
//     return null;
//   }

//   if (task.status === "in_progress") {
//     return (
//       <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
//         <Play size={12} />
//         Active
//       </span>
//     );
//   }

//   if (task.isReady) {
//     return (
//       <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
//         <CheckCircle2 size={12} />
//         Ready
//       </span>
//     );
//   }

//   return (
//     <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
//       <Clock3 size={12} />
//       Waiting
//     </span>
//   );
// }

// /* ============================================================
//    STAT CARD
// ============================================================ */

// function StatCard({ title, value, icon: Icon, description, iconClass }) {
//   return (
//     <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
//       <div className="flex items-start justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-500">{title}</p>

//           <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>

//           {description && (
//             <p className="mt-1 text-xs text-gray-500">{description}</p>
//           )}
//         </div>

//         <div
//           className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
//         >
//           <Icon size={21} />
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ============================================================
//    TASK ICON
// ============================================================ */

// function TaskIcon({ taskType }) {
//   const Icon = TASK_TYPE_ICON[taskType] || ClipboardList;

//   return (
//     <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
//       <Icon size={21} />
//     </div>
//   );
// }

// /* ============================================================
//    EMPTY STATE
// ============================================================ */

// function EmptyState({ search }) {
//   return (
//     <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
//       <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
//         <ClipboardList size={26} />
//       </div>

//       <h3 className="mt-4 text-base font-semibold text-gray-900">
//         {search ? "No matching tasks" : "No tasks found"}
//       </h3>

//       <p className="mt-1 max-w-md text-sm text-gray-500">
//         {search
//           ? "Try changing your search or status filter."
//           : "You currently don't have any tasks assigned to you."}
//       </p>
//     </div>
//   );
// }

// /* ============================================================
//    SKELETON
// ============================================================ */

// function TaskSkeleton() {
//   return (
//     <div className="space-y-4">
//       {[1, 2, 3].map((item) => (
//         <div
//           key={item}
//           className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
//         >
//           <div className="flex gap-4">
//             <div className="h-11 w-11 rounded-xl bg-gray-200" />

//             <div className="flex-1">
//               <div className="h-4 w-32 rounded bg-gray-200" />

//               <div className="mt-3 h-3 w-48 rounded bg-gray-200" />

//               <div className="mt-5 h-10 w-full rounded bg-gray-100" />
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// /* ============================================================
//    TASK CARD
// ============================================================ */

// function TaskCard({
//   task,
//   onStart,
//   onComplete,
//   updatingTaskId,
//   expanded,
//   onToggle,
// }) {
//   const isUpdating = updatingTaskId === task.id;

//   const canStart = task.status === "pending" && task.isReady === true;

//   const canComplete = task.status === "in_progress";

//   return (
//     <div
//       className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
//         task.priority === "urgent" ? "border-red-200" : "border-gray-200"
//       }`}
//     >
//       {/* ======================================================
//           HEADER
//       ====================================================== */}

//       <div className="p-5">
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//           <div className="flex min-w-0 gap-4">
//             <TaskIcon taskType={task.task_type} />

//             <div className="min-w-0">
//               <div className="flex flex-wrap items-center gap-2">
//                 <h3 className="text-base font-bold text-gray-900">
//                   {formatTaskType(task.task_type)}
//                 </h3>

//                 <PriorityBadge priority={task.priority} />

//                 <ReadyBadge task={task} />
//               </div>

//               <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
//                 <span>Task #{task.id}</span>

//                 {task.order_id && <span>Order #{task.order_id}</span>}

//                 {task.sequence && <span>Step {task.sequence}</span>}
//               </div>
//             </div>
//           </div>

//           <StatusBadge status={task.status} />
//         </div>

//         {/* ====================================================
//             CUSTOMER / ORDER INFO
//         ==================================================== */}

//         <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
//           <div className="rounded-xl bg-gray-50 p-4">
//             <div className="flex items-start gap-3">
//               <User size={18} className="mt-0.5 shrink-0 text-gray-500" />

//               <div className="min-w-0">
//                 <p className="text-xs font-medium text-gray-500">Customer</p>

//                 <p className="mt-1 truncate text-sm font-semibold text-gray-900">
//                   {task.customer_name || "—"}
//                 </p>

//                 {task.customer_phone && (
//                   <a
//                     href={`tel:${task.customer_phone}`}
//                     className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
//                   >
//                     <Phone size={12} />
//                     {task.customer_phone}
//                   </a>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="rounded-xl bg-gray-50 p-4">
//             <div className="flex items-start gap-3">
//               <CalendarDays
//                 size={18}
//                 className="mt-0.5 shrink-0 text-gray-500"
//               />

//               <div>
//                 <p className="text-xs font-medium text-gray-500">
//                   Scheduled Time
//                 </p>

//                 <p className="mt-1 text-sm font-semibold text-gray-900">
//                   {formatDateTime(task.scheduled_time)}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ====================================================
//             ADDRESS
//         ==================================================== */}

//         {task.customer_address && (
//           <div className="mt-3 rounded-xl bg-gray-50 p-4">
//             <div className="flex items-start gap-3">
//               <MapPin size={18} className="mt-0.5 shrink-0 text-gray-500" />

//               <div className="min-w-0">
//                 <p className="text-xs font-medium text-gray-500">Address</p>

//                 <p className="mt-1 text-sm text-gray-700">
//                   {task.customer_address}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ====================================================
//             ORDER INFO
//         ==================================================== */}

//         {task.order && (
//           <div className="mt-3 rounded-xl border border-gray-100 bg-white p-4">
//             <div className="flex items-center justify-between gap-3">
//               <div className="flex items-center gap-2">
//                 <Package size={17} className="text-gray-500" />

//                 <span className="text-sm font-semibold text-gray-800">
//                   Order #{task.order.id}
//                 </span>
//               </div>

//               <span className="text-xs font-medium capitalize text-gray-500">
//                 {String(task.order.status || "").replaceAll("_", " ")}
//               </span>
//             </div>

//             {task.order.total_amount !== undefined &&
//               task.order.total_amount !== null && (
//                 <p className="mt-2 text-sm text-gray-600">
//                   Amount:{" "}
//                   <span className="font-semibold text-gray-900">
//                     ₹{Number(task.order.total_amount).toLocaleString("en-IN")}
//                   </span>
//                 </p>
//               )}
//           </div>
//         )}

//         {/* ====================================================
//             NOTES
//         ==================================================== */}

//         {task.notes && (
//           <div className="mt-3 rounded-xl border border-yellow-100 bg-yellow-50 p-4">
//             <p className="text-xs font-semibold text-yellow-800">Task Notes</p>

//             <p className="mt-1 whitespace-pre-wrap text-sm text-yellow-900">
//               {task.notes}
//             </p>
//           </div>
//         )}

//         {/* ====================================================
//             ACTIONS
//         ==================================================== */}

//         <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <button
//             type="button"
//             onClick={onToggle}
//             className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
//           >
//             {expanded ? (
//               <>
//                 Hide details
//                 <ChevronUp size={17} />
//               </>
//             ) : (
//               <>
//                 Show details
//                 <ChevronDown size={17} />
//               </>
//             )}
//           </button>

//           <div className="flex flex-col gap-2 sm:flex-row">
//             {canStart && (
//               <button
//                 type="button"
//                 disabled={isUpdating}
//                 onClick={() => onStart(task.id)}
//                 className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {isUpdating ? (
//                   <Loader2 size={17} className="animate-spin" />
//                 ) : (
//                   <Play size={17} />
//                 )}
//                 Start Task
//               </button>
//             )}

//             {canComplete && (
//               <button
//                 type="button"
//                 disabled={isUpdating}
//                 onClick={() => onComplete(task.id)}
//                 className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {isUpdating ? (
//                   <Loader2 size={17} className="animate-spin" />
//                 ) : (
//                   <CheckCircle2 size={17} />
//                 )}
//                 Mark Complete
//               </button>
//             )}

//             {task.status === "pending" && !task.isReady && (
//               <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-500">
//                 <Clock3 size={16} />
//                 Waiting for previous task
//               </div>
//             )}

//             {task.status === "completed" && (
//               <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-5 py-2.5 text-sm font-semibold text-green-700">
//                 <CheckCircle2 size={17} />
//                 Task Completed
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ======================================================
//           EXPANDED DETAILS
//       ====================================================== */}

//       {expanded && (
//         <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//             <div>
//               <p className="text-xs font-medium text-gray-500">Assigned Date</p>

//               <p className="mt-1 text-sm font-semibold text-gray-800">
//                 {formatDate(task.createdAt)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs font-medium text-gray-500">Started At</p>

//               <p className="mt-1 text-sm font-semibold text-gray-800">
//                 {formatDateTime(task.started_at)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs font-medium text-gray-500">Completed At</p>

//               <p className="mt-1 text-sm font-semibold text-gray-800">
//                 {formatDateTime(task.completed_at)}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ============================================================
//    MAIN PAGE
// ============================================================ */

// export default function MyTasks() {
//   const {
//     tasks,
//     stats,
//     statusFilter,
//     setStatusFilter,
//     loading,
//     error,
//     updateStatus,
//     refetch,
//   } = useMyTasks("all");

//   const [search, setSearch] = useState("");
//   const [updatingTaskId, setUpdatingTaskId] = useState(null);

//   const [expandedTaskId, setExpandedTaskId] = useState(null);

//   /* ==========================================================
//      FILTER TASKS
//   ========================================================== */

//   const filteredTasks = useMemo(() => {
//     const query = search.trim().toLowerCase();

//     if (!query) {
//       return tasks;
//     }

//     return tasks.filter((task) => {
//       const taskType = TASK_TYPE_LABEL[task.task_type] || task.task_type;

//       const searchableText = [
//         task.id,
//         task.order_id,
//         task.customer_name,
//         task.customer_phone,
//         task.customer_address,
//         task.task_type,
//         taskType,
//         task.status,
//         task.priority,
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchableText.includes(query);
//     });
//   }, [tasks, search]);

//   /* ==========================================================
//      SORT TASKS
//   ========================================================== */

//   const sortedTasks = useMemo(() => {
//     return [...filteredTasks].sort((a, b) => {
//       /*
//        * Priority:
//        * urgent → normal
//        */
//       if (a.priority !== b.priority) {
//         if (a.priority === "urgent") return -1;

//         if (b.priority === "urgent") return 1;
//       }

//       /*
//        * In-progress first
//        */
//       if (a.status !== b.status) {
//         const rank = {
//           in_progress: 0,
//           pending: 1,
//           completed: 2,
//         };

//         return (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
//       }

//       /*
//        * Workflow sequence
//        */
//       if (Number(a.sequence || 999) !== Number(b.sequence || 999)) {
//         return Number(a.sequence || 999) - Number(b.sequence || 999);
//       }

//       /*
//        * Scheduled time
//        */
//       return (
//         new Date(a.scheduled_time || 0).getTime() -
//         new Date(b.scheduled_time || 0).getTime()
//       );
//     });
//   }, [filteredTasks]);

//   /* ==========================================================
//      HANDLERS
//   ========================================================== */

//   const handleStart = async (taskId) => {
//     try {
//       setUpdatingTaskId(taskId);

//       await updateStatus(taskId, "in_progress");
//     } finally {
//       setUpdatingTaskId(null);
//     }
//   };

//   const handleComplete = async (taskId) => {
//     try {
//       setUpdatingTaskId(taskId);

//       await updateStatus(taskId, "completed");
//     } finally {
//       setUpdatingTaskId(null);
//     }
//   };

//   const handleRefresh = async () => {
//     try {
//       await refetch();
//       toast.success("Tasks refreshed");
//     } catch {
//       // Hook already handles the error.
//     }
//   };

//   const toggleExpanded = (taskId) => {
//     setExpandedTaskId((current) => (current === taskId ? null : taskId));
//   };

//   /* ==========================================================
//      RENDER
//   ========================================================== */

//   return (
//     <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         {/* ====================================================
//             PAGE HEADER
//         ==================================================== */}

//         <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>

//             <p className="mt-1 text-sm text-gray-500">
//               View and manage the tasks assigned to you.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={handleRefresh}
//             disabled={loading}
//             className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
//             Refresh
//           </button>
//         </div>

//         {/* ====================================================
//             ERROR
//         ==================================================== */}

//         {error && (
//           <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
//             <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />

//             <div>
//               <p className="text-sm font-semibold text-red-800">
//                 Unable to load tasks
//               </p>

//               <p className="mt-1 text-sm text-red-700">{error}</p>
//             </div>
//           </div>
//         )}

//         {/* ====================================================
//             STAT CARDS
//         ==================================================== */}

//         <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           <StatCard
//             title="Total Tasks"
//             value={stats.total}
//             icon={ClipboardList}
//             description="All assigned tasks"
//             iconClass="bg-gray-100 text-gray-700"
//           />

//           <StatCard
//             title="Pending"
//             value={stats.pending}
//             icon={Clock3}
//             description="Tasks waiting to start"
//             iconClass="bg-amber-50 text-amber-600"
//           />

//           <StatCard
//             title="In Progress"
//             value={stats.inProgress}
//             icon={Loader2}
//             description="Currently working"
//             iconClass="bg-blue-50 text-blue-600"
//           />

//           <StatCard
//             title="Completed"
//             value={stats.completed}
//             icon={CheckCircle2}
//             description="Successfully completed"
//             iconClass="bg-green-50 text-green-600"
//           />
//         </div>

//         {/* ====================================================
//             FILTER / SEARCH
//         ==================================================== */}

//         <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
//           <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//             {/* Status tabs */}
//             <div className="flex flex-wrap gap-2">
//               {STATUS_FILTERS.map((filter) => {
//                 const active = statusFilter === filter.value;

//                 return (
//                   <button
//                     key={filter.value}
//                     type="button"
//                     onClick={() => setStatusFilter(filter.value)}
//                     className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
//                       active
//                         ? "bg-gray-900 text-white"
//                         : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//                     }`}
//                   >
//                     {filter.label}
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Search */}
//             <div className="relative w-full lg:max-w-sm">
//               <Search
//                 size={17}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//               />

//               <input
//                 type="text"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search task, customer, order..."
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
//               />
//             </div>
//           </div>
//         </div>

//         {/* ====================================================
//             TASK COUNT
//         ==================================================== */}

//         {!loading && (
//           <div className="mb-4 flex items-center justify-between">
//             <p className="text-sm text-gray-500">
//               Showing{" "}
//               <span className="font-semibold text-gray-900">
//                 {sortedTasks.length}
//               </span>{" "}
//               {sortedTasks.length === 1 ? "task" : "tasks"}
//             </p>
//           </div>
//         )}

//         {/* ====================================================
//             TASK LIST
//         ==================================================== */}

//         {loading ? (
//           <TaskSkeleton />
//         ) : sortedTasks.length === 0 ? (
//           <EmptyState search={Boolean(search)} />
//         ) : (
//           <div className="space-y-4">
//             {sortedTasks.map((task) => (
//               <TaskCard
//                 key={task.id}
//                 task={task}
//                 onStart={handleStart}
//                 onComplete={handleComplete}
//                 updatingTaskId={updatingTaskId}
//                 expanded={expandedTaskId === task.id}
//                 onToggle={() => toggleExpanded(task.id)}
//               />
//             ))}
//           </div>
//         )}

//         {/* ====================================================
//             WORKFLOW INFO
//         ==================================================== */}

//         <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
//           <div className="flex items-start gap-3">
//             <AlertCircle size={19} className="mt-0.5 shrink-0 text-blue-600" />

//             <div>
//               <h3 className="text-sm font-bold text-blue-900">Task workflow</h3>

//               <p className="mt-1 text-sm leading-6 text-blue-800">
//                 Tasks follow the order assigned by the shop. A task becomes
//                 available when all previous workflow tasks for the order are
//                 completed.
//               </p>

//               <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-800">
//                 {[
//                   "Pickup",
//                   "Wash",
//                   "Dry Cleaning",
//                   "Ironing",
//                   "Packing",
//                   "Delivery",
//                 ].map((label, index) => (
//                   <React.Fragment key={label}>
//                     <span className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
//                       {index + 1}. {label}
//                     </span>

//                     {index < 5 && <span>→</span>}
//                   </React.Fragment>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  MapPin,
  Phone,
  User,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ClipboardList,
  Truck,
  WashingMachine,
  Shirt,
  PackageCheck,
  Bike,
  Search,
  History,
  ListChecks,
} from "lucide-react";
import toast from "react-hot-toast";

import { useMyTasks } from "../../hooks/useMyTasks";
// NOTE: adjust this import if your task API object/module is named or
// located differently — it's assumed to expose getMyTaskHistory().
import { taskApi } from "../../api/taskApi";

/* ============================================================
   BRAND TOKENS
============================================================ */

const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#51787C",
  danger: "#E0645C",
  amber: "#B8791F",
};

/* ============================================================
   CONSTANTS
============================================================ */

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_TYPE_ICON = {
  pickup: Truck,
  wash: WashingMachine,
  dry: WashingMachine,
  iron: Shirt,
  pack: PackageCheck,
  delivery: Bike,
};

const STATUS_LABEL = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

// "completed" intentionally excluded — completed tasks live in the
// Task History tab, not the active Employee Tasks board.
const STATUS_FILTERS = [
  {
    value: "all",
    label: "All Tasks",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
];

/* ============================================================
   HELPERS
============================================================ */

const formatTaskType = (type) => TASK_TYPE_LABEL[type] || type || "Task";

const formatStatus = (status) => STATUS_LABEL[status] || status || "Unknown";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: `${colors.mint}1F`, color: colors.primaryTeal }}
      >
        <CheckCircle2 size={14} />
        Completed
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: `${colors.seafoam}1F`, color: colors.seafoam }}
      >
        <Loader2 size={14} />
        In Progress
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: "#F2A93B1F", color: colors.amber }}
    >
      <Clock3 size={14} />
      Pending
    </span>
  );
}

/* ============================================================
   PRIORITY BADGE
============================================================ */

function PriorityBadge({ priority }) {
  if (priority === "urgent") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={{ backgroundColor: `${colors.danger}1A`, color: colors.danger }}
      >
        <AlertCircle size={13} />
        URGENT
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}
    >
      NORMAL
    </span>
  );
}

/* ============================================================
   READY BADGE
============================================================ */

function ReadyBadge({ task }) {
  if (task.status === "completed") {
    return null;
  }

  if (task.status === "in_progress") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: `${colors.seafoam}1F`, color: colors.seafoam }}
      >
        <Play size={12} />
        Active
      </span>
    );
  }

  if (task.isReady) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: `${colors.mint}1F`, color: colors.primaryTeal }}
      >
        <CheckCircle2 size={12} />
        Ready
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}
    >
      <Clock3 size={12} />
      Waiting
    </span>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ title, value, icon: Icon, description, iconBg, iconColor }) {
  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: colors.textMuted }}>{title}</p>

          <h3
            className="mt-2 text-2xl"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            {value}
          </h3>

          {description && (
            <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>{description}</p>
          )}
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TASK ICON
============================================================ */

function TaskIcon({ taskType }) {
  const Icon = TASK_TYPE_ICON[taskType] || ClipboardList;

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: colors.cardTint, color: colors.primaryTeal }}
    >
      <Icon size={21} />
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({ search, title, subtitle }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center"
      style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}
      >
        <ClipboardList size={26} />
      </div>

      <h3
        className="mt-4 text-base"
        style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
      >
        {search ? "No matching tasks" : title || "No tasks found"}
      </h3>

      <p className="mt-1 max-w-md text-sm" style={{ color: colors.textMuted }}>
        {search
          ? "Try changing your search or status filter."
          : subtitle || "You currently don't have any tasks assigned to you."}
      </p>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function TaskSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border p-5"
          style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}
        >
          <div className="flex gap-4">
            <div className="h-11 w-11 rounded-xl" style={{ backgroundColor: colors.cardTint }} />

            <div className="flex-1">
              <div className="h-4 w-32 rounded" style={{ backgroundColor: colors.cardTint }} />

              <div className="mt-3 h-3 w-48 rounded" style={{ backgroundColor: colors.cardTint }} />

              <div className="mt-5 h-10 w-full rounded" style={{ backgroundColor: colors.cardTint, opacity: 0.6 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   TASK CARD (current tasks — unchanged behavior, restyled only)
============================================================ */

function TaskCard({
  task,
  onStart,
  onComplete,
  updatingTaskId,
  expanded,
  onToggle,
}) {
  const isUpdating = updatingTaskId === task.id;

  const canStart = task.status === "pending" && task.isReady === true;

  const canComplete = task.status === "in_progress";

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-sm transition"
      style={{
        backgroundColor: colors.bgLight,
        borderColor: task.priority === "urgent" ? `${colors.danger}4D` : colors.cardBorder,
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <TaskIcon taskType={task.task_type} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold" style={{ color: colors.textDark }}>
                  {formatTaskType(task.task_type)}
                </h3>

                <PriorityBadge priority={task.priority} />

                <ReadyBadge task={task} />
              </div>

              <div
                className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                style={{ color: colors.textMuted }}
              >
                <span>Task #{task.id}</span>

                {task.order_id && <span>Order #{task.order_id}</span>}

                {task.sequence && <span>Step {task.sequence}</span>}
              </div>
            </div>
          </div>

          <StatusBadge status={task.status} />
        </div>

        {/* ====================================================
            CUSTOMER / ORDER INFO
        ==================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
            <div className="flex items-start gap-3">
              <User size={18} className="mt-0.5 shrink-0" style={{ color: colors.textMuted }} />

              <div className="min-w-0">
                <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Customer</p>

                <p className="mt-1 truncate text-sm font-semibold" style={{ color: colors.textDark }}>
                  {task.customer_name || "—"}
                </p>

                {task.customer_phone && (
                  <a
                    href={`tel:${task.customer_phone}`}
                    className="mt-1 flex items-center gap-1 text-xs hover:underline"
                    style={{ color: colors.primaryTeal }}
                  >
                    <Phone size={12} />
                    {task.customer_phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
            <div className="flex items-start gap-3">
              <CalendarDays size={18} className="mt-0.5 shrink-0" style={{ color: colors.textMuted }} />

              <div>
                <p className="text-xs font-medium" style={{ color: colors.textMuted }}>
                  Scheduled Time
                </p>

                <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
                  {formatDateTime(task.scheduled_time)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            ADDRESS
        ==================================================== */}

        {task.customer_address && (
          <div className="mt-3 rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: colors.textMuted }} />

              <div className="min-w-0">
                <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Address</p>

                <p className="mt-1 text-sm" style={{ color: colors.textDark }}>
                  {task.customer_address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ORDER INFO
        ==================================================== */}

        {task.order && (
          <div className="mt-3 rounded-xl border p-4" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package size={17} style={{ color: colors.textMuted }} />

                <span className="text-sm font-semibold" style={{ color: colors.textDark }}>
                  Order #{task.order.id}
                </span>
              </div>

              <span className="text-xs font-medium capitalize" style={{ color: colors.textMuted }}>
                {String(task.order.status || "").replaceAll("_", " ")}
              </span>
            </div>

            {task.order.total_amount !== undefined &&
              task.order.total_amount !== null && (
                <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                  Amount:{" "}
                  <span className="font-semibold" style={{ color: colors.textDark }}>
                    ₹{Number(task.order.total_amount).toLocaleString("en-IN")}
                  </span>
                </p>
              )}
          </div>
        )}

        {/* ====================================================
            NOTES
        ==================================================== */}

        {task.notes && (
          <div className="mt-3 rounded-xl border p-4" style={{ borderColor: "#F2A93B4D", backgroundColor: "#F2A93B14" }}>
            <p className="text-xs font-semibold" style={{ color: colors.amber }}>Task Notes</p>

            <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: colors.textDark }}>
              {task.notes}
            </p>
          </div>
        )}

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: colors.textMuted }}
          >
            {expanded ? (
              <>
                Hide details
                <ChevronUp size={17} />
              </>
            ) : (
              <>
                Show details
                <ChevronDown size={17} />
              </>
            )}
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            {canStart && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onStart(task.id)}
                className="tt-start-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Play size={17} />
                )}
                Start Task
              </button>
            )}

            {canComplete && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onComplete(task.id)}
                className="tt-complete-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Mark Complete
              </button>
            )}

            {task.status === "pending" && !task.isReady && (
              <div
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
                style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}
              >
                <Clock3 size={16} />
                Waiting for previous task
              </div>
            )}

            {task.status === "completed" && (
              <div
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{ backgroundColor: `${colors.mint}1F`, color: colors.primaryTeal }}
              >
                <CheckCircle2 size={17} />
                Task Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          EXPANDED DETAILS
      ====================================================== */}

      {expanded && (
        <div className="border-t px-5 py-4" style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint }}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Assigned Date</p>

              <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
                {formatDate(task.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Started At</p>

              <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
                {formatDateTime(task.started_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Completed At</p>

              <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
                {formatDateTime(task.completed_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HISTORY TASK CARD (read-only — Task History tab)
   Defensive about shape: getEmployeeTaskHistory nests customer
   under task.order.customer, but flat fields are checked too in
   case a different endpoint shape is ever wired in later.
============================================================ */

function HistoryTaskCard({ task }) {
  const customer = task.order?.customer || {};

  const customerName = task.customer_name || customer.name || "—";
  const customerPhone = task.customer_phone || customer.phone;
  const customerAddress =
    task.customer_address || customer.address || task.order?.delivery_address;

  return (
    <div
      className="overflow-hidden rounded-2xl border p-5 shadow-sm"
      style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <TaskIcon taskType={task.task_type} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold" style={{ color: colors.textDark }}>
                {formatTaskType(task.task_type)}
              </h3>

              <PriorityBadge priority={task.priority} />
            </div>

            <div
              className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              style={{ color: colors.textMuted }}
            >
              <span>Task #{task.id}</span>

              {(task.order_id || task.order?.id) && (
                <span>Order #{task.order_id || task.order?.id}</span>
              )}
            </div>
          </div>
        </div>

        <StatusBadge status={task.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
          <div className="flex items-start gap-3">
            <User size={17} className="mt-0.5 shrink-0" style={{ color: colors.textMuted }} />

            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Customer</p>

              <p className="mt-1 truncate text-sm font-semibold" style={{ color: colors.textDark }}>
                {customerName}
              </p>

              {customerPhone && (
                <a
                  href={`tel:${customerPhone}`}
                  className="mt-1 flex items-center gap-1 text-xs hover:underline"
                  style={{ color: colors.primaryTeal }}
                >
                  <Phone size={12} />
                  {customerPhone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
          <div className="flex items-start gap-3">
            <CalendarDays size={17} className="mt-0.5 shrink-0" style={{ color: colors.textMuted }} />

            <div>
              <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Scheduled</p>

              <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
                {formatDateTime(task.scheduled_time)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {customerAddress && (
        <div className="mt-3 rounded-xl p-4" style={{ backgroundColor: colors.cardTint }}>
          <div className="flex items-start gap-3">
            <MapPin size={17} className="mt-0.5 shrink-0" style={{ color: colors.textMuted }} />

            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Address</p>

              <p className="mt-1 text-sm" style={{ color: colors.textDark }}>{customerAddress}</p>
            </div>
          </div>
        </div>
      )}

      {task.order && (
        <div className="mt-3 rounded-xl border p-4" style={{ borderColor: colors.cardBorder }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package size={16} style={{ color: colors.textMuted }} />

              <span className="text-sm font-semibold" style={{ color: colors.textDark }}>
                Order #{task.order.id}
              </span>
            </div>

            <span className="text-xs font-medium capitalize" style={{ color: colors.textMuted }}>
              {String(task.order.status || "").replaceAll("_", " ")}
            </span>
          </div>

          {task.order.total_amount !== undefined && task.order.total_amount !== null && (
            <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
              Amount:{" "}
              <span className="font-semibold" style={{ color: colors.textDark }}>
                ₹{Number(task.order.total_amount).toLocaleString("en-IN")}
              </span>
            </p>
          )}
        </div>
      )}

      {task.notes && (
        <div className="mt-3 rounded-xl border p-4" style={{ borderColor: "#F2A93B4D", backgroundColor: "#F2A93B14" }}>
          <p className="text-xs font-semibold" style={{ color: colors.amber }}>Task Notes</p>

          <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: colors.textDark }}>
            {task.notes}
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3" style={{ borderColor: colors.cardBorder }}>
        <div>
          <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Assigned Date</p>

          <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
            {formatDate(task.createdAt)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Started At</p>

          <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
            {formatDateTime(task.started_at)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium" style={{ color: colors.textMuted }}>Completed At</p>

          <p className="mt-1 text-sm font-semibold" style={{ color: colors.textDark }}>
            {formatDateTime(task.completed_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function MyTasks() {
  const {
    tasks,
    stats,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    updateStatus,
    refetch,
  } = useMyTasks("all");

  const [search, setSearch] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // ==========================================================
  // VIEW TOGGLE — "current" (existing My Tasks UI, unchanged
  // functionality) vs "history" (new, read-only)
  // ==========================================================

  const [view, setView] = useState("current");

  const [historySearch, setHistorySearch] = useState("");
  const [historyTasks, setHistoryTasks] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const historyLoadedRef = useRef(false);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      // Task History only shows completed work. getEmployeeTaskHistory
      // supports an optional `status` filter on the backend, so we ask
      // for exactly that — the client-side filter below is just a
      // defensive backstop in case that param is ever ignored.
      const data = await taskApi.getMyTaskHistory({ status: "completed" });

      const list = Array.isArray(data) ? data : [];

      setHistoryTasks(list.filter((task) => task.status === "completed"));
      historyLoadedRef.current = true;
    } catch (err) {
      console.error("Load task history error:", err);

      setHistoryTasks([]);

      setHistoryError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load task history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch once, the first time the History tab is opened.
  useEffect(() => {
    if (view === "history" && !historyLoadedRef.current) {
      loadHistory();
    }
  }, [view, loadHistory]);

  const filteredHistoryTasks = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    if (!query) return historyTasks;

    return historyTasks.filter((task) => {
      const customer = task.order?.customer || {};

      const searchableText = [
        task.id,
        task.order_id,
        task.order?.id,
        task.customer_name || customer.name,
        task.customer_phone || customer.phone,
        task.task_type,
        TASK_TYPE_LABEL[task.task_type],
        task.status,
        task.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [historyTasks, historySearch]);

  const sortedHistoryTasks = useMemo(() => {
    return [...filteredHistoryTasks].sort((a, b) => {
      const aTime = new Date(a.completed_at || a.scheduled_time || 0).getTime();
      const bTime = new Date(b.completed_at || b.scheduled_time || 0).getTime();

      return bTime - aTime;
    });
  }, [filteredHistoryTasks]);

  const handleHistoryRefresh = async () => {
    try {
      await loadHistory();
      toast.success("Task history refreshed");
    } catch {
      // loadHistory already sets historyError.
    }
  };

  /* ==========================================================
     ACTIVE TASKS
     Employee Tasks board only shows work that's assigned/pending
     or in progress — completed tasks move to the Task History tab.
  ========================================================== */

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed"),
    [tasks],
  );

  /* ==========================================================
     FILTER TASKS
  ========================================================== */

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return activeTasks;
    }

    return activeTasks.filter((task) => {
      const taskType = TASK_TYPE_LABEL[task.task_type] || task.task_type;

      const searchableText = [
        task.id,
        task.order_id,
        task.customer_name,
        task.customer_phone,
        task.customer_address,
        task.task_type,
        taskType,
        task.status,
        task.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [activeTasks, search]);

  /* ==========================================================
     SORT TASKS (unchanged)
  ========================================================== */

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      /*
       * Priority:
       * urgent → normal
       */
      if (a.priority !== b.priority) {
        if (a.priority === "urgent") return -1;

        if (b.priority === "urgent") return 1;
      }

      /*
       * In-progress first
       */
      if (a.status !== b.status) {
        const rank = {
          in_progress: 0,
          pending: 1,
          completed: 2,
        };

        return (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
      }

      /*
       * Workflow sequence
       */
      if (Number(a.sequence || 999) !== Number(b.sequence || 999)) {
        return Number(a.sequence || 999) - Number(b.sequence || 999);
      }

      /*
       * Scheduled time
       */
      return (
        new Date(a.scheduled_time || 0).getTime() -
        new Date(b.scheduled_time || 0).getTime()
      );
    });
  }, [filteredTasks]);

  /* ==========================================================
     HANDLERS (unchanged)
  ========================================================== */

  const handleStart = async (taskId) => {
    try {
      setUpdatingTaskId(taskId);

      await updateStatus(taskId, "in_progress");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      setUpdatingTaskId(taskId);

      await updateStatus(taskId, "completed");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Tasks refreshed");
    } catch {
      // Hook already handles the error.
    }
  };

  const toggleExpanded = (taskId) => {
    setExpandedTaskId((current) => (current === taskId ? null : taskId));
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8" style={{ backgroundColor: colors.cardTint, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .tt-search:focus-within { border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px ${colors.primaryTeal}26; }
        .tt-view-btn { transition: background-color 0.15s ease, color 0.15s ease; }
        .tt-status-btn { transition: background-color 0.15s ease, color 0.15s ease; }
        .tt-refresh-btn:hover { background-color: ${colors.cardTint}; }
        .tt-start-btn { background: linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint}); transition: filter 0.15s ease; }
        .tt-start-btn:hover { filter: brightness(1.06); }
        .tt-complete-btn { background: linear-gradient(95deg, ${colors.mint}, ${colors.seafoam}); transition: filter 0.15s ease; }
        .tt-complete-btn:hover { filter: brightness(1.06); }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              My Tasks
            </h1>

            <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
              View and manage the tasks assigned to you.
            </p>
          </div>

          <button
            type="button"
            onClick={view === "current" ? handleRefresh : handleHistoryRefresh}
            disabled={view === "current" ? loading : historyLoading}
            className="tt-refresh-btn inline-flex w-fit items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight, color: colors.textDark }}
          >
            <RefreshCw
              size={17}
              className={(view === "current" ? loading : historyLoading) ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ====================================================
            VIEW TOGGLE — Employee Tasks / Task History
        ==================================================== */}

        <div className="mb-6 inline-flex gap-1 rounded-2xl border p-1" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
          <button
            type="button"
            onClick={() => setView("current")}
            className="tt-view-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: view === "current" ? colors.primaryTeal : "transparent",
              color: view === "current" ? "#FFFFFF" : colors.textMuted,
            }}
          >
            <ListChecks size={16} />
            Employee Tasks
          </button>

          <button
            type="button"
            onClick={() => setView("history")}
            className="tt-view-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: view === "history" ? colors.primaryTeal : "transparent",
              color: view === "history" ? "#FFFFFF" : colors.textMuted,
            }}
          >
            <History size={16} />
            Task History
          </button>
        </div>

        {/* ====================================================
            CURRENT TASKS VIEW (unchanged functionality)
        ==================================================== */}

        {view === "current" && (
          <>
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: `${colors.danger}4D`, backgroundColor: `${colors.danger}0D` }}>
                <AlertCircle size={19} className="mt-0.5 shrink-0" style={{ color: colors.danger }} />

                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.danger }}>
                    Unable to load tasks
                  </p>

                  <p className="mt-1 text-sm" style={{ color: colors.danger }}>{error}</p>
                </div>
              </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Tasks"
                value={stats.total}
                icon={ClipboardList}
                description="All assigned tasks"
                iconBg={`${colors.primaryTeal}1A`}
                iconColor={colors.primaryTeal}
              />

              <StatCard
                title="Pending"
                value={stats.pending}
                icon={Clock3}
                description="Tasks waiting to start"
                iconBg="#F2A93B1F"
                iconColor={colors.amber}
              />

              <StatCard
                title="In Progress"
                value={stats.inProgress}
                icon={Loader2}
                description="Currently working"
                iconBg={`${colors.seafoam}1F`}
                iconColor={colors.seafoam}
              />

              <StatCard
                title="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                description="Successfully completed"
                iconBg={`${colors.mint}1F`}
                iconColor={colors.primaryTeal}
              />
            </div>

            <div className="mb-5 rounded-2xl border p-4 shadow-sm" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((filter) => {
                    const active = statusFilter === filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setStatusFilter(filter.value)}
                        className="tt-status-btn rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{
                          backgroundColor: active ? colors.primaryTeal : colors.cardTint,
                          color: active ? "#FFFFFF" : colors.textMuted,
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                <div className="tt-search relative w-full rounded-xl border transition-shadow lg:max-w-sm" style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint }}>
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search task, customer, order..."
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
                    style={{ color: colors.textDark }}
                  />
                </div>
              </div>
            </div>

            {!loading && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Showing{" "}
                  <span className="font-semibold" style={{ color: colors.textDark }}>
                    {sortedTasks.length}
                  </span>{" "}
                  {sortedTasks.length === 1 ? "task" : "tasks"}
                </p>
              </div>
            )}

            {loading ? (
              <TaskSkeleton />
            ) : sortedTasks.length === 0 ? (
              <EmptyState search={Boolean(search)} />
            ) : (
              <div className="space-y-4">
                {sortedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    updatingTaskId={updatingTaskId}
                    expanded={expandedTaskId === task.id}
                    onToggle={() => toggleExpanded(task.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: `${colors.primaryTeal}33`, backgroundColor: colors.cardTint }}>
              <div className="flex items-start gap-3">
                <AlertCircle size={19} className="mt-0.5 shrink-0" style={{ color: colors.primaryTeal }} />

                <div>
                  <h3 className="text-sm" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                    Task workflow
                  </h3>

                  <p className="mt-1 text-sm leading-6" style={{ color: colors.textMuted }}>
                    Tasks follow the order assigned by the shop. A task becomes
                    available when all previous workflow tasks for the order are
                    completed.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: colors.primaryTeal }}>
                    {[
                      "Pickup",
                      "Wash",
                      "Dry Cleaning",
                      "Ironing",
                      "Packing",
                      "Delivery",
                    ].map((label, index) => (
                      <React.Fragment key={label}>
                        <span className="rounded-lg px-2.5 py-1.5 shadow-sm" style={{ backgroundColor: colors.bgLight }}>
                          {index + 1}. {label}
                        </span>

                        {index < 5 && <span style={{ color: colors.textMuted }}>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ====================================================
            TASK HISTORY VIEW (new, read-only)
        ==================================================== */}

        {view === "history" && (
          <>
            {historyError && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: `${colors.danger}4D`, backgroundColor: `${colors.danger}0D` }}>
                <AlertCircle size={19} className="mt-0.5 shrink-0" style={{ color: colors.danger }} />

                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.danger }}>
                    Unable to load task history
                  </p>

                  <p className="mt-1 text-sm" style={{ color: colors.danger }}>{historyError}</p>
                </div>
              </div>
            )}

            <div className="mb-5 rounded-2xl border p-4 shadow-sm" style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight }}>
              <div className="tt-search relative w-full rounded-xl border transition-shadow lg:max-w-sm" style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint }}>
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />

                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search past task, customer, order..."
                  className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
                  style={{ color: colors.textDark }}
                />
              </div>
            </div>

            {!historyLoading && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Showing{" "}
                  <span className="font-semibold" style={{ color: colors.textDark }}>
                    {sortedHistoryTasks.length}
                  </span>{" "}
                  {sortedHistoryTasks.length === 1 ? "task" : "tasks"}
                </p>
              </div>
            )}

            {historyLoading ? (
              <TaskSkeleton />
            ) : sortedHistoryTasks.length === 0 ? (
              <EmptyState
                search={Boolean(historySearch)}
                title="No task history yet"
                subtitle="Tasks you've completed in the past will appear here."
              />
            ) : (
              <div className="space-y-4">
                {sortedHistoryTasks.map((task) => (
                  <HistoryTaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}