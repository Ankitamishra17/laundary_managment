// hooks/useEmployees.js
import { useState, useCallback, useEffect } from "react";
import api from "../api/axios"; // shared instance — attaches JWT + handles session expiry

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearMessages = useCallback(() => {
    setError("");
    setSuccessMsg("");
  }, []);

  const fetchEmployees = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const res = await api.get("/admin/employees", {
        params: { search },
      });
      setEmployees(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const createEmployee = async (payload) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/admin/employees", payload);
      setEmployees((prev) => [res.data.data, ...prev]);
      setSuccessMsg("Employee created successfully");
      return { ok: true, employee: res.data.data, tempPassword: res.data.temp_password };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create employee";
      setError(message);
      return { ok: false, error: message };
    } finally {
      setSaving(false);
    }
  };

  const updateEmployee = async (id, payload) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.patch(`/admin/employees/${id}`, payload);
      setEmployees((prev) => prev.map((e) => (e.id === id ? res.data.data : e)));
      setSuccessMsg("Employee updated");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update employee");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deactivateEmployee = async (id) => {
    setSaving(true);
    setError("");
    try {
      await api.delete(`/admin/employees/${id}`);
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: "inactive" } : e)));
      setSuccessMsg("Employee deactivated");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate employee");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const reactivateEmployee = async (id) => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/employees/${id}/reactivate`, {});
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: "active" } : e)));
      setSuccessMsg("Employee reactivated");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reactivate employee");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetEmployeePassword = async (id) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.post(`/admin/employees/${id}/reset-password`, {});
      setSuccessMsg("Password reset");
      return { ok: true, tempPassword: res.data.temp_password };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  return {
    employees,
    loading,
    saving,
    error,
    successMsg,
    clearMessages,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    resetEmployeePassword,
  };
}