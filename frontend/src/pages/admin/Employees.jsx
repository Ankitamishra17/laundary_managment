import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  ShieldCheck,
  UserX,
  Search,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Mail,
  Phone,
  KeyRound,
  Copy,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Inbox,
  Sparkles,
} from "lucide-react";

import { useEmployees } from "../../hooks/useEmployees";

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="group bg-white border border-[#D8ECEA] rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-[0_1px_2px_rgba(15,44,46,0.04)] hover:shadow-[0_8px_24px_rgba(15,44,46,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ background: bg }}
      >
        <Icon size={20} style={{ color }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] sm:text-xs text-[#6B8482] font-medium truncate">
          {label}
        </div>
        <div
          className="text-xl sm:text-2xl text-[#0F2C2E] mt-0.5"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function EmployeeStatusPill({ status }) {
  const active = status === "active";
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap"
      style={{
        color: active ? "#028090" : "#9A6A12",
        background: active ? "#DFF3F5" : "#FBF0DC",
      }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#EEF7F6" }}
      >
        <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
      </div>
      <p className="text-sm font-medium text-[#0F2C2E]">No employees yet</p>
      <p className="text-xs text-[#6B8482] mt-1">
        Add your first employee to start assigning tasks.
      </p>
    </div>
  );
}

function Field({ label, required, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">
        {label} {required && <span className="text-[#B3261E]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

/* ------------------------------------------------------------------ */
/* Create Employee Modal                                               */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  monthlySalary: "",
  password: "",
};

function CreateEmployeeModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [autoPassword, setAutoPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // { name, tempPassword }
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setAutoPassword(true);
    setError("");
    setCreated(null);
    setCopied(false);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      designation: form.designation || null,
      monthlySalary: Number(form.monthlySalary) || 0,
      auto_generate_password: autoPassword,
      ...(autoPassword ? {} : { password: form.password }),
    };
    // Capture password BEFORE any state updates so it's never lost
    const capturedPassword = autoPassword ? null : form.password;
    const capturedEmail = form.email;

    const result = await onCreate(payload);
    if (result.ok) {
      setCreated({
        name: result.employee?.name,
        email: capturedEmail,
        tempPassword: autoPassword ? result.tempPassword : capturedPassword,
      });
    } else {
      setError(result.error || "Failed to create employee");
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(
        `Email: ${created.email}\nPassword: ${created.tempPassword}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      setError("Could not copy to clipboard");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={resetAndClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {!created ? (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2
                  className="text-2xl text-[#0F2C2E] leading-tight"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Add Employee
                </h2>
                <p className="text-[13px] text-[#5A7A79] mt-1">
                  Create a new employee record
                </p>
              </div>
              <button
                onClick={resetAndClose}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center hover:bg-[#DFF3F5] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required className="sm:col-span-2">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Rahul Sharma"
                    className={inputClass}
                  />
                </Field>

                <Field label="Email" required className="sm:col-span-2">
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]"
                    />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="rahul@laundry.com"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>

                <Field label="Phone" required>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]"
                    />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91XXXXXXXX"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>

                <Field label="Designation">
                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="Laundry Attendant"
                    className={inputClass}
                  />
                </Field>
                <Field label="Monthly Salary" required>
                  <input
                    name="monthlySalary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monthlySalary}
                    onChange={handleChange}
                    required
                    placeholder="15000"
                    className={inputClass}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-lg border border-[#D8ECEA] bg-[#FAFDFC] px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={autoPassword}
                  onChange={(e) => setAutoPassword(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#028090]"
                />
                <span className="text-sm text-[#0F2C2E] font-medium">
                  Auto-generate password
                </span>
                <span className="text-[11px] text-[#6B8482] ml-auto flex items-center gap-1">
                  <KeyRound size={12} /> shown once after creation
                </span>
              </label>

              {!autoPassword && (
                <Field label="Password" required className="sm:col-span-2 ">
                  <input
                    name="password"
                    type="text"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className={inputClass}
                  />
                </Field>
              )}

              {error && (
                <div className="text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition hover:brightness-105 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #028090, #00A896)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Create Employee
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "linear-gradient(135deg, #028090, #02C39A)",
                }}
              >
                <CheckCircle2 size={26} className="text-white" />
              </div>
              <h2
                className="text-2xl text-[#0F2C2E]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Employee Created
              </h2>
              <p className="text-[13px] text-[#5A7A79] mt-1 mb-6">
                {created.name} is ready. Share the login details below.
              </p>
            </div>

            <div className="rounded-xl bg-[#EEF7F6] border border-[#D8ECEA] p-5">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[11px] uppercase tracking-wider text-[#6B8482]">
                  Email
                </span>
                <span className="text-sm font-semibold text-[#0F2C2E]">
                  {created.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-[#D8ECEA]">
                <span className="text-[11px] uppercase tracking-wider text-[#6B8482]">
                  Password
                </span>
                <span className="text-sm font-semibold text-[#0F2C2E] font-mono">
                  {created.tempPassword}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full mt-5 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition ${
                copied ? "bg-[#028090]" : "bg-[#0B3B3E] hover:bg-[#05282A]"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} /> Copied
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Details
                </>
              )}
            </button>

            <button
              onClick={resetAndClose}
              className="w-full mt-2.5 rounded-xl py-3 text-sm font-medium text-[#0F2C2E] border border-[#D8ECEA] bg-transparent hover:bg-[#EEF7F6] transition"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edit Employee Modal                                                 */
/* ------------------------------------------------------------------ */

function EditEmployeeModal({ employee, onClose, onUpdate }) {
  const [form, setForm] = useState({
    name: employee?.name || "",
    phone: employee?.phone || "",
    designation: employee?.designation || "",
    monthlySalary: employee?.monthlySalary || "",
    status: employee?.status || "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!employee) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await onUpdate(employee.id, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      designation: form.designation.trim() || null,
      monthlySalary: Number(form.monthlySalary) || 0,
      status: form.status,
    });
    setLoading(false);
    if (ok) onClose();
    else setError("Failed to update employee");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              className="text-2xl text-[#0F2C2E] leading-tight"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Edit Employee
            </h2>
            <p className="text-[13px] text-[#5A7A79] mt-1">
              Update details for {employee.name}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center hover:bg-[#DFF3F5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full Name" required>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Rahul Sharma"
              className={inputClass}
            />
          </Field>

          <Field label="Phone">
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="99XXXXXXXX"
                className={`${inputClass} pl-9`}
              />
            </div>
          </Field>

          <Field label="Designation">
            <input
              name="designation"
              value={form.designation}
              onChange={handleChange}
              placeholder="Laundry Attendant"
              className={inputClass}
            />
          </Field>
          <Field label="Monthly Salary" required>
            <input
              name="monthlySalary"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlySalary}
              onChange={handleChange}
              required
              placeholder="15000"
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          {error && (
            <div className="text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-medium text-[#0F2C2E] border border-[#D8ECEA] bg-transparent hover:bg-[#EEF7F6] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition hover:brightness-105 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #028090, #00A896)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Employee Details Modal (view-only, opened by clicking a row)        */
/* ------------------------------------------------------------------ */

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#EEF7F6] last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-[#6B8482] flex-shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-[#0F2C2E] text-right break-words min-w-0">
        {value || "—"}
      </span>
    </div>
  );
}

function EmployeeDetailsModal({ employee, onClose, onEdit, onDeactivate }) {
  if (!employee) return null;

  const isActive = employee.status === "active";

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ background: "#DFF3F5", color: "#028090" }}
            >
              {initials(employee.name)}
            </div>
            <div>
              <h2
                className="text-xl text-[#0F2C2E] leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {employee.name}
              </h2>
              <div className="mt-1">
                <EmployeeStatusPill status={employee.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center hover:bg-[#DFF3F5] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="rounded-xl px-4 py-2"
          style={{ backgroundColor: "#FAFDFC", border: "1px solid #EEF7F6" }}
        >
          <DetailRow label="Email" value={employee.email} />
          <DetailRow label="Phone" value={employee.phone} />
          <DetailRow label="Designation" value={employee.designation} />
          <DetailRow label="Shop" value={employee.shop?.name} />
          <DetailRow
            label="Joined"
            value={
              employee.createdAt
                ? new Date(employee.createdAt).toLocaleDateString([], {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            <Pencil size={15} /> Edit
          </button>
          <button
            onClick={onDeactivate}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition active:scale-[0.98] ${
              isActive
                ? "text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] hover:bg-[#FBE4DC]"
                : "text-[#028090] bg-[#DFF7F1] border border-[#B8E8D8] hover:bg-[#D3F0E6]"
            }`}
          >
            {isActive ? <Trash2 size={15} /> : <RotateCcw size={15} />}
            {isActive ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delete (Deactivate) / Reactivate Modal                              */
/* ------------------------------------------------------------------ */

function DeleteEmployeeModal({
  employee,
  onClose,
  onConfirm,
  onDeletePermanent,
}) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  if (!employee) return null;

  const isActive = employee.status === "active";

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    const ok = await onConfirm(employee.id);
    setLoading(false);
    if (ok) onClose();
    else setError("Failed to update employee status");
  };

  const handleDeletePermanent = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setError("");
    setDeleting(true);
    const ok = await onDeletePermanent(employee.id);
    setDeleting(false);
    if (ok) onClose();
    else setError("Failed to delete employee");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: isActive ? "#FDECEC" : "#DFF7F1" }}
          >
            {isActive ? (
              <AlertTriangle size={26} style={{ color: "#B3261E" }} />
            ) : (
              <RotateCcw size={26} style={{ color: "#028090" }} />
            )}
          </div>

          <h2
            className="text-2xl text-[#0F2C2E]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {isActive ? "Deactivate Employee?" : "Reactivate Employee?"}
          </h2>

          <p className="text-[13px] text-[#5A7A79] mt-2 leading-relaxed">
            {isActive ? (
              <>
                <span className="font-semibold text-[#0F2C2E]">
                  {employee.name}
                </span>{" "}
                will lose access to the employee portal. They can be reactivated
                anytime from this page.
              </>
            ) : (
              <>
                <span className="font-semibold text-[#0F2C2E]">
                  {employee.name}
                </span>{" "}
                will regain access to the employee portal.
              </>
            )}
          </p>

          <div
            className="w-full rounded-xl px-4 py-3 mt-5 text-left text-[13px] flex items-start gap-2.5"
            style={{
              background: isActive ? "#FDECEC" : "#EEF7F6",
              border: `1px solid ${isActive ? "#F5C6C0" : "#D8ECEA"}`,
            }}
          >
            <span style={{ color: isActive ? "#B3261E" : "#028090" }}>
              {isActive ? (
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              ) : (
                <RotateCcw size={16} className="mt-0.5 shrink-0" />
              )}
            </span>
            <span className="text-[#5A7A79]">
              {isActive
                ? "Their tasks and attendance history are preserved — only login access is removed."
                : "The employee will be able to log in again with their existing credentials."}
            </span>
          </div>

          {error && (
            <div className="w-full mt-4 text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="w-full flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-medium text-[#0F2C2E] border border-[#D8ECEA] bg-transparent hover:bg-[#EEF7F6] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition hover:brightness-105 active:scale-[0.98]"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, #C4453C, #B3261E)"
                  : "linear-gradient(135deg, #028090, #00A896)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Working…
                </>
              ) : isActive ? (
                <>
                  <Trash2 size={16} /> Deactivate
                </>
              ) : (
                <>
                  <RotateCcw size={16} /> Reactivate
                </>
              )}
            </button>
          </div>

          {/* Permanent delete — only offered for already-deactivated accounts */}
          {!isActive && (
            <>
              <div
                className="w-full mt-4 h-px"
                style={{ backgroundColor: "#D8ECEA" }}
              />
              <button
                onClick={handleDeletePermanent}
                disabled={deleting}
                className={`w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                  confirmDelete
                    ? "text-white bg-[#B3261E] hover:brightness-110"
                    : "text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] hover:bg-[#FBE4DC]"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Deleting…
                  </>
                ) : confirmDelete ? (
                  <>
                    <AlertTriangle size={16} /> Click again to permanently
                    delete
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Delete permanently
                  </>
                )}
              </button>
              <p
                className="w-full mt-2 text-[11px] text-center"
                style={{ color: "#9A6A12" }}
              >
                This removes the employee forever. Deactivation is reversible —
                deletion is not.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Employees() {
  const {
    employees,
    loading,
    error,
    successMsg,
    clearMessages,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    deleteEmployeePermanently,
  } = useEmployees();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  // Auto-dismiss the success banner
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(clearMessages, 4000);
    return () => clearTimeout(t);
  }, [successMsg, clearMessages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q),
    );
  }, [employees, search]);

  const total = employees.length;
  const active = employees.filter((e) => e.status === "active").length;
  const inactive = total - active;

  const handleCreate = async (payload) => {
    const result = await createEmployee(payload);
    return {
      ok: result.ok,
      employee: result.employee,
      tempPassword: result.tempPassword,
      error: result.error,
    };
  };

  const handleUpdate = async (id, payload) => {
    return updateEmployee(id, payload); // returns true/false; hook manages error internally
  };

  const handleDelete = async (id) => {
    const employee = employees.find((e) => e.id === id);
    const ok =
      employee?.status === "active"
        ? await deactivateEmployee(id)
        : await reactivateEmployee(id);
    // hook manages `error` internally on failure
    return ok;
  };

  const handleDeletePermanent = async (id) => {
    const ok = await deleteEmployeePermanently(id);
    // hook manages `error` internally on failure
    return ok;
  };

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #028090, #02C39A)",
              }}
            >
              <Sparkles size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl text-[#0F2C2E] leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Employees
              </h1>
              <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
                Create employees and manage your workforce.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] transition-all"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon={Users}
            label="Total Employees"
            value={total}
            color="#028090"
            bg="#DFF3F5"
          />
          <StatCard
            icon={ShieldCheck}
            label="Active"
            value={active}
            color="#02C39A"
            bg="#DFF7F1"
          />
          <StatCard
            icon={UserX}
            label="Inactive"
            value={inactive}
            color="#9A6A12"
            bg="#FBF0DC"
          />
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8482]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-xl border border-[#D8ECEA] bg-white pl-10 pr-4 py-2.5 text-sm text-[#0F2C2E] shadow-[0_1px_2px_rgba(15,44,46,0.04)] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Success banner */}
        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-[#02735E] bg-[#DFF7F1] border border-[#B8E8D8] rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Table card */}
        <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
          {loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                      Employee
                    </th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                      Phone
                    </th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                      Designation
                    </th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                      Status
                    </th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                      Joined
                    </th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                      Monthly Salary
                    </th>
                    <th className="text-right font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setViewingEmployee(e)}
                      className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                            style={{ background: "#DFF3F5", color: "#028090" }}
                          >
                            {initials(e.name)}
                          </div>
                          <div>
                            <div className="text-[#0F2C2E] font-medium">
                              {e.name}
                            </div>
                            <div className="text-[11px] text-[#6B8482]">
                              {e.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-[#6B8482]">
                        {e.phone || "—"}
                      </td>
                      <td className="py-3.5 px-5 text-[#0F2C2E]">
                        {e.designation || "—"}
                      </td>
                      <td className="py-3.5 px-5">
                        <EmployeeStatusPill status={e.status} />
                      </td>
                      <td className="py-3.5 px-5 text-[#6B8482]">
                        {new Date(e.createdAt).toLocaleDateString([], {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-[#0F2C2E] font-medium">
                        {e.monthlySalary
                          ? `₹${Number(e.monthlySalary).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setViewingEmployee(null);
                              setEditingEmployee(e);
                            }}
                            title="Edit employee"
                            aria-label={`Edit ${e.name}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#028090] bg-[#DFF3F5] hover:bg-[#028090] hover:text-white active:scale-95 transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setViewingEmployee(null);
                              setDeletingEmployee(e);
                            }}
                            title={
                              e.status === "active"
                                ? "Deactivate employee"
                                : "Reactivate employee"
                            }
                            aria-label={`${e.status === "active" ? "Deactivate" : "Reactivate"} ${e.name}`}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                              e.status === "active"
                                ? "text-[#B3261E] bg-[#FDECEC] hover:bg-[#B3261E] hover:text-white"
                                : "text-[#028090] bg-[#DFF7F1] hover:bg-[#028090] hover:text-white"
                            }`}
                          >
                            {e.status === "active" ? (
                              <Trash2 size={14} />
                            ) : (
                              <RotateCcw size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateEmployeeModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
      {viewingEmployee && (
        <EmployeeDetailsModal
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onEdit={() => {
            const emp = viewingEmployee;
            setViewingEmployee(null);
            setEditingEmployee(emp);
          }}
          onDeactivate={() => {
            const emp = viewingEmployee;
            setViewingEmployee(null);
            setDeletingEmployee(emp);
          }}
        />
      )}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onUpdate={handleUpdate}
        />
      )}
      {deletingEmployee && (
        <DeleteEmployeeModal
          employee={deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onConfirm={handleDelete}
          onDeletePermanent={handleDeletePermanent}
        />
      )}
    </div>
  );
}
