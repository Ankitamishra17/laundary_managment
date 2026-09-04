import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { taskApi } from "../api/taskApi";

const DEFAULT_STATS = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
};

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

export function useMyTasks(initialStatus = "all") {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);

  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------------------------------------------------------- */
  /* Fetch tasks + stats                                              */
  /* ---------------------------------------------------------------- */

  const fetchAll = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError(null);

        const params = statusFilter !== "all" ? { status: statusFilter } : {};

        const [tasksData, statsData] = await Promise.all([
          taskApi.getMyTasks(params),
          taskApi.getMyTaskStats(),
        ]);

        /* ---------------------------------------------------------- */
        /* Tasks                                                        */
        /* ---------------------------------------------------------- */

        const normalizedTasks = Array.isArray(tasksData) ? tasksData : [];

        setTasks(normalizedTasks);

        /* ---------------------------------------------------------- */
        /* Stats                                                        */
        /* ---------------------------------------------------------- */

        if (statsData && typeof statsData === "object") {
          setStats({
            total: Number(statsData.total) || 0,

            pending: Number(statsData.pending) || 0,

            inProgress:
              Number(statsData.inProgress ?? statsData.in_progress) || 0,

            completed: Number(statsData.completed) || 0,
          });
        } else {
          setStats(DEFAULT_STATS);
        }
      } catch (err) {
        const message = err.response?.data?.message || "Failed to load tasks";

        setError(message);

        /*
         * Don't destroy already visible tasks
         * during a silent polling failure.
         */
        if (!silent) {
          setTasks([]);
          setStats(DEFAULT_STATS);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [statusFilter],
  );

  /* ---------------------------------------------------------------- */
  /* Initial fetch + polling                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    fetchAll();

    /*
     * Poll every 10 seconds.
     *
     * This allows tasks assigned/reassigned by
     * admin to appear automatically.
     */
    const intervalId = setInterval(() => {
      fetchAll(true);
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchAll]);

  /* ---------------------------------------------------------------- */
  /* Update task status                                               */
  /* ---------------------------------------------------------------- */

  const updateStatus = useCallback(
    async (taskId, newStatus) => {
      const task = tasks.find((item) => item.id === taskId);

      if (!task) {
        toast.error("Task not found");
        return;
      }

      /*
       * Frontend safety check.
       *
       * Backend is still the final authority.
       */
      if (
        newStatus === "in_progress" &&
        task.status === "pending" &&
        task.isReady === false
      ) {
        toast.error(
          "This task is not ready yet. Complete the previous task first.",
        );

        return;
      }

      const previousTasks = tasks;

      /*
       * Optimistic UI update.
       *
       * This makes the button respond immediately.
       * We will refetch from backend after success.
       */
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: newStatus,
              }
            : item,
        ),
      );

      try {
        /*
         * Backend validates:
         * - employee ownership
         * - shop ownership
         * - task sequence
         * - current status
         * - active task rules
         */
        await taskApi.updateStatus(taskId, newStatus);

        /*
         * IMPORTANT:
         *
         * After completing a task, the backend may
         * change the next task's `isReady`.
         *
         * Therefore we MUST fetch the task list again.
         */
        await fetchAll(true);

        const typeLabel =
          TASK_TYPE_LABEL[task.task_type] || task.task_type || "Task";

        if (newStatus === "in_progress") {
          toast.success(`${typeLabel} task started`);
        } else if (newStatus === "completed") {
          toast.success(`${typeLabel} task completed`);
        }
      } catch (err) {
        /*
         * Backend rejected the update.
         * Restore previous UI state.
         */
        setTasks(previousTasks);

        const message = err.response?.data?.message || "Failed to update task";

        setError(message);

        toast.error(message);
      }
    },
    [tasks, fetchAll],
  );

  /* ---------------------------------------------------------------- */
  /* Manual refetch                                                   */
  /* ---------------------------------------------------------------- */

  const refetch = useCallback(
    (silent = false) => {
      return fetchAll(silent);
    },
    [fetchAll],
  );

  /* ---------------------------------------------------------------- */
  /* Return                                                            */
  /* ---------------------------------------------------------------- */

  return {
    tasks,
    stats,

    statusFilter,
    setStatusFilter,

    loading,
    error,

    updateStatus,

    refetch,
  };
}
