import React from "react";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function TaskFilterTabs({ active, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-[#EEF7F6] p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            active === tab.key
              ? "bg-white text-[#028090] shadow-sm"
              : "text-[#6B8482] hover:text-[#0F2C2E]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}