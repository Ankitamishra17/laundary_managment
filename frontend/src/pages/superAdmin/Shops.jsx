import React from "react";

const colors = {
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

export default function Shops() {
  return (
    <div
      className="rounded-2xl border p-10 sm:p-16 text-center"
      style={{
        backgroundColor: colors.bgLight,
        borderColor: colors.cardBorder,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <h2
        className="text-2xl mb-2"
        style={{
          color: colors.textDark,
          fontFamily: "'Libre Baskerville', serif",
        }}
      >
        Shops
      </h2>
      <p className="text-sm" style={{ color: colors.textMuted }}>
        This page is a placeholder — build out the Shops view here.
      </p>
    </div>
  );
}
