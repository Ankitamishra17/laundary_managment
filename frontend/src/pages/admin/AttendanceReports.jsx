import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock4,
  Palmtree,
  UserX,
  Timer,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { attendanceApi } from "../../api/attendanceApi";
import { useEmployees } from "../../hooks/useEmployees";

const STATUS_META = {
  present: { label: "Present", color: "#02C39A", bg: "#DFF7F1" },
  half_day: { label: "Half Day", color: "#9A6A12", bg: "#FBF0DC" },
  leave: { label: "On Leave", color: "#0B3B3E", bg: "#DCEBEA" },
  absent: { label: "Absent", color: "#B3261E", bg: "#FDECEC" },
};

function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* NEW — Status Donut                                                  */
/* Shows Present / Half Day / Leave / Absent as proportions, built     */
/* purely from `stats` (already fetched — no new data source).         */
/* ------------------------------------------------------------------ */
function StatusDonut({ stats }) {
  const segments = [
    {
      key: "present",
      value: Number(stats.presentDays) || 0,
      ...STATUS_META.present,
    },
    {
      key: "half_day",
      value: Number(stats.halfDays) || 0,
      ...STATUS_META.half_day,
    },
    { key: "leave", value: Number(stats.leaves) || 0, ...STATUS_META.leave },
    { key: "absent", value: Number(stats.absents) || 0, ...STATUS_META.absent },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const radius = 52;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;
  const arcs = segments.map((s) => {
    const fraction = total > 0 ? s.value / total : 0;
    const dash = fraction * circumference;
    const arc = { ...s, dash, gap: circumference - dash, offset: offsetAcc };
    offsetAcc += dash;
    return arc;
  });

  return (
    <div className="bg-white border border-[#D8ECEA] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,44,46,0.04)] flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-[136px] h-[136px] shrink-0">
        {total === 0 ? (
          <svg viewBox="0 0 136 136" className="w-full h-full -rotate-90">
            <circle
              cx="68"
              cy="68"
              r={radius}
              fill="none"
              stroke="#EEF7F6"
              strokeWidth={stroke}
            />
          </svg>
        ) : (
          <svg viewBox="0 0 136 136" className="w-full h-full -rotate-90">
            <circle
              cx="68"
              cy="68"
              r={radius}
              fill="none"
              stroke="#EEF7F6"
              strokeWidth={stroke}
            />
            {arcs
              .filter((a) => a.value > 0)
              .map((a) => (
                <circle
                  key={a.key}
                  cx="68"
                  cy="68"
                  r={radius}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${a.dash} ${a.gap}`}
                  strokeDashoffset={-a.offset}
                  strokeLinecap="butt"
                />
              ))}
          </svg>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl text-[#0F2C2E]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {total}
          </span>
          <span className="text-[10px] text-[#6B8482]">days logged</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 w-full sm:w-auto">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-xs text-[#0F2C2E] font-medium">
              {s.label}
            </span>
            <span className="text-xs text-[#6B8482] ml-auto sm:ml-1.5">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* NEW — Daily Trend bars                                              */
/* Present-count per day across the selected range, built from         */
/* `records` (already fetched — no new data source).                   */
/* ------------------------------------------------------------------ */
function DailyTrend({ records, from, to }) {
  const days = useMemo(() => {
    const byDate = {};
    records.forEach((rec) => {
      if (rec.status !== "present" && rec.status !== "half_day") return;
      byDate[rec.date] =
        (byDate[rec.date] || 0) + (rec.status === "half_day" ? 0.5 : 1);
    });

    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T00:00:00");
    const dayMs = 24 * 60 * 60 * 1000;
    const spanDays = Math.round((end - start) / dayMs) + 1;

    // Cap at 31 bars so a long range doesn't crush the chart — show the
    // most recent 31 days of the selected range in that case.
    const list = [];
    const iterStart = spanDays > 31 ? new Date(end - 30 * dayMs) : start;
    for (
      let d = new Date(iterStart);
      d <= end;
      d = new Date(d.getTime() + dayMs)
    ) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      list.push({ date: key, count: byDate[key] || 0 });
    }
    return list;
  }, [records, from, to]);

  const max = Math.max(1, ...days.map((d) => d.count));

  if (days.length === 0) return null;

  return (
    <div className="bg-white border border-[#D8ECEA] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,44,46,0.04)]">
      <h3 className="text-[13px] font-semibold text-[#0F2C2E] mb-4">
        Present headcount by day
      </h3>
      <div className="flex items-end gap-[3px] h-24">
        {days.map((d) => {
          const heightPct = Math.max(4, (d.count / max) * 100);
          return (
            <div key={d.date} className="flex-1 min-w-[3px] group relative">
              <div
                className="w-full rounded-sm transition-all duration-300"
                style={{
                  height: `${heightPct}%`,
                  background: d.count > 0 ? "#028090" : "#EEF7F6",
                }}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-medium text-white bg-[#05282A] rounded-md px-2 py-1 z-10">
                {formatDate(d.date)} · {d.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-[#6B8482]">
        <span>{formatDate(days[0].date)}</span>
        <span>{formatDate(days[days.length - 1].date)}</span>
      </div>
    </div>
  );
}

const inputCls =
  "rounded-xl border border-[#D8ECEA] bg-white px-3.5 py-2.5 text-sm text-[#0F2C2E] shadow-[0_1px_2px_rgba(15,44,46,0.04)] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

export default function AttendanceReports() {
  const { employees, loading: employeesLoading } = useEmployees();
  const [from, setFrom] = useState(monthStartStr());
  const [to, setTo] = useState(todayStr());
  const [employeeId, setEmployeeId] = useState("");
  const [records, setRecords] = useState([]);
  const [perEmployee, setPerEmployee] = useState([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    halfDays: 0,
    leaves: 0,
    absents: 0,
    totalHours: "—",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = { from, to };
      if (employeeId) params.employee_id = employeeId;
      const res = await attendanceApi.getReport(params);
      setRecords(res.data || []);
      setPerEmployee(res.perEmployee || []);
      setStats(res.stats || {});
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [from, to, employeeId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const recordCount = records.length;
  const rangeLabel = useMemo(
    () => `${formatDate(from)} — ${formatDate(to)}`,
    [from, to],
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 text-sm font-medium text-[#0F2C2E]">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-[#0F2C2E]">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={todayStr()}
              onChange={(e) => setTo(e.target.value)}
              className={inputCls}
            />
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={employeesLoading}
            className={inputCls}
          >
            <option value="">All employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] transition-all"
          style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          icon={CalendarDays}
          label="Days Logged"
          value={stats.totalDays}
          color="#028090"
          bg="#DFF3F5"
        />
        <StatCard
          icon={CheckCircle2}
          label="Present"
          value={stats.presentDays}
          color="#02C39A"
          bg="#DFF7F1"
        />
        <StatCard
          icon={Clock4}
          label="Half Day"
          value={stats.halfDays}
          color="#9A6A12"
          bg="#FBF0DC"
        />
        <StatCard
          icon={Palmtree}
          label="Leave"
          value={stats.leaves}
          color="#0B3B3E"
          bg="#DCEBEA"
        />
        <StatCard
          icon={UserX}
          label="Absent"
          value={stats.absents}
          color="#B3261E"
          bg="#FDECEC"
        />
        <StatCard
          icon={Timer}
          label="Total Hours"
          value={stats.totalHours}
          color="#0B3B3E"
          bg="#DCEBEA"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* NEW — visual summary: donut + daily trend, side by side on larger screens */}
      {!loading && !error && (stats.totalDays > 0 || records.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 sm:gap-5">
          <StatusDonut stats={stats} />
          <DailyTrend records={records} from={from} to={to} />
        </div>
      )}

      {/* Summary by employee */}
      <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2
            className="text-[15px] text-[#0F2C2E] font-semibold"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Summary by Employee
          </h2>
          {!loading && (
            <span className="text-xs text-[#6B8482]">{rangeLabel}</span>
          )}
        </div>
        {loading ? (
          <TableSkeleton />
        ) : perEmployee.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#EEF7F6" }}
            >
              <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
            </div>
            <p className="text-sm font-medium text-[#0F2C2E]">
              No attendance records
            </p>
            <p className="text-xs text-[#6B8482] mt-1">
              Records will appear here once employees check in or you mark
              attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Employee
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Days Logged
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Present
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Half Day
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Leave
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Absent
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {perEmployee.map((agg) => (
                  <tr
                    key={agg.employee?.id}
                    className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                          style={{ background: "#DFF3F5", color: "#028090" }}
                        >
                          {initials(agg.employee?.name)}
                        </div>
                        <div>
                          <div className="text-[#0F2C2E] font-medium">
                            {agg.employee?.name || "—"}
                          </div>
                          {agg.employee?.designation && (
                            <div className="text-[11px] text-[#6B8482]">
                              {agg.employee.designation}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#0F2C2E] font-medium">
                      {agg.days}
                    </td>
                    <td className="py-3.5 px-5 text-[#02C39A] font-medium">
                      {agg.present}
                    </td>
                    <td className="py-3.5 px-5 text-[#9A6A12] font-medium">
                      {agg.halfDay}
                    </td>
                    <td className="py-3.5 px-5 text-[#0B3B3E] font-medium">
                      {agg.leave}
                    </td>
                    <td className="py-3.5 px-5 text-[#B3261E] font-medium">
                      {agg.absent}
                    </td>
                    <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">
                      {formatHours(agg.worked_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Records */}
      <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2
            className="text-[15px] text-[#0F2C2E] font-semibold"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            All Records
          </h2>
          {!loading && (
            <span className="text-xs text-[#6B8482]">
              {recordCount} record{recordCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {loading ? (
          <TableSkeleton />
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#EEF7F6" }}
            >
              <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
            </div>
            <p className="text-sm font-medium text-[#0F2C2E]">
              No records in this range
            </p>
            <p className="text-xs text-[#6B8482] mt-1">
              Try widening the date range or clearing the employee filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Date
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Employee
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Check In
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Check Out
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Hours
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Status
                  </th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150"
                  >
                    <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">
                      {formatDate(rec.date)}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{ background: "#DFF3F5", color: "#028090" }}
                        >
                          {initials(rec.employee?.name)}
                        </div>
                        <span className="text-[#0F2C2E] font-medium">
                          {rec.employee?.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">
                      {formatTime(rec.check_in)}
                    </td>
                    <td className="py-3.5 px-5 text-[#0F2C2E] whitespace-nowrap">
                      {formatTime(rec.check_out)}
                    </td>
                    <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">
                      {formatHours(
                        rec.check_in && rec.check_out
                          ? Math.max(
                              0,
                              Math.round(
                                (new Date(rec.check_out) -
                                  new Date(rec.check_in)) /
                                  60000,
                              ),
                            )
                          : 0,
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusPill status={rec.status} />
                    </td>
                    <td className="py-3.5 px-5 text-[#6B8482] max-w-[220px] truncate">
                      {rec.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
