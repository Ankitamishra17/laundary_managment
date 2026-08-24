import React from "react";
import {
  Search,
  Filter,
  X,
  CalendarDays,
  CreditCard,
  RotateCcw,
} from "lucide-react";

const PaymentFilters = ({ filters, setFilters, onClear }) => {
  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    setFilters({
      search: "",
      paymentType: "",
      paymentMethod: "",
      status: "",
      startDate: "",
      endDate: "",
    });
  };

  // =====================================================
  // CHECK ACTIVE FILTERS
  // =====================================================

  const hasFilters =
    filters.search ||
    filters.paymentType ||
    filters.paymentMethod ||
    filters.status ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Filter size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Payment Filters
            </h3>

            <p className="text-xs text-gray-500">Filter payment transactions</p>
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <RotateCcw size={15} />
            Clear Filters
          </button>
        )}
      </div>

      {/* =================================================
          FILTER CONTENT
      ================================================= */}

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="sm:col-span-2 xl:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                name="search"
                value={filters.search || ""}
                onChange={handleChange}
                placeholder="Payment no, transaction ID..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              {filters.search && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      search: "",
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              PAYMENT TYPE
          ================================================= */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Payment Type
            </label>

            <select
              name="paymentType"
              value={filters.paymentType || ""}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Types</option>

              <option value="CUSTOMER">Customer</option>

              <option value="SUPPLIER">Supplier</option>

              <option value="SALARY">Salary</option>
            </select>
          </div>

          {/* =================================================
              PAYMENT METHOD
          ================================================= */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Payment Method
            </label>

            <div className="relative">
              <CreditCard
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                name="paymentMethod"
                value={filters.paymentMethod || ""}
                onChange={handleChange}
                className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All Methods</option>

                <option value="Cash">Cash</option>

                <option value="UPI">UPI</option>

                <option value="Card">Card</option>

                <option value="Bank_Transfer">Bank Transfer</option>

                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* =================================================
              STATUS
          ================================================= */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Status
            </label>

            <select
              name="status"
              value={filters.status || ""}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Status</option>

              <option value="Paid">Paid</option>

              <option value="Pending">Pending</option>

              <option value="Failed">Failed</option>

              <option value="Cancelled">Cancelled</option>

              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* =================================================
              START DATE
          ================================================= */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              From Date
            </label>

            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                name="startDate"
                value={filters.startDate || ""}
                onChange={handleChange}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* =================================================
              END DATE
          ================================================= */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              To Date
            </label>

            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                name="endDate"
                value={filters.endDate || ""}
                min={filters.startDate || undefined}
                onChange={handleChange}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            ACTIVE FILTER TAGS
        ================================================= */}

        {hasFilters && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <span className="mr-1 text-xs font-medium text-gray-500">
              Active:
            </span>

            {filters.search && (
              <FilterTag
                label={`Search: ${filters.search}`}
                onRemove={() =>
                  setFilters((prev) => ({
                    ...prev,
                    search: "",
                  }))
                }
              />
            )}

            {filters.paymentType && (
              <FilterTag
                label={`Type: ${filters.paymentType}`}
                onRemove={() =>
                  setFilters((prev) => ({
                    ...prev,
                    paymentType: "",
                  }))
                }
              />
            )}

            {filters.paymentMethod && (
              <FilterTag
                label={`Method: ${filters.paymentMethod}`}
                onRemove={() =>
                  setFilters((prev) => ({
                    ...prev,
                    paymentMethod: "",
                  }))
                }
              />
            )}

            {filters.status && (
              <FilterTag
                label={`Status: ${filters.status}`}
                onRemove={() =>
                  setFilters((prev) => ({
                    ...prev,
                    status: "",
                  }))
                }
              />
            )}

            {filters.startDate && (
              <FilterTag
                label={`From: ${filters.startDate}`}
                onRemove={() =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: "",
                  }))
                }
              />
            )}

            {filters.endDate && (
              <FilterTag
                label={`To: ${filters.endDate}`}
                onRemove={() =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: "",
                  }))
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// FILTER TAG
// =====================================================

const FilterTag = ({ label, onRemove }) => {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
      <span className="max-w-[220px] truncate">{label}</span>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 transition hover:bg-indigo-100"
      >
        <X size={13} />
      </button>
    </span>
  );
};

export default PaymentFilters;
