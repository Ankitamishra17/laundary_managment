import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { taskApi } from "../api/taskApi";

const DEFAULT_STATS = { total: 0, pending: 0, inProgress: 0, completed: 0 };

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

  const fetchAll = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);
        const params = statusFilter !== "all" ? { status: statusFilter } : {};
        const [tasksData, statsData] = await Promise.all([
          taskApi.getMyTasks(params),
          taskApi.getMyTaskStats(),
        ]);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setStats(statsData && typeof statsData === "object" ? statsData : DEFAULT_STATS);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load tasks");
        setStats(DEFAULT_STATS); 
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  // Poll every 10s so tasks assigned by the admin appear quickly.
  useEffect(() => {
    fetchAll();
    const t = setInterval(() => fetchAll(true), 10000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const updateStatus = async (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    const previous = tasks;
    setTasks((curr) => curr.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await taskApi.updateStatus(taskId, newStatus);
      const statsData = await taskApi.getMyTaskStats();
      setStats(statsData && typeof statsData === "object" ? statsData : DEFAULT_STATS);
      // Toast notifications for task status changes
      const typeLabel = TASK_TYPE_LABEL[task?.task_type] || task?.task_type || "Task";
      if (newStatus === "in_progress") {
        toast.success(`${typeLabel} task started`);
      } else if (newStatus === "completed") {
        toast.success(`${typeLabel} task completed`);
      }
    } catch (err) {
      setTasks(previous);
      const msg = err.response?.data?.message || "Failed to update task";
      setError(msg);
      toast.error(msg);
    }
  };

  return { tasks, stats, statusFilter, setStatusFilter, loading, error, updateStatus, refetch: fetchAll };
}