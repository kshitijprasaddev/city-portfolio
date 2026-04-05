"use client";
import dynamic from "next/dynamic";
import { Component, ReactNode } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            background: "#040408",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            padding: "0 32px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#ef4444", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            FAILED TO LOAD
          </div>
          <div style={{ color: "#475569", fontSize: 12, maxWidth: 520, lineHeight: 1.7 }}>
            {this.state.error?.message ?? "Unknown error"}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: "10px 28px",
              background: "rgba(0,200,255,0.1)",
              border: "1px solid rgba(0,200,255,0.3)",
              borderRadius: 10,
              color: "#00ffff",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: "pointer",
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <div style={{ color: "#00ffff", fontSize: 20, fontWeight: 700, letterSpacing: 6 }}>
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
            background: "linear-gradient(90deg, transparent, #00ffff, transparent)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  ),
});

export default function ClientEntry() {
  return (
    <ErrorBoundary>
      <CityViewer />
    </ErrorBoundary>
  );
}

