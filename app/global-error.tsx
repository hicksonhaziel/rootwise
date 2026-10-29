"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Rootwise GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0A0A0A", color: "#FAFAFA", fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", margin: 0, padding: 16 }}>
        <div style={{ maxWidth: 420, width: "100%", padding: 24, backgroundColor: "#111111", border: "1px solid #262626", borderRadius: 12, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Application Error</h2>
          <p style={{ fontSize: 13, color: "#A0A0A0", lineHeight: 1.5, marginBottom: 20 }}>
            {error.message || "An unexpected system error occurred."}
          </p>
          <button
            onClick={() => reset()}
            style={{ backgroundColor: "#A8F25C", color: "#0A0A0A", fontWeight: "bold", border: "none", padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
