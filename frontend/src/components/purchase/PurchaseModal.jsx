import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  ShoppingCart,
  Building2,
  CalendarDays,
  Package,
  FileText,
  CreditCard,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#51787C",
  danger: "#E0645C",
};

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const createEmptyItem = () => ({
  inventoryItemId: "",
  quantity: 1,
  rate: "",
});

const inputClass =
  "pm-input w-full rounded-xl border px-4 py-3 outline-none transition disabled:bg-[#EEF7F6]";
const labelClass = "mb-2 flex items-center gap-2 text-sm font-medium";

const PurchaseModal = ({
  isOpen,
  purchase,
  suppliers = [],
  inventoryItems = [],
  loading = false,
  onClose,
  onSubmit,
}) => {
  // =====================================================
  // STATE
  // =====================================================

  const [formData, setFormData] = useState({
    supplierId: "",
    invoiceNo: "",
    purchaseDate: getToday(),
    paidAmount: "",
    paymentMethod: "",
    transactionId: "",
    referenceNumber: "",
    description: "",
    remarks: "",
    discount: 0,
    tax: 0,
  });

  const [items, setItems] = useState([createEmptyItem()]);

  // =====================================================
  // RESET / EDIT DATA
  // =====================================================

  useEffect(() => {
    if (!isOpen) return;

    if (purchase) {
      const purchaseItems =
        purchase.items ||
        purchase.purchaseItems ||
        purchase.PurchaseItems ||
        [];

      setFormData({
        supplierId: purchase.supplierId
          ? String(purchase.supplierId)
          : purchase.supplier?.id
            ? String(purchase.supplier.id)
            : "",

        invoiceNo:
          purchase.invoiceNo ||
          purchase.invoiceNumber ||
          purchase.purchaseNumber ||
          "",

        purchaseDate: purchase.purchaseDate
          ? String(purchase.purchaseDate).split("T")[0]
          : getToday(),

        paidAmount:
          purchase.paidAmount !== undefined && purchase.paidAmount !== null
            ? String(purchase.paidAmount)
            : "",

        paymentMethod:
          purchase.paymentMethod || purchase.payment?.paymentMethod || "",

        transactionId:
          purchase.transactionId || purchase.payment?.transactionId || "",

        referenceNumber:
          purchase.referenceNumber || purchase.payment?.referenceNumber || "",

        description:
          purchase.description || purchase.payment?.description || "",

        remarks:
          purchase.notes || purchase.remarks || purchase.payment?.remarks || "",

        discount: purchase.discount ?? 0,
        tax: purchase.tax ?? 0,
      });

      if (Array.isArray(purchaseItems) && purchaseItems.length > 0) {
        setItems(
          purchaseItems.map((item) => ({
            inventoryItemId: String(
              item.inventoryItemId || item.inventoryItem?.id || item.id || "",
            ),
            quantity: Number(item.quantity || 1),
            rate:
              item.rate !== undefined && item.rate !== null
                ? String(item.rate)
                : "",
          })),
        );
      } else {
        setItems([createEmptyItem()]);
      }
    } else {
      setFormData({
        supplierId: "",
        invoiceNo: "",
        purchaseDate: getToday(),
        paidAmount: "",
        paymentMethod: "",
        transactionId: "",
        referenceNumber: "",
        description: "",
        remarks: "",
        discount: 0,
        tax: 0,
      });

      setItems([createEmptyItem()]);
    }
  }, [isOpen, purchase]);

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;

      return total + quantity * rate;
    }, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    return Math.max(Number(formData.discount) || 0, 0);
  }, [formData.discount]);

  const taxAmount = useMemo(() => {
    return Math.max(Number(formData.tax) || 0, 0);
  }, [formData.tax]);

  const totalAmount = useMemo(() => {
    return Math.max(subtotal - discountAmount + taxAmount, 0);
  }, [subtotal, discountAmount, taxAmount]);

  const paidAmount = useMemo(() => {
    return Math.max(Number(formData.paidAmount) || 0, 0);
  }, [formData.paidAmount]);

  const dueAmount = useMemo(() => {
    return Math.max(totalAmount - paidAmount, 0);
  }, [totalAmount, paidAmount]);

  // =====================================================
  // HELPERS
  // =====================================================

  const getSelectedInventoryItem = (inventoryItemId) => {
    return inventoryItems.find(
      (item) => String(item.id) === String(inventoryItemId),
    );
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // ITEM CHANGE
  // =====================================================

  const handleItemChange = (index, field, value) => {
    setItems((previousItems) =>
      previousItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  // =====================================================
  // ADD ITEM
  // =====================================================

  const handleAddItem = () => {
    setItems((previousItems) => [...previousItems, createEmptyItem()]);
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      toast.error("At least one purchase item is required.");
      return;
    }

    setItems((previousItems) =>
      previousItems.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  // =====================================================
  // VALIDATE
  // =====================================================

  const validateForm = () => {
    if (!formData.supplierId) {
      toast.error("Please select a supplier.");
      return false;
    }

    if (!formData.purchaseDate) {
      toast.error("Please select a purchase date.");
      return false;
    }

    if (!items.length) {
      toast.error("Please add at least one purchase item.");
      return false;
    }

    const selectedItemIds = new Set();

    for (const item of items) {
      if (!item.inventoryItemId) {
        toast.error("Please select an inventory item.");
        return false;
      }

      if (selectedItemIds.has(String(item.inventoryItemId))) {
        toast.error("The same inventory item cannot be added twice.");
        return false;
      }

      selectedItemIds.add(String(item.inventoryItemId));

      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast.error("Quantity must be greater than 0.");
        return false;
      }

      if (!Number.isFinite(rate) || rate < 0) {
        toast.error("Rate cannot be negative.");
        return false;
      }
    }

    if (discountAmount > subtotal) {
      toast.error("Discount cannot be greater than the subtotal.");
      return false;
    }

    if (paidAmount > totalAmount) {
      toast.error("Paid amount cannot be greater than total amount.");
      return false;
    }

    // Payment method is required only when some amount is paid.
    if (paidAmount > 0 && !formData.paymentMethod) {
      toast.error("Please select a payment method.");
      return false;
    }

    return true;
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validateForm()) return;

    // FIX 1: send the actual line items — the backend's createPurchase
    // requires a non-empty `items` array and rejects the request with a
    // 400 without it. This was missing entirely before.
    //
    // FIX 2: use discountAmount / taxAmount (the computed, sanitized
    // useMemo values) — bare `discount` / `tax` don't exist as variables
    // in this component and would throw a ReferenceError at submit time.
    //
    // FIX 3: use formData.remarks (what the Notes textarea actually
    // writes to) instead of the nonexistent formData.notes, which was
    // always undefined.
    //
    // FIX 4: shopId is not sent from the frontend at all — every backend
    // controller derives it from req.user.shopId and would ignore this
    // anyway, so sending a hardcoded value here was misleading and unsafe
    // to leave in.
    const payload = {
      supplierId: Number(formData.supplierId),
      invoiceNo: formData.invoiceNo.trim(),
      purchaseDate: formData.purchaseDate,

      items: items.map((item) => ({
        inventoryItemId: Number(item.inventoryItemId),
        quantity: Number(item.quantity),
        rate: Number(item.rate),
      })),

      discount: discountAmount,
      tax: taxAmount,

      paidAmount,
      paymentMethod: paidAmount > 0 ? formData.paymentMethod : undefined,

      transactionId: formData.transactionId.trim() || undefined,
      referenceNumber: formData.referenceNumber.trim() || undefined,
      description: formData.description.trim() || undefined,
      remarks: formData.remarks.trim() || undefined,
    };

    try {
      await onSubmit(payload);

      toast.success(
        purchase
          ? "Purchase updated successfully!"
          : "Purchase created successfully!",
      );
    } catch (error) {
      console.error("Purchase modal submit error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save purchase.",
      );
    }
  };

  // =====================================================
  // CLOSE
  // =====================================================

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // =====================================================
  // DO NOT RENDER
  // IMPORTANT: ALL HOOKS ARE ABOVE THIS LINE
  // =====================================================

  if (!isOpen) return null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .pm-input { border-color: ${colors.cardBorder}; }
        .pm-input:focus { border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px ${colors.primaryTeal}26; }
        .pm-add-btn:hover { background-color: ${colors.primaryTeal}26; }
        .pm-cancel-btn:hover { background-color: ${colors.cardTint}; }
        .pm-close-btn:hover { background-color: ${colors.cardTint}; color: ${colors.textDark}; }
        .pm-delete-btn:hover { background-color: ${colors.danger}26; }
        .pm-submit-btn { background: linear-gradient(95deg, ${colors.primaryTeal}, ${colors.mint}); transition: filter 0.15s ease; }
        .pm-submit-btn:hover { filter: brightness(1.06); }
        .pm-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: colors.bgLight }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="flex items-center justify-between px-4 py-4 sm:px-7"
          style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="shrink-0 rounded-xl p-3"
              style={{
                backgroundColor: `${colors.primaryTeal}1A`,
                color: colors.primaryTeal,
              }}
            >
              <ShoppingCart size={26} />
            </div>

            <div className="min-w-0">
              <h2
                className="truncate text-lg sm:text-xl"
                style={{
                  color: colors.textDark,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                {purchase ? "Edit Purchase" : "Add Purchase"}
              </h2>

              <p
                className="mt-1 truncate text-sm"
                style={{ color: colors.textMuted }}
              >
                Add supplier and purchase item details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="pm-close-btn shrink-0 rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: colors.textMuted }}
          >
            <X size={22} />
          </button>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-7">
            {/* =============================================
                PURCHASE DETAILS
            ============================================= */}

            <h3
              className="mb-4 text-base sm:text-lg"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Purchase Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* SUPPLIER */}

              <div>
                <label
                  className={labelClass}
                  style={{ color: colors.textDark }}
                >
                  <Building2 size={16} />
                  Supplier *
                </label>

                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleFormChange}
                  disabled={loading}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select Supplier</option>

                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {supplier.phone ? ` - ${supplier.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* PURCHASE NUMBER */}

              <div>
                <label
                  className={labelClass}
                  style={{ color: colors.textDark }}
                >
                  <FileText size={16} />
                  Purchase Number
                </label>

                <input
                  type="text"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleFormChange}
                  disabled={loading}
                  placeholder="Enter invoice number"
                  className={inputClass}
                />
              </div>

              {/* PURCHASE DATE */}

              <div>
                <label
                  className={labelClass}
                  style={{ color: colors.textDark }}
                >
                  <CalendarDays size={16} />
                  Purchase Date *
                </label>

                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleFormChange}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            {/* =============================================
                PAYMENT
            ============================================= */}

            <div className="mt-5">
              <h3
                className="mb-4 text-base sm:text-lg"
                style={{
                  color: colors.textDark,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                Payment Details
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* PAID AMOUNT */}

                <div>
                  <label
                    className={labelClass}
                    style={{ color: colors.textDark }}
                  >
                    <IndianRupee size={16} />
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    step="0.01"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleFormChange}
                    disabled={loading}
                    placeholder="0.00"
                    className={inputClass}
                  />

                  <p
                    className="mt-1 text-xs"
                    style={{ color: colors.textMuted }}
                  >
                    Leave empty or enter 0 for unpaid purchase.
                  </p>
                </div>

                {/* PAYMENT METHOD */}

                <div>
                  <label
                    className={labelClass}
                    style={{ color: colors.textDark }}
                  >
                    <CreditCard size={16} />
                    Payment Method
                    {paidAmount > 0 ? " *" : ""}
                  </label>

                  {/* FIX 5: this <select> was missing its className entirely,
                      so it rendered as an unstyled native dropdown while
                      every other field on this form is styled. */}
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleFormChange}
                    disabled={loading || paidAmount <= 0}
                    className={`${inputClass} bg-white`}
                  >
                    <option value="">
                      {paidAmount > 0
                        ? "Select Payment Method"
                        : "No payment yet"}
                    </option>

                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank_Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {/* DUE AMOUNT */}

                <div>
                  <label
                    className={labelClass}
                    style={{ color: colors.textDark }}
                  >
                    <IndianRupee size={16} />
                    Due Amount
                  </label>

                  <div
                    className="rounded-xl border px-4 py-3 font-semibold"
                    style={{
                      backgroundColor: colors.cardTint,
                      borderColor: colors.cardBorder,
                      color: dueAmount > 0 ? colors.danger : colors.mint,
                    }}
                  >
                    ₹ {dueAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* TRANSACTION DETAILS */}

              {paidAmount > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      style={{ color: colors.textDark }}
                    >
                      Transaction ID
                    </label>

                    <input
                      type="text"
                      name="transactionId"
                      value={formData.transactionId}
                      onChange={handleFormChange}
                      disabled={loading}
                      placeholder="Optional transaction ID"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      style={{ color: colors.textDark }}
                    >
                      Reference Number
                    </label>

                    <input
                      type="text"
                      name="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={handleFormChange}
                      disabled={loading}
                      placeholder="Optional reference number"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* =============================================
                PURCHASE ITEMS
            ============================================= */}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3
                className="text-base sm:text-lg"
                style={{
                  color: colors.textDark,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                Purchase Items
              </h3>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={loading}
                className="pm-add-btn inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: `${colors.primaryTeal}4D`,
                  backgroundColor: colors.cardTint,
                  color: colors.primaryTeal,
                }}
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {items.map((item, index) => {
                const quantity = Number(item.quantity) || 0;
                const rate = Number(item.rate) || 0;
                const amount = quantity * rate;

                const selectedItem = getSelectedInventoryItem(
                  item.inventoryItemId,
                );

                return (
                  <div
                    key={index}
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.cardTint,
                    }}
                  >
                    <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[2.2fr_0.8fr_0.8fr_0.9fr_auto]">
                      {/* INVENTORY ITEM */}

                      <div>
                        <label
                          className={labelClass}
                          style={{ color: colors.textDark }}
                        >
                          <Package size={16} />
                          Inventory Item *
                        </label>

                        <select
                          value={item.inventoryItemId}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "inventoryItemId",
                              e.target.value,
                            )
                          }
                          disabled={loading}
                          className={`${inputClass} bg-white`}
                        >
                          <option value="">Select Inventory Item</option>

                          {inventoryItems.map((inventoryItem) => (
                            <option
                              key={inventoryItem.id}
                              value={inventoryItem.id}
                            >
                              {inventoryItem.name ||
                                inventoryItem.itemName ||
                                inventoryItem.productName}
                            </option>
                          ))}
                        </select>

                        {selectedItem && (
                          <p
                            className="mt-2 text-xs"
                            style={{ color: colors.textMuted }}
                          >
                            Current Stock:{" "}
                            {Number(
                              selectedItem.currentStock ||
                                selectedItem.stock ||
                                0,
                            ).toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* QUANTITY */}

                      <div>
                        <label
                          className="mb-2 block text-sm font-medium"
                          style={{ color: colors.textDark }}
                        >
                          Quantity *
                        </label>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          disabled={loading}
                          className={`${inputClass} bg-white`}
                        />
                      </div>

                      {/* RATE */}

                      <div>
                        <label
                          className="mb-2 block text-sm font-medium"
                          style={{ color: colors.textDark }}
                        >
                          Rate *
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(index, "rate", e.target.value)
                          }
                          disabled={loading}
                          placeholder="0.00"
                          className={`${inputClass} bg-white`}
                        />
                      </div>

                      {/* AMOUNT */}

                      <div>
                        <label
                          className="mb-2 block text-sm font-medium"
                          style={{ color: colors.textDark }}
                        >
                          Amount
                        </label>

                        <div
                          className="rounded-xl border bg-white px-4 py-3 font-semibold"
                          style={{
                            borderColor: colors.cardBorder,
                            color: colors.primaryTeal,
                          }}
                        >
                          ₹ {amount.toFixed(2)}
                        </div>
                      </div>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={loading || items.length === 1}
                        title="Remove Item"
                        className="pm-delete-btn flex h-12 w-12 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          borderColor: `${colors.danger}4D`,
                          backgroundColor: `${colors.danger}1A`,
                          color: colors.danger,
                        }}
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =============================================
                DISCOUNT / TAX
            ============================================= */}

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: colors.textDark }}
                >
                  Discount Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="discount"
                  value={formData.discount}
                  onChange={handleFormChange}
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: colors.textDark }}
                >
                  Tax Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="tax"
                  value={formData.tax}
                  onChange={handleFormChange}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            {/* =============================================
                NOTES
            ============================================= */}

            <div className="mt-6">
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: colors.textDark }}
              >
                Notes
              </label>

              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleFormChange}
                disabled={loading}
                rows={4}
                placeholder="Enter purchase notes..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"
            style={{
              borderTop: `1px solid ${colors.cardBorder}`,
              backgroundColor: colors.bgLight,
            }}
          >
            {/* TOTAL */}

            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Total Purchase Amount
              </p>

              <p
                className="mt-1 text-2xl"
                style={{
                  color: colors.primaryTeal,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                ₹ {totalAmount.toFixed(2)}
              </p>
            </div>

            {/* BUTTONS */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="pm-cancel-btn w-full rounded-xl border px-5 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                style={{
                  borderColor: colors.cardBorder,
                  color: colors.textMuted,
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="pm-submit-btn inline-flex w-full min-w-40 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-md sm:w-auto"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}

                {loading
                  ? "Saving..."
                  : purchase
                    ? "Update Purchase"
                    : "Save Purchase"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseModal;
