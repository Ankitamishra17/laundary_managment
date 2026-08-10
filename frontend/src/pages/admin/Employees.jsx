import React, { useMemo, useState } from "react";
import {
  Users,
  ShieldCheck,
  UserX,
  Search,
  Mail,
  Phone,
  Plus,
  X,
  Copy,
  CheckCircle2,
  Loader2,
  KeyRound,
  Sparkles,
  Inbox,
} from "lucide-react";
import { useEmployees } from "../../hooks/useEmployees";

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
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
        <div className="text-[11px] sm:text-xs text-[#6B8482] font-medium truncate">{label}</div>
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
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF7F6" }}>
        <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
      </div>
      <p className="text-sm font-medium text-[#0F2C2E]">No employees yet</p>
      <p className="text-xs text-[#6B8482] mt-1">Add your first employee to start assigning tasks.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create Employee Modal                                               */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  password: "",
};

function CreateEmployeeModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [autoPassword, setAutoPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // { employee, tempPassword }
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
      auto_generate_password: autoPassword,
      ...(autoPassword ? {} : { password: form.password }),
    };
    const result = await onCreate(payload);
    if (result.ok) {
      setCreated({ name: result.employee?.name, tempPassword: result.tempPassword });
    } else {
      setError(result.error || "Failed to create employee");
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${form.email}\nPassword: ${created.tempPassword}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={resetAndClose}>
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
                <p className="text-[13px] text-[#5A7A79] mt-1">Create a new employee record</p>
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
                    className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
                  />
                </Field>

                <Field label="Email" required className="sm:col-span-2">
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="rahul@laundry.com"
                      className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] pl-9 pr-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
                    />
                  </div>
                </Field>

                <Field label="Phone" required>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]" />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="9876543210"
                      className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] pl-9 pr-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
                    />
                  </div>
                </Field>

                <Field label="Designation">
                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="Laundry Attendant"
                    className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
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
                <span className="text-sm text-[#0F2C2E] font-medium">Auto-generate password</span>
                <span className="text-[11px] text-[#6B8482] ml-auto flex items-center gap-1">
                  <KeyRound size={12} /> shown once after creation
                </span>
              </label>

              {!autoPassword && (
                <Field label="Password" required className="sm:col-span-2">
                  <input
                    name="password"
                    type="text"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
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
                style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
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
                style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
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
                <span className="text-[11px] uppercase tracking-wider text-[#6B8482]">Email</span>
                <span className="text-sm font-semibold text-[#0F2C2E]">{form.email}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-[#D8ECEA]">
                <span className="text-[11px] uppercase tracking-wider text-[#6B8482]">Password</span>
                <span className="text-sm font-semibold text-[#0F2C2E] font-mono">{created.tempPassword}</span>
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

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Employees() {
  const { employees, loading, error, createEmployee } = useEmployees();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

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

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
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
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] transition-all"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard icon={Users} label="Total Employees" value={total} color="#028090" bg="#DFF3F5" />
          <StatCard icon={ShieldCheck} label="Active" value={active} color="#02C39A" bg="#DFF7F1" />
          <StatCard icon={UserX} label="Inactive" value={inactive} color="#9A6A12" bg="#FBF0DC" />
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8482]" />
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
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Employee</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Phone</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Designation</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Status</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                            style={{ background: "#DFF3F5", color: "#028090" }}
                          >
                            {initials(e.name)}
                          </div>
                          <div>
                            <div className="text-[#0F2C2E] font-medium">{e.name}</div>
                            <div className="text-[11px] text-[#6B8482]">{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-[#6B8482]">{e.phone || "—"}</td>
                      <td className="py-3.5 px-5 text-[#0F2C2E]">{e.designation || "—"}</td>
                      <td className="py-3.5 px-5">
                        <EmployeeStatusPill status={e.status} />
                      </td>
                      <td className="py-3.5 px-5 text-[#6B8482]">
                        {new Date(e.createdAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateEmployeeModal isOpen={showModal} onClose={() => setShowModal(false)} onCreate={handleCreate} />
    </div>
  );
}
