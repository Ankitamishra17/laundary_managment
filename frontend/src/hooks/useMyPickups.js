import { useState, useEffect, useCallback, useMemo } from "react";
import { taskApi } from "../api/taskApi";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * useMyPickups — loads the logged-in employee's pickup tasks scheduled for
 * today, and derives stats + status filtering client-side (the dataset is
 * small, so no extra server round-trips are needed).
 */
export function useMyPickups() {
  const [all, setAll] = useState([]); // every pickup task for today
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchPickups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getMyTasks({ type: "pickup", date: todayStr() });
      setAll(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pickups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

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
    } catch (err) {
      setAll(previous);
      setError(err.response?.data?.message || "Failed to update pickup");
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    tasks, // filtered by statusFilter
    all, // unfiltered pickup tasks (today)
    stats,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    updatingId,
    updateStatus,
    refetch: fetchPickups,
  };
}
