import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Clock,
  Loader2,
  CheckCircle2,
  Phone,
  MapPin,
  ClipboardList,
  ArrowRight,
  Sparkles,
  Inbox,
  MapPinned,
} from "lucide-react";
import { useMyPickups } from "../../hooks/useMyPickups";
import { taskApi } from "../../api/taskApi";
import { useAuth } from "../../context/AuthContext";
import StatusPill from "../../components/layout/StatusPill";
import Avatar from "../../components/layout/Avatar";

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(name = "") {
  return name.split(" ")[0] || "there";
}

function todayLong() {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */
function StatCard({ icon: Icon, label, value, color, bg, to }) {
  const inner = (
    <div className="group bg-white border border-[#D8ECEA] rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-[0_1px_2px_rgba(15,44,46,0.04)] hover:shadow-[0_8px_24px_rgba(15,44,46,0.08)] hover:-translate-y-0.5 transition-all duration-300 h-full">
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
  return to ? (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function ActionBtn({ status, busy, onStart, onComplete }) {
  if (status === "pending") {
    return (
      <button
        onClick={onStart}
        disabled={busy}
        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
      >
        {busy ? <Loader2 size={11} className="animate-spin inline mr-1" /> : null}Start
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button
        onClick={onComplete}
        disabled={busy}
        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #00A896, #02C39A)" }}
      >
        {busy ? <Loader2 size={11} className="animate-spin inline mr-1" /> : null}Complete
      </button>
    );
  }
  return (
    <span className="text-[11px] font-medium text-[#02C39A] flex items-center gap-1 whitespace-nowrap">
      <CheckCircle2 size={13} /> Done
    </span>
  );
}

function SectionHeader({ icon: Icon, title, to, linkLabel }) {
  return (
    <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-1">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#DFF3F5" }}>
          <Icon size={15} style={{ color: "#028090" }} />
        </div>
        <h2
          className="text-[15px] text-[#0F2C2E] font-semibold"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          {title}
        </h2>
      </div>
      {to && (
        <Link
          to={to}
          className="text-xs font-semibold text-[#028090] hover:text-[#02C39A] transition-colors inline-flex items-center gap-1"
        >
          {linkLabel || "View all"} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const {
    all: pickups = [],
    stats = { total: 0, pending: 0, inProgress: 0, completed: 0 },
    loading: pickupsLoading,
    error,
    updatingId,
    updateStatus,
  } = useMyPickups();

  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    taskApi
      .getMyTasks({ date: todayStr() })
      .then((data) => !cancelled && setSchedule(Array.isArray(data) ? data : []))
      .catch(() => !cancelled && setSchedule([]))
      .finally(() => !cancelled && setScheduleLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const nextPickup = pickups
    .filter((t) => t.status !== "completed")
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))[0];

  const visiblePickups = pickups.slice(0, 4);
  const visibleSchedule = schedule
    .filter((t) => t.status !== "completed")
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
    .slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* ------------------------------------------------ Hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #05282A 0%, #0B3B3E 55%, #028090 100%)" }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #02C39A 0%, #028090 55%, transparent 75%)" }}
          />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar
                user={user}
                className="w-12 h-12 sm:w-14 sm:h-14 text-sm ring-2 ring-white/20 shrink-0"
              />
              <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold">{todayLong()}</p>
              <h1
                className="mt-2 text-2xl sm:text-3xl leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {greeting()}, {firstName(user?.name)}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#7EE8CC" }}
                >
                  <MapPinned size={13} />
                  {pickupsLoading
                    ? "Loading your pickups…"
                    : nextPickup
                      ? `Next pickup at ${formatTime(nextPickup.scheduled_time)} — ${nextPickup.customer_name}`
                      : "All pickups for today are done 🎉"}
                </span>
              </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5 lg:shrink-0">
              <Link
                to="/employee/mytask"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #02C39A, #7EE8CC)", color: "#05282A" }}
              >
                <ClipboardList size={15} /> My Tasks
              </Link>
              <Link
                to="/employee/pickups"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97]"
                style={{ background: "rgba(255,255,255,0.12)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <Truck size={15} /> Assigned Pickups
              </Link>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Truck} label="Pickups Today" value={stats.total} color="#028090" bg="#DFF3F5" to="/employee/pickups" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="#9A6A12" bg="#FBF0DC" />
          <StatCard icon={Loader2} label="In Progress" value={stats.inProgress} color="#0B3B3E" bg="#DCEBEA" />
          <StatCard icon={CheckCircle2} label="Collected" value={stats.completed} color="#02C39A" bg="#DFF7F1" />
        </div>

        {/* Error banner */}
        {error && (
          <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ------------------------------------------------ Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Today's pickups */}
          <div className="lg:col-span-2 bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
            <SectionHeader icon={Truck} title="Today's Pickups" to="/employee/pickups" />
            {pickupsLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-[#EEF7F6] animate-pulse" />
                ))}
              </div>
            ) : pickups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#EEF7F6" }}>
                  <Inbox size={22} className="text-[#028090]" strokeWidth={1.7} />
                </div>
                <p className="text-sm font-medium text-[#0F2C2E]">No pickups scheduled today</p>
                <p className="text-xs text-[#6B8482] mt-1">New assignments will appear here instantly.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF7F6]">
                {visiblePickups.map((t) => (
                  <div key={t.id} className="px-5 py-3.5 flex items-center gap-3 sm:gap-4 hover:bg-[#FAFDFC] transition-colors">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: t.status === "completed" ? "#DFF7F1" : t.status === "in_progress" ? "#DCEBEA" : "#FBF0DC" }}
                    >
                      <Truck size={15} style={{ color: t.status === "completed" ? "#02C39A" : t.status === "in_progress" ? "#0B3B3E" : "#9A6A12" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0F2C2E] truncate">{t.customer_name}</span>
                        <span className="text-[11px] text-[#A9C9C6] font-semibold">#{t.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-[11px] text-[#6B8482] flex items-center gap-1">
                          <Clock size={10} /> {formatTime(t.scheduled_time)}
                        </span>
                        {t.customer_phone && (
                          <span className="text-[11px] text-[#6B8482] flex items-center gap-1">
                            <Phone size={10} /> {t.customer_phone}
                          </span>
                        )}
                        {t.customer_address && (
                          <span className="text-[11px] text-[#6B8482] flex items-center gap-1 truncate max-w-[180px] sm:max-w-[260px]">
                            <MapPin size={10} className="shrink-0" /> <span className="truncate">{t.customer_address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <StatusPill status={t.status} />
                    </div>
                    <div className="shrink-0">
                      <ActionBtn
                        status={t.status}
                        busy={updatingId === t.id}
                        onStart={() => updateStatus(t.id, "in_progress")}
                        onComplete={() => updateStatus(t.id, "completed")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's schedule */}
          <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
            <SectionHeader icon={ClipboardList} title="Today's Schedule" to="/employee/mytask" />
            {scheduleLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-[#EEF7F6] animate-pulse" />
                ))}
              </div>
            ) : visibleSchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#EEF7F6" }}>
                  <Sparkles size={22} className="text-[#028090]" strokeWidth={1.7} />
                </div>
                <p className="text-sm font-medium text-[#0F2C2E]">Nothing left on today's plate</p>
                <p className="text-xs text-[#6B8482] mt-1">All tasks are completed — great work!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF7F6]">
                {visibleSchedule.map((t) => (
                  <div key={t.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#FAFDFC] transition-colors">
                    <div
                      className="w-14 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-semibold"
                      style={{ background: "#DFF3F5", color: "#028090" }}
                    >
                      {formatTime(t.scheduled_time)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[#0F2C2E] truncate">
                        {TASK_TYPE_LABEL[t.task_type] || t.task_type} · {t.customer_name}
                      </div>
                    </div>
                    <StatusPill status={t.status} />
                  </div>
                ))}
              </div>
            )}
            {!scheduleLoading && schedule.filter((t) => t.status !== "completed").length > 6 && (
              <div className="px-5 py-3 border-t border-[#EEF7F6]">
                <Link
                  to="/employee/mytask"
                  className="text-xs font-semibold text-[#028090] hover:text-[#02C39A] transition-colors inline-flex items-center gap-1"
                >
                  See full task list <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
