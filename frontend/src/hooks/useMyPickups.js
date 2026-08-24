import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { taskApi } from "../api/taskApi";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * useMyPickups — loads the logged-in employee's pickup tasks scheduled from
 * today onward (so pickups assigned for tomorrow are visible too, not just
 * today's), derives stats + status filters client-side, and polls every 30s
 * so new assignments appear without a manual refresh.
 */
export function useMyPickups() {
  const [all, setAll] = useState([]); // every pickup task from today onwards
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchPickups = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await taskApi.getMyTasks({ type: "pickup" });
      const fromToday = (Array.isArray(data) ? data : []).filter(
        (t) => new Date(t.scheduled_time) >= startOfToday(),
      );
      setAll(fromToday);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pickups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickups();
    const t = setInterval(() => fetchPickups(true), 10000);
    return () => clearInterval(t);
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
      // Refresh silently so the derived stats reflect the change
      fetchPickups(true);
      if (newStatus === "in_progress") toast.success("Pickup started");
      else if (newStatus === "completed") toast.success("Pickup completed");
    } catch (err) {
      setAll(previous);
      const msg = err.response?.data?.message || "Failed to update pickup";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    tasks, // filtered by statusFilter
    all, // unfiltered pickup tasks (today onwards)
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
