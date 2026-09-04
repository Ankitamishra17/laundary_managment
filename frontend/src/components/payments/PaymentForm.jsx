import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  WalletCards,
  UserRound,
  IndianRupee,
  Hash,
  FileText,
  CalendarDays,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CreditCard,
} from "lucide-react";

import { getEmployees } from "../../api/employeeApi";
import { getEmployeePayrolls } from "../../api/payrollApi";
import { createEmployeePayment } from "../../api/paymentApi";

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getEmployeeName = (employee) => {
  if (!employee) return "";

  return (
    employee.name ||
    employee.fullName ||
    employee.employeeName ||
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
    employee.user?.name ||
    employee.user?.fullName ||
    employee.email ||
    `Employee #${employee.id}`
  );
};

const getEmployeeEmail = (employee) => {
  if (!employee) return "";

  return employee.email || employee.user?.email || employee.emailAddress || "";
};

const getPayrollLabel = (payroll) => {
  if (!payroll) return "";

  if (payroll.salaryPeriod) {
    return payroll.salaryPeriod;
  }

  if (payroll.period) {
    return payroll.period;
  }

  const start =
    payroll.startDate || payroll.periodStart || payroll.salaryStartDate;

  const end = payroll.endDate || payroll.periodEnd || payroll.salaryEndDate;

  if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  if (start) {
    return formatDate(start);
  }

  if (payroll.month && payroll.year) {
    return `${payroll.month} ${payroll.year}`;
  }

  return `Payroll #${payroll.id}`;
};

// =====================================================
// COMPONENT
// =====================================================

const PaymentForm = ({ isOpen, onClose, onSuccess }) => {
  // ===================================================
  // STATE
  // ===================================================

  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    payrollId: "",
    amount: "",
    paymentMethod: "Cash",
    paymentDate: getToday(),
    transactionId: "",
    referenceNumber: "",
    description: "",
    remarks: "",
  });

  const [errors, setErrors] = useState({});

  // ===================================================
  // RESET FORM
  // ===================================================

  const resetForm = () => {
    setForm({
      employeeId: "",
      payrollId: "",
      amount: "",
      paymentMethod: "Cash",
      paymentDate: getToday(),
      transactionId: "",
      referenceNumber: "",
      description: "",
      remarks: "",
    });

    setPayrolls([]);
    setErrors({});
    setError("");
    setSuccessMessage("");
  };

  // ===================================================
  // LOAD EMPLOYEES
  // ===================================================

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError("");

      const response = await getEmployees();

      console.log("Employees response:", response);

      let employeeData = [];

      if (Array.isArray(response)) {
        employeeData = response;
      } else if (Array.isArray(response?.data)) {
        employeeData = response.data;
      } else if (Array.isArray(response?.employees)) {
        employeeData = response.employees;
      } else if (Array.isArray(response?.data?.employees)) {
        employeeData = response.data.employees;
      }

      setEmployees(employeeData);
    } catch (err) {
      console.error("Load employees error:", err);

      setEmployees([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load employees.",
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ===================================================
  // OPEN FORM
  // ===================================================

  useEffect(() => {
    if (!isOpen) return;

    resetForm();
    loadEmployees();
  }, [isOpen]);

  // ===================================================
  // SELECTED EMPLOYEE
  // ===================================================

  const selectedEmployee = useMemo(() => {
    return employees.find(
      (employee) => String(employee.id) === String(form.employeeId),
    );
  }, [employees, form.employeeId]);

  // ===================================================
  // SELECTED PAYROLL
  // ===================================================

  const selectedPayroll = useMemo(() => {
    return payrolls.find(
      (payroll) => String(payroll.id) === String(form.payrollId),
    );
  }, [payrolls, form.payrollId]);

  // ===================================================
  // LOAD PAYROLLS
  // ===================================================

  const loadEmployeePayrolls = async (employeeId) => {
    try {
      setLoadingPayrolls(true);
      setError("");

      setPayrolls([]);

      console.log("Fetching payrolls for employee:", employeeId);

      const response = await getEmployeePayrolls(employeeId);

      console.log("Employee payroll response:", response);

      let payrollData = [];

      if (Array.isArray(response)) {
        payrollData = response;
      } else if (Array.isArray(response?.data)) {
        payrollData = response.data;
      } else if (Array.isArray(response?.payrolls)) {
        payrollData = response.payrolls;
      } else if (Array.isArray(response?.data?.payrolls)) {
        payrollData = response.data.payrolls;
      }

      const unpaidPayrolls = payrollData.filter((payroll) => {
        const status = String(payroll.status || "").toUpperCase();

        const dueAmount = Number(payroll.dueAmount || 0);

        return status !== "PAID" && status !== "CANCELLED" && dueAmount > 0;
      });

      setPayrolls(unpaidPayrolls);

      if (unpaidPayrolls.length === 0) {
        setErrors((prev) => ({
          ...prev,
          payrollId: "No unpaid payroll found for this employee.",
        }));
      }
    } catch (err) {
      console.error("Load employee payrolls error:", err);

      setPayrolls([]);

      setErrors((prev) => ({
        ...prev,
        payrollId:
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load employee payrolls.",
      }));
    } finally {
      setLoadingPayrolls(false);
    }
  };

  // ===================================================
  // EMPLOYEE CHANGE
  // ===================================================

  const handleEmployeeChange = async (e) => {
    const employeeId = e.target.value;

    setForm((prev) => ({
      ...prev,
      employeeId,
      payrollId: "",
      amount: "",
    }));

    setPayrolls([]);

    setErrors({});

    setError("");
    setSuccessMessage("");

    if (!employeeId) {
      return;
    }

    await loadEmployeePayrolls(employeeId);
  };

  // ===================================================
  // PAYROLL CHANGE
  // ===================================================

  const handlePayrollChange = (e) => {
    const payrollId = e.target.value;

    const payroll = payrolls.find(
      (item) => String(item.id) === String(payrollId),
    );

    const dueAmount = payroll ? Number(payroll.dueAmount || 0) : "";

    setForm((prev) => ({
      ...prev,
      payrollId,
      amount: dueAmount,
    }));

    setErrors((prev) => ({
      ...prev,
      payrollId: "",
      amount: "",
    }));

    setError("");
  };

  // ===================================================
  // NORMAL CHANGE
  // ===================================================

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

    setError("");
  };

  // ===================================================
  // VALIDATE
  // ===================================================

  const validate = () => {
    const newErrors = {};

    if (!form.employeeId) {
      newErrors.employeeId = "Employee is required.";
    }

    if (!form.payrollId) {
      newErrors.payrollId = "Payroll is required.";
    }

    const amount = Number(form.amount);

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      newErrors.amount = "Enter a valid payment amount.";
    }

    if (selectedPayroll) {
      const dueAmount = Number(selectedPayroll.dueAmount || 0);

      if (dueAmount <= 0) {
        newErrors.amount = "This payroll has no amount due.";
      } else if (amount > dueAmount) {
        newErrors.amount = `Payment cannot exceed due amount ${formatCurrency(
          dueAmount,
        )}.`;
      }
    }

    if (!form.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required.";
    }

    if (!form.paymentDate) {
      newErrors.paymentDate = "Payment date is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("========== SALARY PAYMENT SUBMIT ==========");

    setError("");
    setSuccessMessage("");

    if (!validate()) {
      console.log("Validation failed.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employeeId: Number(form.employeeId),
        payrollId: Number(form.payrollId),
        amount: Number(Number(form.amount).toFixed(2)),
        paymentMethod: form.paymentMethod,
        paymentDate: form.paymentDate,

        transactionId: form.transactionId?.trim() || null,

        referenceNumber: form.referenceNumber?.trim() || null,

        description: form.description?.trim() || null,

        remarks: form.remarks?.trim() || null,
      };

      console.log("Salary payment payload:", payload);

      const response = await createEmployeePayment(payload);

      console.log("Salary payment response:", response);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to save salary payment.");
      }

      setSuccessMessage(
        response.message || "Salary payment recorded successfully.",
      );

      // Important:
      // Parent refreshes the salary-payment table.
      if (onSuccess) {
        await onSuccess(response);
      }

      // Close + reset
      resetForm();

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Create salary payment error:", err);

      console.error("Server response:", err?.response?.data);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to save salary payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================
  // CLOSE
  // ===================================================

  const handleClose = () => {
    if (submitting) return;

    resetForm();

    if (onClose) {
      onClose();
    }
  };

  // ===================================================
  // DON'T RENDER
  // ===================================================

  if (!isOpen) {
    return null;
  }

  // ===================================================
  // JSX
  // ===================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-7 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <WalletCards size={25} className="text-purple-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Record Salary Payment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Record an employee payroll payment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={23} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-8 px-7 py-6">
            {/* ERROR */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />

                <div>
                  <p className="font-semibold">Something went wrong</p>

                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {successMessage && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-green-700">
                <CheckCircle2 size={20} />

                <p className="font-medium">{successMessage}</p>
              </div>
            )}

            {/* EMPLOYEE & PAYROLL */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <UserRound size={21} className="text-purple-600" />

                <h3 className="text-lg font-bold text-gray-900">
                  Employee & Payroll
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* EMPLOYEE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Employee <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={form.employeeId}
                    onChange={handleEmployeeChange}
                    disabled={loadingEmployees || submitting}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${
                      errors.employeeId ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <option value="">
                      {loadingEmployees
                        ? "Loading employees..."
                        : "Select employee"}
                    </option>

                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {getEmployeeName(employee)}
                      </option>
                    ))}
                  </select>

                  {errors.employeeId && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.employeeId}
                    </p>
                  )}
                </div>

                {/* PAYROLL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Payroll <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={form.payrollId}
                    onChange={handlePayrollChange}
                    disabled={!form.employeeId || loadingPayrolls || submitting}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${
                      errors.payrollId ? "border-red-400" : "border-gray-300"
                    }`}
                  >
                    <option value="">
                      {!form.employeeId
                        ? "Select employee first"
                        : loadingPayrolls
                          ? "Loading payroll..."
                          : payrolls.length === 0
                            ? "No unpaid payroll found"
                            : "Select payroll"}
                    </option>

                    {payrolls.map((payroll) => (
                      <option key={payroll.id} value={payroll.id}>
                        {getPayrollLabel(payroll)} — Due{" "}
                        {formatCurrency(payroll.dueAmount)}
                      </option>
                    ))}
                  </select>

                  {errors.payrollId && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.payrollId}
                    </p>
                  )}
                </div>
              </div>

              {/* EMPLOYEE INFO */}
              {selectedEmployee && (
                <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                    Employee
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {getEmployeeName(selectedEmployee)}
                  </p>

                  {getEmployeeEmail(selectedEmployee) && (
                    <p className="mt-1 text-sm text-gray-500">
                      {getEmployeeEmail(selectedEmployee)}
                    </p>
                  )}
                </div>
              )}

              {/* PAYROLL INFO */}
              {selectedPayroll && (
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Salary Period</p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {getPayrollLabel(selectedPayroll)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Net Salary</p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {formatCurrency(selectedPayroll.netSalary)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Remaining Due</p>

                    <p className="mt-1 font-bold text-orange-600">
                      {formatCurrency(selectedPayroll.dueAmount)}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* PAYMENT DETAILS */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <IndianRupee size={21} className="text-purple-600" />

                <h3 className="text-lg font-bold text-gray-900">
                  Payment Details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* AMOUNT */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Amount <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={handleChange}
                      disabled={!selectedPayroll || submitting}
                      placeholder="0.00"
                      className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${
                        errors.amount ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>

                  {selectedPayroll && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Maximum payment:{" "}
                      <span className="font-semibold">
                        {formatCurrency(selectedPayroll.dueAmount)}
                      </span>
                    </p>
                  )}

                  {errors.amount && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* PAYMENT METHOD */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Payment Method <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <CreditCard
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleChange}
                      disabled={submitting}
                      className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${
                        errors.paymentMethod
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank_Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  {errors.paymentMethod && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* DATE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Payment Date <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="date"
                      name="paymentDate"
                      value={form.paymentDate}
                      onChange={handleChange}
                      disabled={submitting}
                      className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${
                        errors.paymentDate
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                    />
                  </div>

                  {errors.paymentDate && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.paymentDate}
                    </p>
                  )}
                </div>

                {/* STATUS */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 size={18} className="text-green-600" />
                    </div>

                    <div>
                      <p className="font-semibold text-green-700">Paid</p>

                      <p className="text-xs text-green-600">
                        New payments are recorded as paid.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TRANSACTION */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <Hash size={21} className="text-purple-600" />

                <h3 className="text-lg font-bold text-gray-900">
                  Transaction Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Transaction ID
                  </label>

                  <input
                    type="text"
                    name="transactionId"
                    value={form.transactionId}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="e.g. UPI transaction ID"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />

                  <p className="mt-1.5 text-xs text-gray-500">Optional</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    name="referenceNumber"
                    value={form.referenceNumber}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="Cheque / bank reference"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />

                  <p className="mt-1.5 text-xs text-gray-500">Optional</p>
                </div>
              </div>
            </section>

            {/* DESCRIPTION */}
            <section>
              <div className="mb-5 flex items-center gap-3">
                <FileText size={21} className="text-purple-600" />

                <h3 className="text-lg font-bold text-gray-900">
                  Additional Information
                </h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    disabled={submitting}
                    rows={3}
                    placeholder="Payment description..."
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Remarks
                  </label>

                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    disabled={submitting}
                    rows={3}
                    placeholder="Additional remarks..."
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>
            </section>

            {/* SUMMARY */}
            {selectedPayroll && (
              <section className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <WalletCards size={19} className="text-purple-600" />

                  <h3 className="font-bold text-gray-900">Payment Summary</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Payroll Net Salary</p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {formatCurrency(selectedPayroll.netSalary)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Current Due</p>

                    <p className="mt-1 text-lg font-bold text-orange-600">
                      {formatCurrency(selectedPayroll.dueAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">This Payment</p>

                    <p className="mt-1 text-lg font-bold text-purple-600">
                      {formatCurrency(form.amount)}
                    </p>
                  </div>
                </div>

                {Number(form.amount) > 0 && (
                  <div className="mt-5 border-t border-purple-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Remaining after payment
                      </span>

                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(
                          Math.max(
                            Number(selectedPayroll.dueAmount || 0) -
                              Number(form.amount || 0),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-white px-7 py-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingEmployees ||
                loadingPayrolls ||
                !form.employeeId ||
                !form.payrollId ||
                !form.amount
              }
              className="flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Record Salary Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
