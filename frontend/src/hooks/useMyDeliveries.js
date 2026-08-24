import { useState, useEffect, useCallback, useMemo } from "react";
import { taskApi } from "../api/taskApi";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * useMyDeliveries — loads the logged-in employee's DELIVERY tasks scheduled
 * from today onwards, derives stats + filters client-side, and polls every
 * 30s so new assignments appear without a manual refresh.
 */
export function useMyDeliveries() {
  const [all, setAll] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveries = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await taskApi.getMyTasks({ type: "delivery" });
      const fromToday = (Array.isArray(data) ? data : []).filter(
        (t) => new Date(t.scheduled_time) >= startOfToday(),
      );
      setAll(fromToday);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    const t = setInterval(() => fetchDeliveries(true), 30000);
    return () => clearInterval(t);
  }, [fetchDeliveries]);

  const stats = useMemo(() => {
    const total = all.length;
    const pending = all.filter((t) => t.status === "pending").length;
    const inProgress = all.filter((t) => t.status === "in_progress").length;
    const completed = all.filter((t) => t.status === "completed").length;
    return { total, pending, inProgress, completed };
  }, [all]);

  const tasks = useMemo(
    () => (statusFilter === "all" ? all : all.filter((t) => t.status === statusFilter)),
    [all, statusFilter],
  );

  const updateStatus = async (taskId, newStatus) => {
    const previous = all;
    setUpdatingId(taskId);
    // Optimistic update — revert on failure
    setAll((curr) => curr.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await taskApi.updateStatus(taskId, newStatus);
      setError(null);
      fetchDeliveries(true);
    } catch (err) {
      setAll(previous);
      setError(err.response?.data?.message || "Failed to update delivery");
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    tasks,
    all,
    stats,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    updatingId,
    updateStatus,
    refetch: fetchDeliveries,
  };
}
