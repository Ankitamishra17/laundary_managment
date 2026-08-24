import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Plus,
  RefreshCw,
  Search,
  X,
  Wallet,
  Clock3,
  CheckCircle2,
  Ban,
  IndianRupee,
} from "lucide-react";

import {
  getPayrolls,
  createPayroll,
  cancelPayroll,
} from "../../api/payrollApi";

import { getEmployees } from "../../api/employeeApi";

// =====================================================
// FORMAT CURRENCY
// =====================================================

const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm = {
  employeeId: "",
  startDate: "",
  endDate: "",
  basicSalary: "",
  bonus: "0",
  deduction: "0",
  paymentDate: new Date().toISOString().split("T")[0],
  notes: "",
};

// =====================================================
// COMPONENT
// =====================================================

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState(initialForm);

  // =====================================================
  // FETCH PAYROLLS
  // =====================================================

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPayrolls();

      const data =
        response?.data?.payrolls ||
        response?.data?.data ||
        response?.data ||
        [];

      setPayrolls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payrolls:", err);

      setError(
        err?.response?.data?.message || "Failed to fetch payroll records.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH EMPLOYEES
  // =====================================================

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();

      const data =
        response?.data?.employees ||
        response?.data?.data ||
        response?.data ||
        [];

      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const totalPayroll = payrolls.reduce(
      (sum, item) =>
        sum + Number(item.netSalary || item.totalAmount || item.amount || 0),
      0,
    );

    const paid = payrolls
      .filter((item) => item.status === "PAID")
      .reduce(
        (sum, item) =>
          sum + Number(item.netSalary || item.totalAmount || item.amount || 0),
        0,
      );

    const pending = payrolls
      .filter((item) => item.status === "PENDING")
      .reduce(
        (sum, item) =>
          sum + Number(item.netSalary || item.totalAmount || item.amount || 0),
        0,
      );

    const cancelled = payrolls.filter(
      (item) => item.status === "CANCELLED",
    ).length;

    return {
      total: totalPayroll,
      paid,
      pending,
      cancelled,
      count: payrolls.length,
    };
  }, [payrolls]);

  // =====================================================
  // FILTER PAYROLLS
  // =====================================================

  const filteredPayrolls = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return payrolls;

    return payrolls.filter((payroll) => {
      const employeeName =
        payroll.employee?.name ||
        payroll.employee?.fullName ||
        payroll.Employee?.name ||
        "";

      const status = payroll.status || "";

      return (
        employeeName.toLowerCase().includes(query) ||
        status.toLowerCase().includes(query)
      );
    });
  }, [payrolls, search]);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CALCULATE NET SALARY
  // =====================================================

  const netSalary =
    (Number(form.basicSalary) || 0) +
    (Number(form.bonus) || 0) -
    (Number(form.deduction) || 0);

  // =====================================================
  // CREATE PAYROLL
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!form.employeeId) {
        setError("Please select an employee.");
        return;
      }

      if (!form.startDate) {
        setError("Please select the salary start date.");
        return;
      }

      if (!form.endDate) {
        setError("Please select the salary end date.");
        return;
      }

      if (Number(form.basicSalary) <= 0) {
        setError("Salary amount must be greater than ₹0.");
        return;
      }

      const payload = {
        employeeId: Number(form.employeeId),

        startDate: form.startDate,
        endDate: form.endDate,

        basicSalary: Number(form.basicSalary),
        bonus: Number(form.bonus) || 0,
        deduction: Number(form.deduction) || 0,

        paymentDate: form.paymentDate,

        notes: form.notes,

        status: "PAID",
      };

      await createPayroll(payload);

      setSuccess("Payroll created successfully.");

      setForm(initialForm);
      setShowModal(false);

      await fetchPayrolls();
    } catch (err) {
      console.error("Create payroll error:", err);

      setError(err?.response?.data?.message || "Failed to create payroll.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // CANCEL PAYROLL
  // =====================================================

  const handleCancel = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this payroll?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await cancelPayroll(id);

      setSuccess("Payroll cancelled successfully.");

      await fetchPayrolls();
    } catch (err) {
      console.error("Cancel payroll error:", err);

      setError(err?.response?.data?.message || "Failed to cancel payroll.");
    }
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "PAID":
        return "bg-[#02C39A]/10 text-[#02C39A] border-[#02C39A]/30";

      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";

      default:
        return "bg-[#EEF7F6] text-[#51787C] border-[#D8ECEA]";
    }
  };

  // =====================================================
  // SUMMARY CARDS
  // =====================================================

  const cards = [
    {
      title: "Total Payroll",
      value: formatCurrency(summary.total),
      description: "Total salary records",
      icon: Wallet,
      iconBg: "bg-[#EEF7F6]",
      iconColor: "text-[#028090]",
    },
    {
      title: "Paid",
      value: formatCurrency(summary.paid),
      description: "Salary paid to employees",
      icon: CheckCircle2,
      iconBg: "bg-[#02C39A]/10",
      iconColor: "text-[#02C39A]",
    },
    {
      title: "Pending",
      value: formatCurrency(summary.pending),
      description: "Pending salary amount",
      icon: Clock3,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Cancelled",
      value: summary.cancelled,
      description: "Cancelled payroll records",
      icon: Ban,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <div
      className="min-h-full p-4 sm:p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF7F6] sm:h-12 sm:w-12">
            <BriefcaseBusiness size={22} className="text-[#028090]" />
          </div>

          <div>
            <h1
              className="text-xl font-bold text-[#0F2C2E] sm:text-2xl"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Payroll
            </h1>

            <p className="mt-1 text-sm text-[#51787C]">
              Manage employee salary and payroll records.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={fetchPayrolls}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8ECEA] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F2C2E] transition hover:bg-[#EEF7F6]"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={() => {
              setError("");
              setSuccess("");
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#028090] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3B3E]"
          >
            <Plus size={18} />
            Record Salary
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* ALERTS */}
      {/* ================================================= */}

      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>

          <button onClick={() => setError("")} className="shrink-0">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#02C39A]/30 bg-[#02C39A]/10 px-4 py-3 text-sm text-[#02866A]">
          <span>{success}</span>

          <button onClick={() => setSuccess("")} className="shrink-0">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* SUMMARY CARDS */}
      {/* ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-[#D8ECEA] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon size={21} className={card.iconColor} />
                </div>

                <span className="text-sm font-medium text-[#51787C]">
                  {card.title}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#0F2C2E] sm:text-2xl">
                {card.value}
              </h3>

              <p className="mt-2 text-xs text-[#51787C]">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#D8ECEA] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="text-base font-bold text-[#0F2C2E] sm:text-lg"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Payroll Records
            </h2>

            <p className="mt-1 text-sm text-[#51787C]">
              {summary.count} total payroll records
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#51787C]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] py-2.5 pl-10 pr-4 text-sm text-[#0F2C2E] outline-none transition focus:border-[#028090] focus:bg-white focus:ring-2 focus:ring-[#028090]/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#EEF7F6]">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#51787C]">
                  Employee
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#51787C]">
                  Salary Period
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-[#51787C]">
                  Basic Salary
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-[#51787C]">
                  Net Salary
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#51787C]">
                  Payment Date
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase text-[#51787C]">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-[#51787C]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm text-[#51787C]"
                  >
                    Loading payroll records...
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm text-[#51787C]"
                  >
                    No payroll records found.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => {
                  const employee = payroll.employee || payroll.Employee || {};

                  const employeeName =
                    employee.name || employee.fullName || "Unknown Employee";

                  return (
                    <tr
                      key={payroll.id}
                      className="border-t border-[#D8ECEA] transition hover:bg-[#EEF7F6]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#0F2C2E]">
                          {employeeName}
                        </p>

                        <p className="mt-1 text-xs text-[#51787C]">
                          {employee.employeeId ||
                            employee.phone ||
                            `Employee #${payroll.employeeId}`}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#51787C]">
                        <div>{formatDate(payroll.startDate)}</div>

                        <div className="mt-1 text-xs text-[#51787C]/80">
                          to {formatDate(payroll.endDate)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-[#0F2C2E]">
                        {formatCurrency(payroll.basicSalary)}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-[#0F2C2E]">
                        {formatCurrency(
                          payroll.netSalary ||
                            payroll.totalAmount ||
                            payroll.amount,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#51787C]">
                        {formatDate(payroll.paymentDate)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            payroll.status,
                          )}`}
                        >
                          {payroll.status || "PENDING"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {payroll.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancel(payroll.id)}
                            className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================= */}
      {/* CREATE PAYROLL MODAL */}
      {/* ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#05282A]/60 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#D8ECEA] p-5">
              <div>
                <h2
                  className="text-lg font-bold text-[#0F2C2E] sm:text-xl"
                  style={{ fontFamily: "'Libre Baskerville', serif" }}
                >
                  Record Salary Payment
                </h2>

                <p className="mt-1 text-sm text-[#51787C]">
                  Create employee payroll for any period.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="shrink-0 rounded-lg p-2 text-[#51787C] hover:bg-[#EEF7F6]"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {/* EMPLOYEE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                  Employee *
                </label>

                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#D8ECEA] bg-white px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                >
                  <option value="">Select employee</option>

                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name ||
                        employee.fullName ||
                        `Employee #${employee.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* SALARY PERIOD */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                    Salary Start Date *
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                    Salary End Date *
                  </label>

                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  />
                </div>
              </div>

              {/* SALARY */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                    Basic Salary *
                  </label>

                  <input
                    type="number"
                    name="basicSalary"
                    value={form.basicSalary}
                    onChange={handleChange}
                    min="0"
                    required
                    placeholder="0"
                    className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                    Bonus
                  </label>

                  <input
                    type="number"
                    name="bonus"
                    value={form.bonus}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                    Deduction
                  </label>

                  <input
                    type="number"
                    name="deduction"
                    value={form.deduction}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  />
                </div>
              </div>

              {/* NET SALARY */}

              <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <span className="text-sm font-medium text-[#0F2C2E]">
                    Net Salary
                  </span>

                  <span className="flex items-center text-lg font-bold text-[#028090] sm:text-xl">
                    <IndianRupee size={18} />

                    {netSalary.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* PAYMENT DATE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                  Payment Date
                </label>

                <input
                  type="date"
                  name="paymentDate"
                  value={form.paymentDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                />
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#0F2C2E]">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Optional notes..."
                  className="w-full resize-none rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-[#D8ECEA] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-xl border border-[#D8ECEA] px-5 py-2.5 text-sm font-semibold text-[#0F2C2E] transition hover:bg-[#EEF7F6]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#028090] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B3B3E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
