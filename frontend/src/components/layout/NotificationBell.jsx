import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
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

const TYPE_COLORS = {
  order: "#028090",
  task: "#00A896",
  payment: "#D4A017",
  system: "#5C7A78",
};

/**
 * NotificationBell — bell icon with unread badge + dropdown panel.
 * Polls the unread count every 20s so updates (new order, task assigned,
 * status changed) appear without a manual refresh.
 *
 * @param {boolean} dark  render on a dark background (e.g. customer navbar)
 */
export default function NotificationBell({ dark = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnread(count);
    } catch {
      /* best effort */
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 10000);
    return () => clearInterval(t);
  }, [refreshCount]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openPanel = async () => {
    setOpen((v) => !v);
    if (!open) {
      setLoading(true);
      try {
        const res = await notificationApi.getNotifications();
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setItems(list);
        setUnread(list.filter((n) => !n.isRead).length);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const handleOpenItem = async (n) => {
    try {
      await notificationApi.markRead(n.id);
    } catch {
      /* ignore */
    }
    setUnread((u) => Math.max(0, u - (n.isRead ? 0 : 1)));
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const iconColor = dark ? "#FFFFFF" : colors.textDark;
  const badgeBg = dark ? colors.mint : colors.primaryTeal;

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={openPanel}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          dark ? "hover:bg-white/10" : "hover:bg-[#D8ECEA]"
        }`}
        style={dark ? undefined : { backgroundColor: colors.cardTint }}
      >
        <Bell size={16} style={{ color: iconColor }} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: badgeBg }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] overflow-hidden rounded-2xl z-50 flex flex-col"
          style={{
            backgroundColor: colors.bgLight,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: "0 24px 60px -12px rgba(5,40,42,0.35)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint }}
          >
            <div className="text-sm font-semibold" style={{ color: colors.textDark }}>
              Notifications
              {unread > 0 && (
                <span
                  className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: colors.primaryTeal }}
                >
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:opacity-80"
                style={{ color: colors.primaryTeal }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: colors.cardTint }}
                >
                  <Inbox size={20} style={{ color: colors.textMuted }} />
                </div>
                <p className="text-sm font-medium" style={{ color: colors.textDark }}>
                  No notifications yet
                </p>
                <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                  Updates about orders and tasks will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF7F6]">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleOpenItem(n)}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-[#FAFDFC]"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: n.isRead ? colors.cardBorder : (TYPE_COLORS[n.type] || colors.primaryTeal),
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className="text-[13px] font-semibold truncate"
                            style={{ color: colors.textDark }}
                          >
                            {n.title}
                          </span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: colors.textMuted }}>
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        {n.message && (
                          <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: colors.textMuted }}>
                            {n.message}
                          </p>
                        )}
                        {n.orderId && (
                          <span
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1"
                            style={{ backgroundColor: "#DFF3F5", color: "#028090" }}
                          >
                            Order #{n.orderId}
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
      )}
    </div>
  );
}
