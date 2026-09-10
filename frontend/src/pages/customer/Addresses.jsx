import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AddAddressModal from "../../components/customer/AddAddressModal";
import {
  MapPin,
  Home,
  Loader2,
  ArrowRight,
  PlusCircle,
  Pencil,
  Trash2,
  Star,
  Eye,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  getAddresses,
  deleteAddress,
  setDefaultAddress,
} from "../../api/customerApi";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  error: "#E0645C",
  errorBg: "#FBE9E8",
};

export default function Addresses() {
  const { slug } = useParams();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // tracks which address id is being acted on

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAddress, setEditAddress] = useState(null);
  const [viewAddress, setViewAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // address to delete

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res = await getAddresses();
      if (res.success) {
        setAddresses(res.data);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load addresses."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (address) => {
    if (address.isDefault) return;
    try {
      setActionLoading(address.id);
      const res = await setDefaultAddress(address.id);
      if (res.success) {
        toast.success("Default address updated.");
        await loadAddresses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update default address.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setActionLoading(deleteConfirm.id);
      const res = await deleteAddress(deleteConfirm.id);
      if (res.success) {
        toast.success("Address deleted successfully.");
        setDeleteConfirm(null);
        await loadAddresses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete address.");
    } finally {
      setActionLoading(null);
    }
  };

  const hasAddress = addresses.length > 0;
  const basePath = slug ? `/${slug}` : "";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl sm:text-3xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Saved Addresses
          </h2>
          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
            Manage your pickup and delivery addresses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <PlusCircle size={18} />
          Add Address
        </button>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" size={30} color={colors.primaryTeal} />
        </div>
      ) : hasAddress ? (
        <div className="grid md:grid-cols-2 gap-5">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-2xl border p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
              style={{
                background: colors.bgLight,
                borderColor: address.isDefault ? colors.mint : colors.cardBorder,
                borderWidth: address.isDefault ? 2 : 1,
              }}
            >
              {/* Top row: icon + label + badge */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${colors.mint}20` }}
                  >
                    <Home color={colors.primaryTeal} size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: colors.textDark }}>
                      {address.label}
                    </h3>
                    <p className="text-xs" style={{ color: colors.textMuted }}>
                      {address.fullName} · {address.phone}
                    </p>
                  </div>
                </div>

                {address.isDefault && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: `${colors.mint}20`, color: colors.primaryTeal }}
                  >
                    Default
                  </span>
                )}
              </div>

              {/* Address details */}
              <p className="mt-3 text-sm leading-6" style={{ color: colors.textMuted }}>
                {address.addressLine1}
                {address.addressLine2 && `, ${address.addressLine2}`}
                {address.landmark && `, ${address.landmark}`}
                <br />
                {address.city}, {address.state} - {address.postalCode}
                {address.country && address.country !== "India" ? `, ${address.country}` : ""}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: colors.cardBorder }}>
                <button
                  onClick={() => setViewAddress(address)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}
                >
                  <Eye size={13} /> View
                </button>

                <button
                  onClick={() => setEditAddress(address)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: `${colors.primaryTeal}10`, color: colors.primaryTeal }}
                >
                  <Pencil size={13} /> Edit
                </button>

                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address)}
                    disabled={actionLoading === address.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: `${colors.mint}10`, color: colors.mint }}
                  >
                    {actionLoading === address.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Star size={13} />
                    )}{' '}
                    Set Default
                  </button>
                )}

                <button
                  onClick={() => setDeleteConfirm(address)}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: colors.errorBg, color: colors.error }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div
          className="max-w-lg mx-auto mt-10 text-center rounded-3xl border p-10"
          style={{ background: colors.bgLight, borderColor: colors.cardBorder }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: `${colors.primaryTeal}20` }}
          >
            <MapPin size={28} color={colors.primaryTeal} />
          </div>

          <h2
            className="mt-5 text-xl"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            No saved addresses
          </h2>

          <p className="mt-3 text-sm" style={{ color: colors.textMuted }}>
            Save your pickup address once and reuse it for every future order.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              <PlusCircle size={16} /> Add Your First Address
            </button>
            <Link
              to={`${basePath}/new-order`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: colors.primaryTeal, backgroundColor: colors.cardTint }}
            >
              <ArrowRight size={16} /> Place an Order
            </Link>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      <AddAddressModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadAddresses}
      />

      {/* Edit Address Modal */}
      <AddAddressModal
        open={!!editAddress}
        onClose={() => setEditAddress(null)}
        onSuccess={loadAddresses}
        editAddress={editAddress}
      />

      {/* View Address Modal */}
      {viewAddress && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-xl"
            style={{ backgroundColor: colors.bgLight }}
          >
            <div
              className="flex items-center justify-between p-5 border-b"
              style={{ borderColor: colors.cardBorder }}
            >
              <h3
                className="text-lg"
                style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
              >
                {viewAddress.label} Address
              </h3>
              <button
                onClick={() => setViewAddress(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {viewAddress.isDefault && (
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${colors.mint}20`, color: colors.primaryTeal }}
                >
                  <Star size={11} /> Default Address
                </span>
              )}

              <div>
                <div className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Name</div>
                <div className="text-sm font-medium" style={{ color: colors.textDark }}>{viewAddress.fullName}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Phone</div>
                <div className="text-sm font-medium" style={{ color: colors.textDark }}>{viewAddress.phone}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>Address</div>
                <div className="text-sm leading-relaxed" style={{ color: colors.textDark }}>
                  {viewAddress.addressLine1}
                  {viewAddress.addressLine2 && <><br />{viewAddress.addressLine2}</>}
                  {viewAddress.landmark && <><br />Landmark: {viewAddress.landmark}</>}
                  <br />{viewAddress.city}, {viewAddress.state} - {viewAddress.postalCode}
                  {viewAddress.country && viewAddress.country !== "India" && <>, {viewAddress.country}</>}
                </div>
              </div>
            </div>

            <div className="p-5 border-t" style={{ borderColor: colors.cardBorder }}>
              <button
                onClick={() => setViewAddress(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: colors.cardBorder, color: colors.textMuted }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl w-full max-w-sm shadow-xl p-6 text-center"
            style={{ backgroundColor: colors.bgLight }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: colors.errorBg }}
            >
              <AlertTriangle size={24} color={colors.error} />
            </div>

            <h3
              className="mt-4 text-lg font-semibold"
              style={{ color: colors.textDark }}
            >
              Delete Address?
            </h3>

            <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
              Are you sure you want to delete the {deleteConfirm.label} address for{' '}
              <span className="font-medium" style={{ color: colors.textDark }}>
                {deleteConfirm.fullName}
              </span>?
              {deleteConfirm.isDefault && (
                <span className="block mt-1 text-xs" style={{ color: colors.error }}>
                  This is your default address. Another address will be set as default.
                </span>
              )}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: colors.cardBorder, color: colors.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteConfirm.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: colors.error }}
              >
                {actionLoading === deleteConfirm.id ? (
                  <Loader2 size={15} className="animate-spin mx-auto" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}