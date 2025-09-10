// src/components/LogoPinHome.jsx
import React from "react";
export default function LogoPinHome({ size = 40, white = false, className = "" }) {
  const blue = white ? "#ffffff" : "#2563EB";
  const yellow = white ? "#ffffff" : "#FACC15";
  const dark = white ? "rgba(255,255,255,0.9)" : "#0F172A";
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <circle cx="32" cy="32" r="30" fill={blue} opacity={white ? 0.12 : 0.1} />
        <path d="M32 8C22.1 8 14 16.1 14 26c0 9.9 11.6 22.6 16.5 27.4.8.8 2.1.8 2.9 0C38.4 48.6 50 35.9 50 26 50 16.1 41.9 8 32 8z" fill={blue}/>
        <path d="M20 26v-6l12-8 12 8v6h-6v8h-12v-8h-6z" fill={yellow}/>
        <rect x="30" y="28" width="4" height="6" rx="0.8" fill={dark} opacity={white ? 0.9 : 1}/>
      </svg>
      <div style={{ display: "flex", gap: 2, alignItems: "baseline" }}>
        <span style={{ fontWeight: 700, fontSize: size * 0.42, color: blue, fontFamily: "Montserrat, Inter, sans-serif" }}>Rent</span>
        <span style={{ fontWeight: 700, fontSize: size * 0.42, color: yellow, fontFamily: "Montserrat, Inter, sans-serif" }}>ora</span>
      </div>
    </div>
  );
}
