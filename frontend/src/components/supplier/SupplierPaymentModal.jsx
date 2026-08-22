import { useEffect, useState } from "react";
import {
  X,
  Wallet,
  Building2,
  ShoppingCart,
  IndianRupee,
  CreditCard,
  FileText,
  Calendar,
  Loader2,
} from "lucide-react";

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm = {
  supplierId: "",
  purchaseId: "",
  amount: "",
  paymentMethod: "Cash",
  transactionId: "",
  referenceNumber: "",
  paymentDate: "",
  description: "",
  remarks: "",
};

// =====================================================
// COMPONENT
// =====================================================

export default function SupplierPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,

  // Optional data from parent
  suppliers = [],
  purchases = [],

  // Optional pre-selected supplier/purchase
  selectedSupplier = null,
  selectedPurchase = null,
}) {
  const [form, setForm] = useState(initialForm);

  const [selectedPurchaseData, setSelectedPurchaseData] = useState(null);

  const [error, setError] = useState("");

  // ===================================================
  // RESET / INITIALIZE
  // ===================================================

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().split("T")[0];

    setForm({
      ...initialForm,
      supplierId: selectedSupplier?.id || selectedSupplier?.supplierId || "",
      purchaseId: selectedPurchase?.id || selectedPurchase?.purchaseId || "",
      paymentDate: today,
    });

    setSelectedPurchaseData(selectedPurchase || null);

    setError("");
  }, [isOpen, selectedSupplier, selectedPurchase]);

  // ===================================================
  // CHANGE HANDLER
  // ===================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");

    // Purchase selected
    if (name === "purchaseId") {
      const purchase = purchases.find(
        (item) => String(item.id) === String(value),
      );

      setSelectedPurchaseData(purchase || null);

      // Automatically select supplier
      if (purchase?.supplierId) {
        setForm((prev) => ({
          ...prev,
          purchaseId: value,
          supplierId: purchase.supplierId,
        }));
      }
    }
  };

  // ===================================================
  // PURCHASE AMOUNT
  // ===================================================

  const purchaseTotal = Number(selectedPurchaseData?.totalAmount || 0);

  const purchasePaid = Number(selectedPurchaseData?.paidAmount || 0);

  const outstandingAmount = Number(
    selectedPurchaseData?.dueAmount ??
      Math.max(purchaseTotal - purchasePaid, 0),
  );

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // -----------------------------------------------
    // REQUIRED VALIDATION
    // -----------------------------------------------

    if (!form.supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (!form.purchaseId) {
      setError("Please select a purchase.");
      return;
    }

    if (!form.amount) {
      setError("Please enter payment amount.");
      return;
    }

    const amount = Number(form.amount);

    if (amount <= 0) {
      setError("Payment amount must be greater than 0.");
      return;
    }

    // Do not allow payment above outstanding
    if (outstandingAmount > 0 && amount > outstandingAmount) {
      setError(
        `Payment cannot be greater than outstanding amount (${formatCurrency(
          outstandingAmount,
        )}).`,
      );
      return;
    }

    // -----------------------------------------------
    // PAYLOAD
    // -----------------------------------------------

    const payload = {
      paymentType: "SUPPLIER",

      supplierId: Number(form.supplierId),

      purchaseId: Number(form.purchaseId),

      amount,

      paymentMethod: form.paymentMethod,

      transactionId: form.transactionId.trim() || null,

      referenceNumber: form.referenceNumber.trim() || null,

      paymentDate: form.paymentDate || undefined,

      description: form.description.trim() || null,

      remarks: form.remarks.trim() || null,

      status: "Paid",
    };

    try {
      await onSubmit(payload);

      setForm(initialForm);
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Failed to record supplier payment.",
      );
    }
  };

  // ===================================================
  // CLOSE
  // ===================================================

  const handleClose = () => {
    if (loading) return;

    setForm(initialForm);
    setSelectedPurchaseData(null);
    setError("");

    onClose();
  };

  // ===================================================
  // FORMAT CURRENCY
  // ===================================================

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  // ===================================================
  // DON'T RENDER
  // ===================================================

  if (!isOpen) {
    return null;
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="font-body fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .font-heading { font-family: 'Libre Baskerville', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-[#D8ECEA] bg-[#F7FAF9] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F7F5]">
              <Wallet size={21} className="text-[#028090]" />
            </div>

            <div>
              <h2 className="font-heading text-base font-bold text-[#0F2C2E] sm:text-lg">
                Record Supplier Payment
              </h2>

              <p className="text-xs text-[#51787C]">
                Record a payment against a supplier purchase.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl p-2 text-[#51787C] transition hover:bg-[#EAF4F3] hover:text-[#0F2C2E] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6">
          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* =================================================
                SUPPLIER
            ================================================= */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Supplier <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Building2
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <select
                  name="supplierId"
                  value={form.supplierId}
                  onChange={handleChange}
                  disabled={loading || Boolean(selectedSupplier)}
                  className="w-full appearance-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">Select supplier</option>

                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name ||
                        supplier.supplierName ||
                        supplier.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* =================================================
                PURCHASE
            ================================================= */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Purchase <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <ShoppingCart
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <select
                  name="purchaseId"
                  value={form.purchaseId}
                  onChange={handleChange}
                  disabled={loading || Boolean(selectedPurchase)}
                  className="w-full appearance-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">Select purchase</option>

                  {purchases
                    .filter((purchase) => {
                      if (!form.supplierId) {
                        return true;
                      }

                      return (
                        String(purchase.supplierId) === String(form.supplierId)
                      );
                    })
                    .map((purchase) => (
                      <option key={purchase.id} value={purchase.id}>
                        {purchase.purchaseNumber ||
                          purchase.invoiceNumber ||
                          `Purchase #${purchase.id}`}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* =================================================
                PURCHASE SUMMARY
            ================================================= */}

            {selectedPurchaseData && (
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#D8ECEA] bg-[#F7FAF9] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[#51787C]">Purchase Total</p>

                  <p className="mt-1 font-semibold text-[#0F2C2E]">
                    {formatCurrency(purchaseTotal)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#51787C]">Already Paid</p>

                  <p className="mt-1 font-semibold text-[#00A896]">
                    {formatCurrency(purchasePaid)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#51787C]">Outstanding</p>

                  <p className="mt-1 font-semibold text-red-600">
                    {formatCurrency(outstandingAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                AMOUNT + PAYMENT METHOD
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* AMOUNT */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                  Payment Amount <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <IndianRupee
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                  />

                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    max={outstandingAmount > 0 ? outstandingAmount : undefined}
                    placeholder="Enter amount"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              {/* PAYMENT METHOD */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                  Payment Method <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CreditCard
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                  />

                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
                  >
                    <option value="Cash">Cash</option>

                    <option value="UPI">UPI</option>

                    <option value="Card">Card</option>

                    <option value="Bank_Transfer">Bank Transfer</option>

                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>

            {/* =================================================
                TRANSACTION ID + REFERENCE
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                  Transaction ID
                </label>

                <input
                  type="text"
                  name="transactionId"
                  value={form.transactionId}
                  onChange={handleChange}
                  placeholder="e.g. UPI transaction ID"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                  Reference Number
                </label>

                <input
                  type="text"
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleChange}
                  placeholder="Cheque / bank reference"
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* =================================================
                PAYMENT DATE
            ================================================= */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Payment Date
              </label>

              <div className="relative">
                <Calendar
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#028090]"
                />

                <input
                  type="date"
                  name="paymentDate"
                  value={form.paymentDate}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Description
              </label>

              <div className="relative">
                <FileText
                  size={17}
                  className="absolute left-3 top-3 text-[#028090]"
                />

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Payment description..."
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-10 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
                />
              </div>
            </div>

            {/* =================================================
                REMARKS
            ================================================= */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F2C2E]">
                Remarks
              </label>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={2}
                placeholder="Additional remarks..."
                disabled={loading}
                className="w-full resize-none rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:bg-white"
              />
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#D8ECEA] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-[#D8ECEA] bg-white px-5 py-3 text-sm font-semibold text-[#51787C] transition hover:bg-[#EEF7F6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#028090] to-[#00A896] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Wallet size={17} />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
