import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  UserCheck,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Search,
  RefreshCw,
  Store,
} from "lucide-react";
import { getShopCustomers } from "../../api/customerApi";
import { formatDateTime } from "../../utils/orderStatus";

const COLORS = {
  dark: "#05282A",
  primary: "#028090",
  accent: "#02C39A",
  light: "#EEF7F6",
  border: "#D8ECEA",
  muted: "#5C7A78",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the search box so we don't hammer the API per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = async (term = "") => {
    try {
      setLoading(true);
      const res = await getShopCustomers(term ? { search: term } : {});
      setCustomers(res?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(debouncedSearch);
  }, [debouncedSearch]);

  const stats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((c) => c.user?.isActive !== false).length,
      withOrders: customers.filter((c) => Number(c.orderCount || 0) > 0).length,
      totalOrders: customers.reduce(
        (sum, c) => sum + (Number(c.orderCount) || 0),
        0,
      ),
    }),
    [customers],
  );

  const cards = [
    { title: "Total Customers", value: stats.total, icon: Users },
    { title: "Active Accounts", value: stats.active, icon: UserCheck },
    { title: "Customers with Orders", value: stats.withOrders, icon: ShoppingBag },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-white p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ===================== HEADER ===================== */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "'Libre Baskerville', serif", color: COLORS.dark }}>
            Customers
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Everyone who signed up or placed an order at your laundry.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(debouncedSearch)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0 transition hover:opacity-90"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* ===================== SUMMARY CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl p-5 border"
              style={{ borderColor: COLORS.border, backgroundColor: "#FFFFFF" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.light, color: COLORS.primary }}
              >
                <Icon size={21} />
              </div>
              <p className="text-2xl font-semibold mt-4 truncate" style={{ color: COLORS.dark }}>
                {loading ? "—" : card.value}
              </p>
              <p className="text-sm mt-1" style={{ color: COLORS.muted }}>{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* ===================== SEARCH ===================== */}
      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.muted }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone or city…"
          className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)]"
          style={{ backgroundColor: COLORS.light, color: COLORS.dark, borderColor: COLORS.border }}
        />
      </div>

      {/* ===================== CUSTOMERS TABLE ===================== */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#028090] border-t-transparent animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: COLORS.border, backgroundColor: "#FFFFFF" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.light }}>
            <Users size={24} color={COLORS.primary} />
          </div>
          <p className="text-sm" style={{ color: COLORS.muted }}>
            {debouncedSearch
              ? `No customers match "${debouncedSearch}".`
              : "No customers yet — when customers sign up or place orders, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: COLORS.border }}>
          <table className="w-full text-sm min-w-[820px]" style={{ backgroundColor: "#FFFFFF" }}>
            <thead>
              <tr className="text-left" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="font-medium px-5 py-3">Customer</th>
                <th className="font-medium px-5 py-3">Contact</th>
                <th className="font-medium px-5 py-3">Address</th>
                <th className="font-medium px-5 py-3">Orders</th>
                <th className="font-medium px-5 py-3">Joined</th>
                <th className="font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const orderCount = Number(c.orderCount || 0);
                const active = c.user?.isActive !== false;
                return (
                  <tr key={c.id} className="transition-colors" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
                        >
                          {(c.name || "C").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate" style={{ color: COLORS.dark }}>{c.name || "—"}</div>
                          <div className="text-xs truncate flex items-center gap-1" style={{ color: COLORS.muted }}>
                            <Mail size={11} /> {c.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5" style={{ color: COLORS.dark }}>
                        <Phone size={13} style={{ color: COLORS.primary }} />
                        {c.phone || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-1.5 text-xs max-w-[220px]" style={{ color: COLORS.muted }}>
                        <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
                        <span className="truncate" title={[c.address, c.city].filter(Boolean).join(", ")}>
                          {[c.address, c.city].filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: orderCount > 0 ? `${COLORS.accent}1A` : COLORS.light, color: orderCount > 0 ? "#00876E" : COLORS.muted }}
                      >
                        {orderCount} order{orderCount === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: COLORS.muted }}>
                      {formatDateTime(c.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: active ? `${COLORS.accent}1A` : "#FBE9E8", color: active ? "#00876E" : "#E0645C" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? COLORS.accent : "#E0645C" }} />
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Hint */}
      <div className="mt-5 flex items-center gap-2 text-xs" style={{ color: COLORS.muted }}>
        <Store size={13} style={{ color: COLORS.primary }} />
        Customers are automatically listed here the moment they sign up or place their first order.
      </div>
    </div>
  );
}