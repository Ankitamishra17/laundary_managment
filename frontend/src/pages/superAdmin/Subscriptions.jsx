import { useEffect, useMemo, useState } from "react";
import { getSubscriptions } from "../../api/subscriptionApi";
import CreateSubscriptionModal from "../../components/subscription/CreateSubscriptionModal";
import RenewSubscriptionModal from "../../components/subscription/RenewSubscriptionModal";
import CancelSubscriptionModal from "../../components/subscription/CancelSubscriptionModal";

const STATUS_FILTERS = ["All", "Active", "Expired", "Cancelled", "Trial"];

function StatusPill({ status }) {
  const map = {
    Active: { bg: "rgba(2, 195, 154, 0.12)", color: "#028090" },
    Trial: { bg: "rgba(2, 128, 144, 0.10)", color: "#028090" },
    Expired: { bg: "#FFF3E0", color: "#B36B00" },
    Cancelled: { bg: "#FDECEC", color: "#B3261E" },
  };
  const style = map[status] || { bg: "#EEF7F6", color: "#5A7A79" };
  return (
    <span
      className="status-pill"
      style={{ background: style.bg, color: style.color }}
    >
      {status || "Unknown"}
    </span>
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renewingSub, setRenewingSub] = useState(null);
  const [cancellingSub, setCancellingSub] = useState(null);

  const loadSubscriptions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSubscriptions();
      setSubscriptions(data.subscriptions || data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleCreated = (newSub) => {
    if (newSub) setSubscriptions((prev) => [newSub, ...prev]);
    loadSubscriptions();
  };

  const handleRenewed = (updatedSub) => {
    if (updatedSub) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === updatedSub.id ? { ...s, ...updatedSub } : s))
      );
    } else {
      loadSubscriptions();
    }
  };

  const handleCancelled = (updatedSub) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === updatedSub.id ? { ...s, ...updatedSub, status: "Cancelled" } : s
      )
    );
  };

  const filteredSubs = useMemo(() => {
    if (statusFilter === "All") return subscriptions;
    return subscriptions.filter((s) => s.status === statusFilter);
  }, [subscriptions, statusFilter]);

  const summary = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === "Active").length;
    const expired = subscriptions.filter((s) => s.status === "Expired").length;
    const cancelled = subscriptions.filter((s) => s.status === "Cancelled").length;
    const revenue = subscriptions
      .filter((s) => s.status === "Active")
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    return { active, expired, cancelled, revenue, total: subscriptions.length };
  }, [subscriptions]);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <div className="subs-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

        .subs-page {
          --teal-primary: #028090;
          --seafoam: #00A896;
          --mint: #02C39A;
          --bg-light: #FFFFFF;
          --card-tint: #EEF7F6;
          --card-border: #D8ECEA;
          --text-dark: #0F2C2E;
          --text-muted: #5A7A79;

          font-family: 'Inter', sans-serif;
          background: var(--bg-light);
          min-height: 100vh;
          padding: 40px;
        }

        .subs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .subs-header h1 {
          font-family: 'Libre Baskerville', serif;
          color: var(--text-dark);
          font-size: 26px;
          margin: 0 0 4px;
        }

        .subs-header p {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0;
        }

        .create-sub-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--teal-primary), var(--seafoam));
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .summary-card {
          background: var(--card-tint);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 18px;
        }

        .summary-card .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .summary-card .value {
          font-family: 'Libre Baskerville', serif;
          font-size: 24px;
          color: var(--text-dark);
        }

        .summary-card.accent .value { color: var(--teal-primary); }

        .filter-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .filter-chip {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid var(--card-border);
          background: var(--bg-light);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .filter-chip.active {
          background: var(--teal-primary);
          border-color: var(--teal-primary);
          color: white;
        }

        .table-scroll {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid var(--card-border);
        }

        .subs-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
          background: var(--card-tint);
        }

        .subs-table th {
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          padding: 14px 16px;
          border-bottom: 1px solid var(--card-border);
          white-space: nowrap;
        }

        .subs-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: var(--text-dark);
          border-bottom: 1px solid var(--card-border);
          background: var(--bg-light);
          white-space: nowrap;
        }

        .subs-table tr:last-child td { border-bottom: none; }

        .status-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .empty-state, .error-state {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-size: 14px;
        }

        .error-state { color: #B3261E; }

        .actions-cell { display: flex; gap: 8px; }

        .action-btn {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--card-border);
          background: var(--card-tint);
          color: var(--text-dark);
        }

        .action-btn.renew { border-color: var(--teal-primary); color: var(--teal-primary); }
        .action-btn.cancel { border-color: #F3B9B5; color: #B3261E; }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="subs-header">
        <div>
          <h1>Subscriptions</h1>
          <p>Manage shop subscription plans and billing</p>
        </div>
        <button className="create-sub-btn" onClick={() => setIsCreateOpen(true)}>
          + New Subscription
        </button>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="label">Total</div>
          <div className="value">{summary.total}</div>
        </div>
        <div className="summary-card accent">
          <div className="label">Active</div>
          <div className="value">{summary.active}</div>
        </div>
        <div className="summary-card">
          <div className="label">Expired</div>
          <div className="value">{summary.expired}</div>
        </div>
        <div className="summary-card">
          <div className="label">Monthly Revenue (Active)</div>
          <div className="value">₹{summary.revenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="filter-row">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            className={`filter-chip ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading subscriptions...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : filteredSubs.length === 0 ? (
        <div className="empty-state">No subscriptions found.</div>
      ) : (
        <div className="table-scroll">
          <table className="subs-table">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    {sub.shop?.name || sub.shopName || `Shop #${sub.shopId}`}
                    {sub.shop?.shopCode ? ` (${sub.shop.shopCode})` : ""}
                  </td>
                  <td>{sub.plan}</td>
                  <td>₹{Number(sub.amount || 0).toLocaleString("en-IN")}</td>
                  <td>{formatDate(sub.startDate)}</td>
                  <td>{formatDate(sub.endDate)}</td>
                  <td>
                    <StatusPill status={sub.status} />
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-btn renew"
                        onClick={() => setRenewingSub(sub)}
                        disabled={sub.status === "Cancelled"}
                      >
                        Renew
                      </button>
                      <button
                        className="action-btn cancel"
                        onClick={() => setCancellingSub(sub)}
                        disabled={sub.status === "Cancelled"}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateSubscriptionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />

      <RenewSubscriptionModal
        isOpen={!!renewingSub}
        subscription={renewingSub}
        onClose={() => setRenewingSub(null)}
        onRenewed={handleRenewed}
      />

      <CancelSubscriptionModal
        isOpen={!!cancellingSub}
        subscription={cancellingSub}
        onClose={() => setCancellingSub(null)}
        onCancelled={handleCancelled}
      />
    </div>
  );
}