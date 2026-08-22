import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock4,
  Palmtree,
  UserX,
  Loader2,
  Inbox,
  PenLine,
  X,
} from "lucide-react";
import { attendanceApi } from "../../api/attendanceApi";

const STATUS_META = {
  present: { label: "Present", color: "#02C39A", bg: "#DFF7F1" },
  half_day: { label: "Half Day", color: "#9A6A12", bg: "#FBF0DC" },
  leave: { label: "On Leave", color: "#0B3B3E", bg: "#DCEBEA" },
  absent: { label: "Absent", color: "#B3261E", bg: "#FDECEC" },
};

const MARK_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "On Leave" },
  { value: "absent", label: "Absent" },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHours(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

// Format a Date as a local "YYYY-MM-DDTHH:mm" value for datetime-local inputs
// (toISOString() would shift the time to UTC — avoid it here)
function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

function StatusPill({ status }) {
  const s = STATUS_META[status] || STATUS_META.absent;
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
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
      {[...Array(5)].map((_, i) => (
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
      <p className="text-sm font-medium text-[#0F2C2E]">No active employees</p>
      <p className="text-xs text-[#6B8482] mt-1">Create employees first to start tracking attendance.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mark Attendance Modal                                               */
/* ------------------------------------------------------------------ */
function MarkModal({ isOpen, row, date, onClose, onSaved }) {
  const [status, setStatus] = useState("absent");
  const [notes, setNotes] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && row) {
      const record = row.record || {};
      setStatus(record.status || "absent");
      setNotes(record.notes || "");
      setCheckIn(record.check_in ? toLocalInputValue(record.check_in) : "");
      setCheckOut(record.check_out ? toLocalInputValue(record.check_out) : "");
      setError("");
    }
  }, [isOpen, row]);

  if (!isOpen || !row) return null;

  const isTimed = status === "present" || status === "half_day";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await attendanceApi.markAttendance({
        employee_id: row.employee.id,
        date,
        status,
        notes: notes || null,
        ...(isTimed && checkIn ? { check_in: checkIn } : {}),
        ...(isTimed && checkOut ? { check_out: checkOut } : {}),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              className="text-2xl text-[#0F2C2E] leading-tight"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Mark Attendance
            </h2>
            <p className="text-[13px] text-[#5A7A79] mt-1">
              {row.employee.name} · {date}
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
          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {MARK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className="rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150"
                  style={
                    status === opt.value
                      ? { borderColor: "#028090", background: "#DFF3F5", color: "#028090" }
                      : { borderColor: "#D8ECEA", background: "#FAFDFC", color: "#5A7A79" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {isTimed && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Check In</label>
                <input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Check Out</label>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Half day — family function"
              className="w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
            />
          </div>

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
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <PenLine size={16} /> Save Attendance
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function DailyAttendance() {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, halfDay: 0, leave: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markRow, setMarkRow] = useState(null);

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getDaily({ date });
      setRows(res.data || []);
      setStats(res.stats || {});
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="flex items-center gap-2.5 text-sm text-[#0F2C2E] font-medium">
          Date
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value || todayStr())}
            className="rounded-xl border border-[#D8ECEA] bg-white px-3.5 py-2.5 text-sm text-[#0F2C2E] shadow-[0_1px_2px_rgba(15,44,46,0.04)] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
          />
        </label>
        {!loading && (
          <span className="text-xs text-[#6B8482]">
            {new Date(date + "T00:00:00").toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </span>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={Users} label="Total Employees" value={stats.total} color="#028090" bg="#DFF3F5" />
        <StatCard icon={CheckCircle2} label="Present" value={stats.present} color="#02C39A" bg="#DFF7F1" />
        <StatCard icon={Clock4} label="Half Day" value={stats.halfDay} color="#9A6A12" bg="#FBF0DC" />
        <StatCard icon={Palmtree} label="On Leave" value={stats.leave} color="#0B3B3E" bg="#DCEBEA" />
        <StatCard icon={UserX} label="Absent" value={stats.absent} color="#B3261E" bg="#FDECEC" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Employee</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Check In</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Check Out</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Hours</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Status</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Notes</th>
                  <th className="text-right font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.employee.id} className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                          style={{ background: "#DFF3F5", color: "#028090" }}
                        >
                          {initials(row.employee.name)}
                        </div>
                        <div>
                          <div className="text-[#0F2C2E] font-medium">{row.employee.name}</div>
                          <div className="text-[11px] text-[#6B8482]">{row.employee.designation || "Employee"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">
                      {formatTime(row.record?.check_in)}
                    </td>
                    <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">
                      {formatTime(row.record?.check_out)}
                    </td>
                    <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">
                      {formatHours(row.record?.worked_minutes)}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="py-3.5 px-5 text-[#6B8482] max-w-[220px] truncate">{row.record?.notes || "—"}</td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setMarkRow(row)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                        style={{ borderColor: "#028090", color: "#028090", background: "#DFF3F5" }}
                      >
                        <PenLine size={12} /> Mark
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MarkModal
        isOpen={!!markRow}
        row={markRow}
        date={date}
        onClose={() => setMarkRow(null)}
        onSaved={fetchDaily}
      />
    </div>
  );
}
