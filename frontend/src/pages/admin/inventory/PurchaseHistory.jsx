import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ShoppingCart,
  Package,
  Calendar,
  Loader2,
  Eye,
} from "lucide-react";

import { getPurchaseHistory } from "../../../api/inventoryTransactionApi";

const COLORS = {
  dark: "#05282A",
  primary: "#028090",
  mint: "#02C39A",
  bg: "#F4FAF9",
  card: "#FFFFFF",
  border: "#D8ECEA",
  text: "#0F2C2E",
  muted: "#64817F",
};

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH PURCHASE HISTORY
  // ==========================================

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchaseHistory();

      setPurchases(response?.data || []);
    } catch (err) {
      console.error("Purchase history error:", err);

      setError(
        err?.response?.data?.message || "Failed to load purchase history.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredPurchases = purchases.filter((purchase) => {
    const searchText = search.toLowerCase();

    return (
      purchase.referenceNumber?.toLowerCase().includes(searchText) ||
      purchase.supplier?.name?.toLowerCase().includes(searchText) ||
      purchase.inventoryItem?.name?.toLowerCase().includes(searchText)
    );
  });

  // ==========================================
  // DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ======================================
          HEADER
      ======================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl"
            style={{
              color: COLORS.text,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Purchase History
          </h1>

          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            View all inventory purchases made from suppliers.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPurchases}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.primary,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ======================================
          ERROR
      ======================================= */}

      {error && (
        <div
          className="mb-5 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FECACA",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================
          SUMMARY CARDS
      ======================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* TOTAL PURCHASES */}

        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: COLORS.muted }}>
                Total Purchases
              </p>

              <h2
                className="text-2xl font-semibold mt-2"
                style={{ color: COLORS.text }}
              >
                {purchases.length}
              </h2>
            </div>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "#E5F7F3",
              }}
            >
              <ShoppingCart size={20} style={{ color: COLORS.primary }} />
            </div>
          </div>
        </div>

        {/* TOTAL ITEMS */}

        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: COLORS.muted }}>
                Items Purchased
              </p>

              <h2
                className="text-2xl font-semibold mt-2"
                style={{ color: COLORS.text }}
              >
                {purchases.reduce(
                  (total, purchase) => total + Number(purchase.quantity || 0),
                  0,
                )}
              </h2>
            </div>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "#E5F7F3",
              }}
            >
              <Package size={20} style={{ color: COLORS.primary }} />
            </div>
          </div>
        </div>

        {/* THIS MONTH */}

        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: COLORS.muted }}>
                This Month
              </p>

              <h2
                className="text-2xl font-semibold mt-2"
                style={{ color: COLORS.text }}
              >
                {
                  purchases.filter((purchase) => {
                    const date = new Date(purchase.createdAt);

                    const now = new Date();

                    return (
                      date.getMonth() === now.getMonth() &&
                      date.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </h2>
            </div>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "#E5F7F3",
              }}
            >
              <Calendar size={20} style={{ color: COLORS.primary }} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          TABLE CARD
      ======================================= */}

      <div
        className="rounded-2xl"
        style={{
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {/* TABLE HEADER */}

        <div className="p-5 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: COLORS.text }}
              >
                Purchase Records
              </h2>

              <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                Complete history of inventory purchases.
              </p>
            </div>

            {/* SEARCH */}

            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 w-full sm:w-72"
              style={{
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Search size={16} style={{ color: COLORS.muted }} />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search supplier, item..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* ======================================
            TABLE
        ======================================= */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: "#F8FCFB",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                <th className="text-left py-3 px-5">Date</th>

                <th className="text-left py-3 px-3">Purchase / Invoice</th>

                <th className="text-left py-3 px-3">Supplier</th>

                <th className="text-left py-3 px-3">Item</th>

                <th className="text-right py-3 px-3">Quantity</th>

                <th className="text-left py-3 px-3">Notes</th>

                <th className="text-right py-3 px-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <Loader2
                      size={24}
                      className="animate-spin mx-auto"
                      style={{
                        color: COLORS.primary,
                      }}
                    />
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-12 text-center"
                    style={{
                      color: COLORS.muted,
                    }}
                  >
                    <ShoppingCart size={30} className="mx-auto mb-2" />
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    {/* DATE */}

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Calendar
                          size={14}
                          style={{
                            color: COLORS.muted,
                          }}
                        />

                        {formatDate(purchase.createdAt)}
                      </div>
                    </td>

                    {/* REFERENCE */}

                    <td
                      className="py-4 px-3 font-medium"
                      style={{
                        color: COLORS.primary,
                      }}
                    >
                      {purchase.referenceNumber || `PUR-${purchase.id}`}
                    </td>

                    {/* SUPPLIER */}

                    <td className="py-4 px-3">
                      <div
                        className="font-medium"
                        style={{
                          color: COLORS.text,
                        }}
                      >
                        {purchase.supplier?.name || "-"}
                      </div>

                      {purchase.supplier?.phone && (
                        <div
                          className="text-xs mt-1"
                          style={{
                            color: COLORS.muted,
                          }}
                        >
                          {purchase.supplier.phone}
                        </div>
                      )}
                    </td>

                    {/* ITEM */}

                    <td className="py-4 px-3">
                      <div
                        className="font-medium"
                        style={{
                          color: COLORS.text,
                        }}
                      >
                        {purchase.inventoryItem?.name ||
                          purchase.item?.name ||
                          "-"}
                      </div>
                    </td>

                    {/* QUANTITY */}

                    <td
                      className="py-4 px-3 text-right font-semibold"
                      style={{
                        color: COLORS.text,
                      }}
                    >
                      {purchase.quantity}
                    </td>

                    {/* NOTES */}

                    <td
                      className="py-4 px-3 max-w-xs truncate"
                      style={{
                        color: COLORS.muted,
                      }}
                    >
                      {purchase.notes || "-"}
                    </td>

                    {/* ACTION */}

                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: "#E7F3F1",
                          color: COLORS.primary,
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
