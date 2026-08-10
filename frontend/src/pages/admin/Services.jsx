import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ServiceSearch from "../../components/services/ServiceSearch";
import ServiceFilters from "../../components/services/ServiceFilters";
import ServiceTable from "../../components/services/ServiceTable";
import ServiceCard from "../../components/services/ServiceCard";
import AddServiceModal from "../../components/services/AddServiceModal";
import EditServiceModal from "../../components/services/EditServiceModal";
import DeleteServiceModal from "../../components/services/DeleteServiceModal";
import ViewServiceModal from "../../components/services/ViewServiceModal";
import { getServices, toggleServiceStatus } from "../../api/serviceApi";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  danger: "#E0645C",
};

const PAGE_SIZE = 8;

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });

  const [modal, setModal] = useState(null); // "add" | "edit" | "delete" | "view" | null
  const [activeService, setActiveService] = useState(null);

  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const removeToast = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );
  const showToast = useCallback(
    (message, type = "success") => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3500);
    },
    [removeToast],
  );

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getServices({
        search: search || undefined,
        category: category !== "All Categories" ? category : undefined,
        status: status !== "All Status" ? status : undefined,
        page,
        limit: PAGE_SIZE,
      });

      // Defensive parsing — adjust to match your backend's exact response shape.
      const list = res.services || res.data || (Array.isArray(res) ? res : []);
      const total = res.total ?? list.length;

      setServices(list);
      setTotalPages(
        res.totalPages || Math.max(1, Math.ceil(total / PAGE_SIZE)),
      );
      setSummary({
        total: res.summary?.total ?? total,
        active:
          res.summary?.active ??
          list.filter((s) => s.status === "Active").length,
        inactive:
          res.summary?.inactive ??
          list.filter((s) => s.status === "Inactive").length,
      });
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Couldn't load services.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page, showToast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleToggleStatus = async (service) => {
    try {
      await toggleServiceStatus(service._id || service.id);
      showToast(
        `Marked "${service.name}" as ${service.status === "Active" ? "Inactive" : "Active"}.`,
        "success",
      );
      loadServices();
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Couldn't update status.",
        "error",
      );
    }
  };

  const closeModal = () => {
    setModal(null);
    setActiveService(null);
  };
  const handleSuccess = () => {
    closeModal();
    loadServices();
  };

  const statCards = [
    {
      label: "Total Services",
      value: summary.total,
      color: colors.primaryTeal,
    },
    { label: "Active", value: summary.active, color: colors.mint },
    { label: "Inactive", value: summary.inactive, color: colors.danger },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Toasts */}
      <div className="fixed top-5 right-5 z-[60] flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl"
            style={{
              backgroundColor: colors.bgDark,
              border: `1px solid ${t.type === "success" ? colors.mint : colors.danger}55`,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor:
                  t.type === "success"
                    ? `${colors.mint}26`
                    : `${colors.danger}26`,
              }}
            >
              {t.type === "success" ? (
                <CheckCircle2 size={15} color={colors.mint} />
              ) : (
                <AlertCircle size={15} color={colors.danger} />
              )}
            </div>
            <p
              className="text-sm flex-1 leading-snug"
              style={{ color: "#FFFFFF" }}
            >
              {t.message}
            </p>
            <button
              onClick={() => removeToast(t.id)}
              style={{ color: "#8FB3B0" }}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <h2
        className="text-2xl mb-5"
        style={{
          color: colors.textDark,
          fontFamily: "'Libre Baskerville', serif",
        }}
      >
        Services
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-4 sm:p-5"
            style={{
              backgroundColor: colors.bgLight,
              borderColor: colors.cardBorder,
            }}
          >
            <div
              className="text-2xl sm:text-3xl"
              style={{
                color: s.color,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              {s.value}
            </div>
            <div
              className="text-xs sm:text-sm mt-1"
              style={{ color: colors.textMuted }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <ServiceSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <ServiceFilters
            category={category}
            onCategoryChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md flex-shrink-0"
          style={{
            background: `linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint})`,
          }}
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="flex items-center justify-center gap-2 py-16"
          style={{ color: colors.textMuted }}
        >
          <Loader2 size={18} className="animate-spin" /> Loading services...
        </div>
      ) : services.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 py-16 rounded-2xl border text-center px-6"
          style={{
            backgroundColor: colors.bgLight,
            borderColor: colors.cardBorder,
          }}
        >
          <ClipboardList size={28} style={{ color: colors.textMuted }} />
          <p className="text-sm" style={{ color: colors.textMuted }}>
            No services found. Try adjusting your filters, or add a new one.
          </p>
        </div>
      ) : (
        <>
          <ServiceTable
            services={services}
            onView={(s) => {
              setActiveService(s);
              setModal("view");
            }}
            onEdit={(s) => {
              setActiveService(s);
              setModal("edit");
            }}
            onDelete={(s) => {
              setActiveService(s);
              setModal("delete");
            }}
            onToggleStatus={handleToggleStatus}
          />
          <div className="sm:hidden space-y-3">
            {services.map((s) => (
              <ServiceCard
                key={s._id || s.id}
                service={s}
                onView={(sv) => {
                  setActiveService(sv);
                  setModal("view");
                }}
                onEdit={(sv) => {
                  setActiveService(sv);
                  setModal("edit");
                }}
                onDelete={(sv) => {
                  setActiveService(sv);
                  setModal("delete");
                }}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-1.5 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ color: colors.textMuted }}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-9 h-9 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor:
                      page === p ? colors.primaryTeal : "transparent",
                    color: page === p ? "#FFFFFF" : colors.textDark,
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ color: colors.textMuted }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {modal === "add" && (
        <AddServiceModal
          onClose={closeModal}
          onSuccess={handleSuccess}
          showToast={showToast}
        />
      )}
      {modal === "edit" && (
        <EditServiceModal
          service={activeService}
          onClose={closeModal}
          onSuccess={handleSuccess}
          showToast={showToast}
        />
      )}
      {modal === "delete" && (
        <DeleteServiceModal
          service={activeService}
          onClose={closeModal}
          onSuccess={handleSuccess}
          showToast={showToast}
        />
      )}
      {modal === "view" && (
        <ViewServiceModal service={activeService} onClose={closeModal} />
      )}
    </div>
  );
};

export default Services;
