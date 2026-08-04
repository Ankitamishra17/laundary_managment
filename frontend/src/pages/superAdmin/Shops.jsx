import { useEffect, useState } from "react";
import { getShops } from "../../api/shopApi";
import CreateShopModal from "../../components/shop/CreateShopModal";
import EditShopModal from "../../components/shop/EditShopModal";
import DeleteShopModal from "../../components/shop/DeleteShopModal";

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [deletingShop, setDeletingShop] = useState(null);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await getShops();
      setShops(data.shops || data.data || []);
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handleShopCreated = (newShop) => {
    // Optimistically add, then refresh from server for accuracy
    if (newShop) setShops((prev) => [newShop, ...prev]);
    loadShops();
  };

  const handleShopUpdated = (updatedShop) => {
    setShops((prev) =>
      prev.map((s) => (s.id === updatedShop.id ? { ...s, ...updatedShop } : s))
    );
  };

  const handleShopDeleted = (deletedId) => {
    setShops((prev) => prev.filter((s) => s.id !== deletedId));
  };

  return (
    <div className="shops-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

        .shops-page {
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

        .shops-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .shops-header h1 {
          font-family: 'Libre Baskerville', serif;
          color: var(--text-dark);
          font-size: 26px;
          margin: 0 0 4px;
        }

        .shops-header p {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0;
        }

        .create-shop-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--teal-primary), var(--seafoam));
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .table-scroll {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid var(--card-border);
        }

        .shops-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
          background: var(--card-tint);
        }

        .shops-table th {
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          padding: 14px 16px;
          border-bottom: 1px solid var(--card-border);
          white-space: nowrap;
        }

        .shops-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: var(--text-dark);
          border-bottom: 1px solid var(--card-border);
          background: var(--bg-light);
          white-space: nowrap;
        }

        .shops-table tr:last-child td {
          border-bottom: none;
        }

        .status-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(2, 195, 154, 0.12);
          color: var(--teal-primary);
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-size: 14px;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

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

        .action-btn.edit {
          border-color: var(--teal-primary);
          color: var(--teal-primary);
        }

        .action-btn.delete {
          border-color: #F3B9B5;
          color: #B3261E;
        }
      `}</style>

      <div className="shops-header">
        <div>
          <h1>Shops</h1>
          <p>All laundry shops registered on the platform</p>
        </div>
        <button className="create-shop-btn" onClick={() => setIsCreateOpen(true)}>
          + Create Shop
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading shops...</div>
      ) : shops.length === 0 ? (
        <div className="empty-state">No shops yet. Create your first one.</div>
      ) : (
        <div className="table-scroll">
          <table className="shops-table">
            <thead>
              <tr>
                <th>Shop Code</th>
                <th>Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>City</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id}>
                  <td>{shop.shopCode}</td>
                  <td>{shop.name}</td>
                  <td>{shop.ownerName}</td>
                  <td>{shop.email}</td>
                  <td>{shop.phone}</td>
                  <td>{shop.city}</td>
                  <td>{shop.subscriptionPlan}</td>
                  <td>
                    <span className="status-pill">{shop.subscriptionStatus}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => setEditingShop(shop)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeletingShop(shop)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateShopModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onShopCreated={handleShopCreated}
      />

      <EditShopModal
        isOpen={!!editingShop}
        shop={editingShop}
        onClose={() => setEditingShop(null)}
        onShopUpdated={handleShopUpdated}
      />

      <DeleteShopModal
        isOpen={!!deletingShop}
        shop={deletingShop}
        onClose={() => setDeletingShop(null)}
        onShopDeleted={handleShopDeleted}
      />
    </div>
  );
}