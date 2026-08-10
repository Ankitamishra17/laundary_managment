import React, { useCallback, useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
  Sparkles,
  Inbox,
  Loader2,
} from "lucide-react";
import { attendanceApi } from "../../api/attendanceApi";

const STATUS_META = {
  present: { label: "Present", color: "#02C39A", bg: "#DFF7F1" },
  half_day: { label: "Half Day", color: "#9A6A12", bg: "#FBF0DC" },
  leave: { label: "On Leave", color: "#0B3B3E", bg: "#DCEBEA" },
  absent: { label: "Absent", color: "#B3261E", bg: "#FDECEC" },
};

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatHours(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
      ))}
    </div>
  );
}

export default function MyAttendance() {
  const [today, setToday] = useState(null); // today's record or null
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ totalDays: 0, presentDays: 0, halfDays: 0, leaves: 0, absents: 0, totalHours: "—" });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, monthRes] = await Promise.all([
        attendanceApi.getMyToday(),
        attendanceApi.getMyAttendance({ month: currentMonth() }),
      ]);
      setToday(todayRes.data || null);
      setRecords(monthRes.data || []);
      setStats(monthRes.stats || {});
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCheckIn = async () => {
    setActing(true);
    setError("");
    try {
      await attendanceApi.checkIn();
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check in");
    } finally {
      setActing(false);
    }
  };

  const handleCheckOut = async () => {
    setActing(true);
    setError("");
    try {
      await attendanceApi.checkOut();
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check out");
    } finally {
      setActing(false);
    }
  };

  const checkedIn = !!(today && today.check_in);
  const checkedOut = !!(today && today.check_out);

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
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
              My Attendance
            </h1>
            <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
              Clock in when you arrive and out when you leave.
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">{error}</div>
        )}

        {/* Today card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className="lg:col-span-2 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #05282A 0%, #0B3B3E 55%, #028090 100%)" }}
          >
            <div
              className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, #02C39A 0%, #028090 55%, transparent 75%)" }}
            />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Clock size={30} className="text-[#7EE8CC]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold">
                  {new Date().toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <div className="text-[11px] text-white/50">Check In</div>
                    <div className="text-xl font-semibold">{formatTime(today?.check_in)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-white/50">Check Out</div>
                    <div className="text-xl font-semibold">{formatTime(today?.check_out)}</div>
                  </div>
                  {today && (
                    <div>
                      <div className="text-[11px] text-white/50">Status</div>
                      <div className="text-xl font-semibold" style={{ color: "#7EE8CC" }}>
                        {STATUS_META[today.status]?.label || "—"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {!checkedIn ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={acting}
                    className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[#05282A] shadow-lg transition-all hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #02C39A, #7EE8CC)" }}
                  >
                    {acting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                    Check In
                  </button>
                ) : !checkedOut ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={acting}
                    className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
                  >
                    {acting ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    Check Out
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
                    style={{ background: "rgba(255,255,255,0.12)", color: "#7EE8CC" }}
                  >
                    <CheckCircle2 size={16} /> Day Complete
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Month summary */}
          <div className="bg-white border border-[#D8ECEA] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,44,46,0.04)]">
            <h2 className="text-[15px] text-[#0F2C2E] font-semibold mb-4" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              This Month
            </h2>
            <div className="space-y-3">
              {[
                { label: "Days Logged", value: stats.totalDays, color: "#028090", bg: "#DFF3F5" },
                { label: "Present Days", value: stats.presentDays, color: "#02C39A", bg: "#DFF7F1" },
                { label: "Half Days", value: stats.halfDays, color: "#9A6A12", bg: "#FBF0DC" },
                { label: "Leaves", value: stats.leaves, color: "#0B3B3E", bg: "#DCEBEA" },
                { label: "Total Hours", value: stats.totalHours, color: "#0B3B3E", bg: "#DCEBEA" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: row.bg }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                  </div>
                  <div className="flex-1 text-[13px] text-[#0F2C2E] font-medium">{row.label}</div>
                  <div className="text-[15px] text-[#0F2C2E] font-semibold">{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-[15px] text-[#0F2C2E] font-semibold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              This Month's History
            </h2>
            {!loading && (
              <span className="text-xs text-[#6B8482]">
                {records.length} day{records.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {loading ? (
            <TableSkeleton />
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF7F6" }}>
                <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-medium text-[#0F2C2E]">No attendance yet this month</p>
              <p className="text-xs text-[#6B8482] mt-1">Use the Check In button above to start your day.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Date</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Check In</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Check Out</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Hours</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Status</th>
                    <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id} className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150">
                      <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">{formatDate(rec.date)}</td>
                      <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">{formatTime(rec.check_in)}</td>
                      <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">{formatTime(rec.check_out)}</td>
                      <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">
                        {formatHours(
                          rec.check_in && rec.check_out
                            ? Math.max(0, Math.round((new Date(rec.check_out) - new Date(rec.check_in)) / 60000))
                            : 0,
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusPill status={rec.status} />
                      </td>
                      <td className="py-3.5 px-5 text-[#6B8482] max-w-[220px] truncate">{rec.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
