"use client";
import dynamic from "next/dynamic";

const CityViewer = dynamic(() => import("@/components/city/CityViewer"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#040408",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          color: "#00ffff",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 6,
        }}
      >
        LOADING CITY
      </div>
      <div
        style={{
          width: 120,
          height: 3,
          borderRadius: 2,
          background: "rgba(0,200,255,0.15)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 60,
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, #00ffff, transparent)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  ),
});

export default function ClientEntry() {
  return <CityViewer />;
}
