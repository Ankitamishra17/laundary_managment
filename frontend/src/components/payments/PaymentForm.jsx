import React, { useEffect, useState } from "react";
import {
  X,
  CreditCard,
  User,
  Building2,
  Briefcase,
  IndianRupee,
  CalendarDays,
  Hash,
  FileText,
  Save,
  Loader2,
} from "lucide-react";

const initialForm = {
  paymentType: "CUSTOMER",
  customerId: "",
  supplierId: "",
  employeeId: "",
  orderId: "",
  purchaseId: "",
  payrollId: "",
  amount: "",
  paymentMethod: "Cash",
  status: "Paid",
  transactionId: "",
  referenceNumber: "",
  paymentDate: "",
  description: "",
  remarks: "",
};

const PaymentForm = ({
  onSubmit,
  onClose,
  customers = [],
  suppliers = [],
  employees = [],
  loading = false,
  initialData = null,
}) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // =====================================================
  // INITIAL DATA
  // =====================================================

  useEffect(() => {
    if (initialData) {
      setForm({
        paymentType: initialData.paymentType || "CUSTOMER",
        customerId: initialData.customerId || "",
        supplierId: initialData.supplierId || "",
        employeeId: initialData.employeeId || "",
        orderId: initialData.orderId || "",
        purchaseId: initialData.purchaseId || "",
        payrollId: initialData.payrollId || "",
        amount: initialData.amount || "",
        paymentMethod: initialData.paymentMethod || "Cash",
        status: initialData.status || "Paid",
        transactionId: initialData.transactionId || "",
        referenceNumber: initialData.referenceNumber || "",
        paymentDate: initialData.paymentDate
          ? new Date(initialData.paymentDate).toISOString().slice(0, 16)
          : getCurrentDateTime(),
        description: initialData.description || "",
        remarks: initialData.remarks || "",
      });
    } else {
      setForm({
        ...initialForm,
        paymentDate: getCurrentDateTime(),
      });
    }
  }, [initialData]);

  // =====================================================
  // CURRENT DATE/TIME
  // =====================================================

  function getCurrentDateTime() {
    const now = new Date();

    const offset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =====================================================
  // PAYMENT TYPE CHANGE
  // =====================================================

  const handlePaymentTypeChange = (e) => {
    const paymentType = e.target.value;

    setForm((prev) => ({
      ...prev,
      paymentType,

      customerId: "",
      supplierId: "",
      employeeId: "",

      orderId: "",
      purchaseId: "",
      payrollId: "",

      transactionId: "",
      referenceNumber: "",
    }));

    setErrors({});
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validate = () => {
    const newErrors = {};

    if (!form.paymentType) {
      newErrors.paymentType = "Payment type is required.";
    }

    if (!form.amount) {
      newErrors.amount = "Amount is required.";
    } else if (Number(form.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0.";
    }

    if (!form.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required.";
    }

    if (!form.paymentDate) {
      newErrors.paymentDate = "Payment date is required.";
    }

    if (form.paymentType === "CUSTOMER" && !form.customerId) {
      newErrors.customerId = "Please select a customer.";
    }

    if (form.paymentType === "SUPPLIER" && !form.supplierId) {
      newErrors.supplierId = "Please select a supplier.";
    }

    if (form.paymentType === "SALARY" && !form.employeeId) {
      newErrors.employeeId = "Please select an employee.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      ...form,

      customerId: form.customerId || null,

      supplierId: form.supplierId || null,

      employeeId: form.employeeId || null,

      orderId: form.orderId || null,

      purchaseId: form.purchaseId || null,

      payrollId: form.payrollId || null,

      amount: Number(form.amount),

      transactionId: form.transactionId || null,

      referenceNumber: form.referenceNumber || null,

      description: form.description || null,

      remarks: form.remarks || null,
    };

    await onSubmit(payload);
  };

  // =====================================================
  // PAYMENT TYPE INFORMATION
  // =====================================================

  const getTypeInfo = () => {
    switch (form.paymentType) {
      case "CUSTOMER":
        return {
          icon: User,
          title: "Customer Payment",
          description: "Record payment received from a customer.",
        };

      case "SUPPLIER":
        return {
          icon: Building2,
          title: "Supplier Payment",
          description: "Record payment made to a supplier.",
        };

      case "SALARY":
        return {
          icon: Briefcase,
          title: "Salary Payment",
          description: "Record salary payment to an employee.",
        };

      default:
        return {
          icon: CreditCard,
          title: "Payment",
          description: "Record a payment transaction.",
        };
    }
  };

  const typeInfo = getTypeInfo();
  const TypeIcon = typeInfo.icon;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TypeIcon size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {initialData ? "Edit Payment" : "Record Payment"}
              </h2>

              <p className="text-xs text-gray-500">{typeInfo.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-6">
            {/* =================================================
                PAYMENT TYPE
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment Type
                <span className="ml-1 text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <PaymentTypeButton
                  value="CUSTOMER"
                  selected={form.paymentType === "CUSTOMER"}
                  icon={<User size={18} />}
                  title="Customer"
                  onClick={() =>
                    handlePaymentTypeChange({
                      target: {
                        value: "CUSTOMER",
                      },
                    })
                  }
                />

                <PaymentTypeButton
                  value="SUPPLIER"
                  selected={form.paymentType === "SUPPLIER"}
                  icon={<Building2 size={18} />}
                  title="Supplier"
                  onClick={() =>
                    handlePaymentTypeChange({
                      target: {
                        value: "SUPPLIER",
                      },
                    })
                  }
                />

                <PaymentTypeButton
                  value="SALARY"
                  selected={form.paymentType === "SALARY"}
                  icon={<Briefcase size={18} />}
                  title="Salary"
                  onClick={() =>
                    handlePaymentTypeChange({
                      target: {
                        value: "SALARY",
                      },
                    })
                  }
                />
              </div>

              {errors.paymentType && (
                <ErrorMessage message={errors.paymentType} />
              )}
            </div>

            {/* =================================================
                PARTY INFORMATION
            ================================================= */}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <TypeIcon size={17} className="text-indigo-600" />

                <h3 className="text-sm font-semibold text-gray-900">
                  {form.paymentType === "CUSTOMER" && "Customer Information"}

                  {form.paymentType === "SUPPLIER" && "Supplier Information"}

                  {form.paymentType === "SALARY" && "Employee Information"}
                </h3>
              </div>

              {/* CUSTOMER */}

              {form.paymentType === "CUSTOMER" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Customer"
                    name="customerId"
                    value={form.customerId}
                    onChange={handleChange}
                    options={customers}
                    placeholder="Select customer"
                    required
                    error={errors.customerId}
                  />

                  <InputField
                    label="Order ID"
                    name="orderId"
                    value={form.orderId}
                    onChange={handleChange}
                    placeholder="Enter order ID"
                  />
                </div>
              )}

              {/* SUPPLIER */}

              {form.paymentType === "SUPPLIER" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Supplier"
                    name="supplierId"
                    value={form.supplierId}
                    onChange={handleChange}
                    options={suppliers}
                    placeholder="Select supplier"
                    required
                    error={errors.supplierId}
                  />

                  <InputField
                    label="Purchase ID"
                    name="purchaseId"
                    value={form.purchaseId}
                    onChange={handleChange}
                    placeholder="Enter purchase ID"
                  />
                </div>
              )}

              {/* SALARY */}

              {form.paymentType === "SALARY" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Employee"
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    options={employees}
                    placeholder="Select employee"
                    required
                    error={errors.employeeId}
                  />

                  <InputField
                    label="Payroll ID"
                    name="payrollId"
                    value={form.payrollId}
                    onChange={handleChange}
                    placeholder="Enter payroll ID"
                  />
                </div>
              )}
            </div>

            {/* =================================================
                PAYMENT DETAILS
            ================================================= */}

            <div>
              <SectionTitle
                icon={<CreditCard size={17} />}
                title="Payment Details"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* AMOUNT */}

                <InputField
                  label="Amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  icon={<IndianRupee size={16} />}
                  required
                  min="0"
                  step="0.01"
                  error={errors.amount}
                />

                {/* METHOD */}

                <SelectField
                  label="Payment Method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  options={[
                    {
                      id: "Cash",
                      name: "Cash",
                    },
                    {
                      id: "UPI",
                      name: "UPI",
                    },
                    {
                      id: "Card",
                      name: "Card",
                    },
                    {
                      id: "Bank_Transfer",
                      name: "Bank Transfer",
                    },
                    {
                      id: "Cheque",
                      name: "Cheque",
                    },
                  ]}
                  placeholder="Select payment method"
                  required
                  error={errors.paymentMethod}
                />

                {/* PAYMENT DATE */}

                <InputField
                  label="Payment Date & Time"
                  name="paymentDate"
                  type="datetime-local"
                  value={form.paymentDate}
                  onChange={handleChange}
                  icon={<CalendarDays size={16} />}
                  required
                  error={errors.paymentDate}
                />

                {/* STATUS */}

                <SelectField
                  label="Payment Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={[
                    {
                      id: "Paid",
                      name: "Paid",
                    },
                    {
                      id: "Pending",
                      name: "Pending",
                    },
                    {
                      id: "Failed",
                      name: "Failed",
                    },
                    {
                      id: "Cancelled",
                      name: "Cancelled",
                    },
                    {
                      id: "Refunded",
                      name: "Refunded",
                    },
                  ]}
                />

                {/* TRANSACTION ID */}

                <InputField
                  label="Transaction ID"
                  name="transactionId"
                  value={form.transactionId}
                  onChange={handleChange}
                  placeholder="UPI / bank transaction ID"
                  icon={<Hash size={16} />}
                />

                {/* REFERENCE NUMBER */}

                <InputField
                  label="Reference Number"
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleChange}
                  placeholder="Enter reference number"
                  icon={<Hash size={16} />}
                />
              </div>
            </div>

            {/* =================================================
                NOTES
            ================================================= */}

            <div>
              <SectionTitle
                icon={<FileText size={17} />}
                title="Additional Information"
              />

              <div className="space-y-4">
                <TextareaField
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter payment description..."
                />

                <TextareaField
                  label="Remarks"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Add any additional remarks..."
                />
              </div>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />

                  {initialData ? "Update Payment" : "Record Payment"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// PAYMENT TYPE BUTTON
// =====================================================

const PaymentTypeButton = ({ selected, icon, title, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
        selected
          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          selected
            ? "bg-indigo-100 text-indigo-600"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </span>

      <span className="text-sm font-medium">{title}</span>
    </button>
  );
};

// =====================================================
// SECTION TITLE
// =====================================================

const SectionTitle = ({ icon, title }) => {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
      <span className="text-indigo-600">{icon}</span>

      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
};

// =====================================================
// INPUT FIELD
// =====================================================

const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  required = false,
  error,
  min,
  step,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          step={step}
          className={`h-10 w-full rounded-lg border bg-white text-sm outline-none transition ${
            icon ? "pl-9" : "px-3"
          } ${
            error
              ? "border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          }`}
        />
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
};

// =====================================================
// SELECT FIELD
// =====================================================

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  error,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition ${
          error
            ? "border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        }`}
      >
        <option value="">{placeholder || "Select"}</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      {error && <ErrorMessage message={error} />}
    </div>
  );
};

// =====================================================
// TEXTAREA
// =====================================================

const TextareaField = ({ label, name, value, onChange, placeholder }) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
};

// =====================================================
// ERROR
// =====================================================

const ErrorMessage = ({ message }) => {
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
};

export default PaymentForm;
