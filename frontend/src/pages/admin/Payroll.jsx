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

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

// =====================================================
// CALCULATE NUMBER OF DAYS
//
// Example:
// 01 Aug -> 15 Aug = 15 days
// 01 Aug -> 30 Aug = 30 days
// =====================================================

const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const difference =
    Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
};

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm = {
  employeeId: "",
  startDate: "",
  endDate: "",
  bonus: "0",
  deduction: "0",
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

      /*
       * Your API helper already returns response.data.
       *
       * Backend response:
       * {
       *   success: true,
       *   data: payrolls
       * }
       */

      const data = response?.data || [];

      setPayrolls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payrolls:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch payroll records.",
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

    console.log("=================================");
    console.log("EMPLOYEE API RESPONSE:", response);
    console.log("RESPONSE.DATA:", response?.data);
    console.log("RESPONSE.DATA.DATA:", response?.data?.data);
    console.log("RESPONSE.DATA.EMPLOYEES:", response?.data?.employees);
    console.log("=================================");

    let data = [];

    // Case 1:
    // { employees: [...] }
    if (Array.isArray(response?.employees)) {
      data = response.employees;
    }

    // Case 2:
    // { data: [...] }
    else if (Array.isArray(response?.data)) {
      data = response.data;
    }

    // Case 3:
    // { data: { employees: [...] } }
    else if (Array.isArray(response?.data?.employees)) {
      data = response.data.employees;
    }

    // Case 4:
    // { data: { data: [...] } }
    else if (Array.isArray(response?.data?.data)) {
      data = response.data.data;
    }

    // Case 5:
    // direct [...]
    else if (Array.isArray(response)) {
      data = response;
    }

    console.log("FINAL EMPLOYEES ARRAY:", data);
    console.log("EMPLOYEE COUNT:", data.length);

    setEmployees(data);
  } catch (err) {
    console.error("FAILED TO FETCH EMPLOYEES:", err);
    console.error("ERROR RESPONSE:", err?.response?.data);

    setEmployees([]);
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
  // SELECTED EMPLOYEE
  // =====================================================

  const selectedEmployee = useMemo(() => {
    return employees.find(
      (employee) => Number(employee.id) === Number(form.employeeId),
    );
  }, [employees, form.employeeId]);

  // =====================================================
  // SALARY CALCULATIONS
  // =====================================================

  const monthlySalary = Number(selectedEmployee?.monthlySalary) || 0;

  const paidDays = calculateDays(form.startDate, form.endDate);

  /*
   * Payroll uses 30 days for monthly salary
   * calculation.
   *
   * Example:
   * Monthly salary = ₹15,000
   * 15 days = ₹7,500
   */

  const totalDays = 30;

  const perDaySalary = monthlySalary / totalDays;

  const earnedSalary = perDaySalary * paidDays;

  const bonus = Number(form.bonus) || 0;

  const deduction = Number(form.deduction) || 0;

  const netSalary = Math.max(earnedSalary + bonus - deduction, 0);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const totalPayroll = payrolls.reduce(
      (sum, item) => sum + Number(item.netSalary || 0),
      0,
    );

    const paid = payrolls
      .filter((item) => String(item.status).toUpperCase() === "PAID")
      .reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);

    const pending = payrolls
      .filter((item) => String(item.status).toUpperCase() === "PENDING")
      .reduce((sum, item) => sum + Number(item.dueAmount || 0), 0);

    const partial = payrolls
      .filter((item) => String(item.status).toUpperCase() === "PARTIAL")
      .reduce((sum, item) => sum + Number(item.dueAmount || 0), 0);

    const cancelled = payrolls.filter(
      (item) => String(item.status).toUpperCase() === "CANCELLED",
    ).length;

    return {
      total: totalPayroll,
      paid,
      pending,
      partial,
      cancelled,
      count: payrolls.length,
    };
  }, [payrolls]);

  // =====================================================
  // FILTER PAYROLLS
  // =====================================================

  const filteredPayrolls = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return payrolls;
    }

    return payrolls.filter((payroll) => {
      const employee = payroll.employee || payroll.Employee || {};

      const employeeName = employee.name || employee.fullName || "";

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

    setError("");
  };

  // =====================================================
  // CREATE PAYROLL
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      // -----------------------------------------------
      // EMPLOYEE VALIDATION
      // -----------------------------------------------

      if (!form.employeeId) {
        setError("Please select an employee.");
        return;
      }

      // -----------------------------------------------
      // SALARY VALIDATION
      // -----------------------------------------------

      if (monthlySalary <= 0) {
        setError("Employee monthly salary is not set.");
        return;
      }

      // -----------------------------------------------
      // DATE VALIDATION
      // -----------------------------------------------

      if (!form.startDate) {
        setError("Please select the salary start date.");
        return;
      }

      if (!form.endDate) {
        setError("Please select the salary end date.");
        return;
      }

      const calculatedPaidDays = calculateDays(form.startDate, form.endDate);

      if (calculatedPaidDays <= 0) {
        setError("End date must be after or equal to start date.");
        return;
      }

      if (calculatedPaidDays > 30) {
        setError("Salary period cannot be greater than 30 days.");
        return;
      }

      // -----------------------------------------------
      // GET MONTH AND YEAR FROM START DATE
      //
      // Backend still has month/year as required
      // fields, so we send them automatically.
      // -----------------------------------------------

      const startDateObject = new Date(`${form.startDate}T00:00:00`);

      const month = startDateObject.getMonth() + 1;

      const year = startDateObject.getFullYear();

      // -----------------------------------------------
      // PAYLOAD
      // -----------------------------------------------

      const payload = {
        employeeId: Number(form.employeeId),

        month,
        year,

        totalDays: 30,

        paidDays: calculatedPaidDays,

        allowances: 0,

        overtimeAmount: 0,

        bonus: Number(form.bonus) || 0,

        deductions: Number(form.deduction) || 0,

        advanceDeduction: 0,

        otherDeductions: 0,

        startDate: form.startDate,

        endDate: form.endDate,

        notes: form.notes?.trim() || null,
      };

      console.log("Creating payroll:", payload);

      await createPayroll(payload);

      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      setSuccess("Payroll created successfully.");

      setForm(initialForm);

      setShowModal(false);

      await fetchPayrolls();
    } catch (err) {
      console.error("Create payroll error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create payroll.",
      );
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

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await cancelPayroll(id);

      setSuccess("Payroll cancelled successfully.");

      await fetchPayrolls();
    } catch (err) {
      console.error("Cancel payroll error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to cancel payroll.",
      );
    }
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "PAID":
        return "bg-[#02C39A]/10 text-[#02C39A] border-[#02C39A]/30";

      case "PARTIAL":
        return "bg-blue-50 text-blue-700 border-blue-200";

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
      description: "Total payroll amount",
      icon: Wallet,
      iconBg: "bg-[#EEF7F6]",
      iconColor: "text-[#028090]",
    },
    {
      title: "Paid",
      value: formatCurrency(summary.paid),
      description: "Amount already paid",
      icon: CheckCircle2,
      iconBg: "bg-[#02C39A]/10",
      iconColor: "text-[#02C39A]",
    },
    {
      title: "Pending",
      value: formatCurrency(summary.pending),
      description: "Amount waiting for payment",
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

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="min-h-full p-4 sm:p-6"
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
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
              style={{
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Payroll
            </h1>

            <p className="mt-1 text-sm text-[#51787C]">
              Calculate and manage employee salary records.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={fetchPayrolls}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8ECEA] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F2C2E] transition hover:bg-[#EEF7F6]"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setForm(initialForm);
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#028090] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3B3E]"
          >
            <Plus size={18} />
            Create Payroll
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* ALERTS */}
      {/* ================================================= */}

      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#02C39A]/30 bg-[#02C39A]/10 px-4 py-3 text-sm text-[#02866A]">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="shrink-0"
          >
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
      {/* PAYROLL TABLE */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-[#D8ECEA] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#D8ECEA] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="text-base font-bold text-[#0F2C2E] sm:text-lg"
              style={{
                fontFamily: "'Libre Baskerville', serif",
              }}
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
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[#EEF7F6]">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#51787C]">
                  Employee
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#51787C]">
                  Salary Period
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase text-[#51787C]">
                  Paid Days
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-[#51787C]">
                  Monthly Salary
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-[#51787C]">
                  Earned Salary
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-[#51787C]">
                  Net Salary
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-[#51787C]">
                  Due
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
                    colSpan="9"
                    className="px-5 py-12 text-center text-sm text-[#51787C]"
                  >
                    Loading payroll records...
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
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
                      {/* EMPLOYEE */}

                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#0F2C2E]">
                          {employeeName}
                        </p>

                        <p className="mt-1 text-xs text-[#51787C]">
                          {employee.email || `Employee #${payroll.employeeId}`}
                        </p>
                      </td>

                      {/* SALARY PERIOD */}

                      <td className="px-5 py-4 text-sm text-[#51787C]">
                        <div>{formatDate(payroll.startDate)}</div>

                        <div className="mt-1 text-xs text-[#51787C]/80">
                          to {formatDate(payroll.endDate)}
                        </div>
                      </td>

                      {/* PAID DAYS */}

                      <td className="px-5 py-4 text-center">
                        <span className="font-semibold text-[#0F2C2E]">
                          {payroll.paidDays}
                        </span>

                        <span className="text-xs text-[#51787C]">
                          {" "}
                          / {payroll.totalDays}
                        </span>
                      </td>

                      {/* MONTHLY SALARY */}

                      <td className="px-5 py-4 text-right text-sm font-medium text-[#0F2C2E]">
                        {formatCurrency(payroll.basicSalary)}
                      </td>

                      {/* EARNED SALARY */}

                      <td className="px-5 py-4 text-right text-sm font-semibold text-[#028090]">
                        {formatCurrency(payroll.earnedSalary)}
                      </td>

                      {/* NET SALARY */}

                      <td className="px-5 py-4 text-right font-bold text-[#0F2C2E]">
                        {formatCurrency(payroll.netSalary)}
                      </td>

                      {/* DUE */}

                      <td className="px-5 py-4 text-right font-semibold text-amber-700">
                        {formatCurrency(payroll.dueAmount)}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            payroll.status,
                          )}`}
                        >
                          {String(payroll.status || "PENDING").toUpperCase()}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">
                        {String(payroll.status).toUpperCase() !== "CANCELLED" &&
                          String(payroll.status).toUpperCase() !== "PAID" && (
                            <button
                              type="button"
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
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                  }}
                >
                  Create Payroll
                </h2>

                <p className="mt-1 text-sm text-[#51787C]">
                  Create salary for a selected period.
                </p>
              </div>

              <button
                type="button"
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

              {/* EMPLOYEE SALARY */}

              {selectedEmployee && (
                <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#51787C]">
                        Monthly Salary
                      </p>

                      <p className="mt-1 text-lg font-bold text-[#0F2C2E]">
                        {formatCurrency(monthlySalary)}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                      <IndianRupee size={20} className="text-[#028090]" />
                    </div>
                  </div>
                </div>
              )}

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
                    min={form.startDate || undefined}
                    required
                    className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  />
                </div>
              </div>

              {/* CALCULATED DAYS */}

              {form.startDate && form.endDate && (
                <div className="rounded-xl border border-[#D8ECEA] bg-white p-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-[#51787C]">Total Days</p>

                      <p className="mt-1 font-bold text-[#0F2C2E]">30</p>
                    </div>

                    <div>
                      <p className="text-xs text-[#51787C]">Paid Days</p>

                      <p className="mt-1 font-bold text-[#028090]">
                        {paidDays}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#51787C]">Per Day</p>

                      <p className="mt-1 font-bold text-[#0F2C2E]">
                        {formatCurrency(perDaySalary)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#51787C]">Earned</p>

                      <p className="mt-1 font-bold text-[#028090]">
                        {formatCurrency(earnedSalary)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BONUS + DEDUCTION */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    step="0.01"
                    placeholder="0"
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
                    step="0.01"
                    placeholder="0"
                    className="w-full rounded-xl border border-[#D8ECEA] px-4 py-3 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20"
                  />
                </div>
              </div>

              {/* NET SALARY */}

              <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0F2C2E]">
                      Net Salary
                    </p>

                    <p className="mt-1 text-xs text-[#51787C]">
                      Earned salary + bonus - deduction
                    </p>
                  </div>

                  <span className="flex items-center text-xl font-bold text-[#028090]">
                    <IndianRupee size={19} />

                    {netSalary.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
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

              {/* INFO */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                <strong>Note:</strong> Creating payroll does not mean the
                employee has been paid. The payroll will be created as{" "}
                <strong>PENDING</strong>. Actual payment should be recorded from
                the separate Payment page.
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-[#D8ECEA] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-xl border border-[#D8ECEA] px-5 py-2.5 text-sm font-semibold text-[#0F2C2E] transition hover:bg-[#EEF7F6] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#028090] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B3B3E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
