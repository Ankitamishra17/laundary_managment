import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  Truck,
  Clock,
  Loader2,
  CheckCircle2,
  Phone,
  MapPin,
  CalendarClock,
} from "lucide-react";
import { useMyPickups } from "../../hooks/useMyPickups";
import StatusPill from "../../components/layout/StatusPill";
import TaskFilterTabs from "../../components/layout/TaskFilterTabs";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
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

/* ------------------------------------------------------------------ */
/* Action button — status-aware CTA                                    */
/* ------------------------------------------------------------------ */
function PickupAction({ status, busy, onStart, onComplete }) {
  if (status === "pending") {
    return (
      <button
        onClick={onStart}
        disabled={busy}
        className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
      >
        {busy ? <Loader2 size={12} className="animate-spin inline" /> : null}{" "}
        Start Pickup
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button
        onClick={onComplete}
        disabled={busy}
        className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #00A896, #02C39A)" }}
      >
        {busy ? <Loader2 size={12} className="animate-spin inline" /> : null}{" "}
        Mark Collected
      </button>
    );
  }
  return (
    <span className="text-[11px] font-medium text-[#02C39A] flex items-center gap-1 whitespace-nowrap">
      <CheckCircle2 size={13} /> Collected
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#EEF7F6" }}
      >
        <Truck size={24} className="text-[#028090]" strokeWidth={1.7} />
      </div>
      <p className="text-sm font-medium text-[#0F2C2E]">No pickups scheduled</p>
      <p className="text-xs text-[#6B8482] mt-1">
        When your admin assigns a pickup, it will show up here.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                    */
/* ------------------------------------------------------------------ */
function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
      ))}
    </div>
  );
}

export default function AssignedPickups() {
  const { slug } = useParams();
  const {
    tasks = [],
    stats = { total: 0, pending: 0, inProgress: 0, completed: 0 },
    statusFilter,
    setStatusFilter,
    loading,
    error,
    updatingId,
    updateStatus,
  } = useMyPickups();

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #028090, #02C39A)",
              }}
            >
              <Truck size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl text-[#0F2C2E] leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Assigned Pickups
              </h1>
              <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
                Your pickups from today onwards — collect them on time.
              </p>
            </div>
          </div>
          <Link
            to={`/${slug}/employee/mytask`}
            className="text-xs font-semibold text-[#028090] hover:text-[#02C39A] transition-colors inline-flex items-center gap-1.5"
          >
            <CalendarClock size={14} /> View full task list
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Truck}
            label="Total Pickups"
            value={stats.total}
            color="#028090"
            bg="#DFF3F5"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            color="#9A6A12"
            bg="#FBF0DC"
          />
          <StatCard
            icon={Loader2}
            label="In Progress"
            value={stats.inProgress}
            color="#0B3B3E"
            bg="#DCEBEA"
          />
          <StatCard
            icon={CheckCircle2}
            label="Collected"
            value={stats.completed}
            color="#02C39A"
            bg="#DFF7F1"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TaskFilterTabs active={statusFilter} onChange={setStatusFilter} />
          {!loading && (
            <span className="text-xs text-[#6B8482]">
              {tasks.length} pickup{tasks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Content card */}
        <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
          {loading ? (
            <TableSkeleton />
          ) : tasks.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* ---------- Desktop / tablet table ---------- */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                      <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                        Pickup
                      </th>
                      <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                        Customer
                      </th>
                      <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                        Address
                      </th>
                      <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                        Time
                      </th>
                      <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                        Status
                      </th>
                      <th className="text-right font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150"
                      >
                        <td
                          className="py-3.5 px-5 font-semibold"
                          style={{ color: "#028090" }}
                        >
                          #{t.id}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="text-[#0F2C2E] font-medium">
                            {t.customer_name}
                          </div>
                          {t.customer_phone && (
                            <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5">
                              <Phone size={11} /> {t.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          {t.customer_address ? (
                            <div className="flex items-start gap-1 text-[#6B8482] max-w-[260px]">
                              <MapPin size={11} className="mt-0.5 shrink-0" />
                              <span className="line-clamp-2">
                                {t.customer_address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#A9C9C6]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">
                          {formatTime(t.scheduled_time)}
                        </td>
                        <td className="py-3.5 px-5">
                          <StatusPill status={t.status} />
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <PickupAction
                            status={t.status}
                            busy={updatingId === t.id}
                            onStart={() => updateStatus(t.id, "in_progress")}
                            onComplete={() => updateStatus(t.id, "completed")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ---------- Mobile card list ---------- */}
              <div className="md:hidden divide-y divide-[#EEF7F6]">
                {tasks.map((t) => (
                  <div key={t.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#028090" }}
                      >
                        Pickup #{t.id}
                      </span>
                      <StatusPill status={t.status} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0F2C2E]">
                        {t.customer_name}
                      </div>
                      {t.customer_phone && (
                        <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5">
                          <Phone size={11} /> {t.customer_phone}
                        </div>
                      )}
                      {t.customer_address && (
                        <div className="flex items-start gap-1 text-[11px] text-[#6B8482] mt-0.5">
                          <MapPin size={11} className="mt-px shrink-0" />{" "}
                          {t.customer_address}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-[#6B8482]">
                        {formatDay(t.scheduled_time)} &middot;{" "}
                        {formatTime(t.scheduled_time)}
                      </div>
                      <PickupAction
                        status={t.status}
                        busy={updatingId === t.id}
                        onStart={() => updateStatus(t.id, "in_progress")}
                        onComplete={() => updateStatus(t.id, "completed")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
