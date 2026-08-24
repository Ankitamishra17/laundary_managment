import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const TYPE_COLORS = {
  order: "#028090",
  task: "#00A896",
  payment: "#D4A017",
  system: "#5C7A78",
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await notificationApi.getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    }
  };

  const handleOpen = async (n) => {
    if (!n.isRead) {
      try {
        await notificationApi.markRead(n.id);
      } catch {
        /* ignore */
      }
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
            >
              <Bell size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl text-[#0F2C2E] leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Notifications
              </h1>
              <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
                {unread > 0 ? `${unread} unread notification${unread !== 1 ? "s" : ""}` : "You're all caught up"}
              </p>
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: "#DFF3F5", color: colors.primaryTeal }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* List */}
        <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: colors.primaryTeal }} />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF7F6" }}>
                <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-medium text-[#0F2C2E]">No notifications yet</p>
              <p className="text-xs text-[#6B8482] mt-1">
                Updates about tasks and orders will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF7F6]">
              {items.map((n) => (                  <button
                    key={n.id}
                    onClick={() => handleOpen(n)}
                    className="w-full text-left px-5 py-4 flex items-start gap-3 transition-colors hover:bg-[#FAFDFC]"
                  >
                    <span
                      className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: n.isRead ? colors.cardBorder : (TYPE_COLORS[n.type] || colors.primaryTeal),
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: colors.textDark }}>
                          {n.title}
                          {!n.isRead && (
                            <span
                              className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white align-middle"
                              style={{ backgroundColor: colors.primaryTeal }}
                            >
                              NEW
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] flex-shrink-0" style={{ color: colors.textMuted }}>
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      {n.message && (
                        <p className="text-[13px] mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
                          {n.message}
                        </p>
                      )}
                      {/* Tags for task/order context */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {n.orderId && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: "#DFF3F5", color: "#028090" }}
                          >
                            Order #{n.orderId}
                          </span>
                        )}
                        {n.type && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md capitalize"
                            style={{ backgroundColor: "#EEF7F6", color: TYPE_COLORS[n.type] || colors.textMuted }}
                          >
                            {n.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
