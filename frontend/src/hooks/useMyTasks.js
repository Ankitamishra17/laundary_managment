import { useState, useEffect, useCallback } from "react";
import { taskApi } from "../api/taskApi";

const DEFAULT_STATS = { total: 0, pending: 0, inProgress: 0, completed: 0 };


export function useMyTasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
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
  }, [statusFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateStatus = async (taskId, newStatus) => {
    const previous = tasks;
    setTasks((curr) => curr.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await taskApi.updateStatus(taskId, newStatus);
      const statsData = await taskApi.getMyTaskStats();
      setStats(statsData && typeof statsData === "object" ? statsData : DEFAULT_STATS);
    } catch (err) {
      setTasks(previous);
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  return { tasks, stats, statusFilter, setStatusFilter, loading, error, updateStatus, refetch: fetchAll };
}