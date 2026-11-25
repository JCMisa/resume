import { ImageResponse } from "next/og";

// Link-preview card for the site (Facebook, LinkedIn, X, Slack, Messenger…).
// Same look as the shared-resume card (app/r/[code]/opengraph-image.tsx).
// Fixed colours on purpose: drawn on the server, where the --brand CSS
// variables (user accent themes) don't exist. Built at deploy time.

export const alt = "ResuMe: your resume, tailored to every job";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LIME = "#9ae600";

export default function Image() {
  const features = ["Tailor to a job", "ATS check", "Resume builder", "Mock interviews"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0a09",
          backgroundImage: "radial-gradient(circle at 85% 10%, rgba(154,230,0,0.18), transparent 45%)",
          color: "#fafaf9",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: LIME }} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
            Resu<span style={{ color: LIME }}>Me</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 80, fontWeight: 800, lineHeight: 1.02 }}>
            <span>Your resume,</span>
            <span>
              <span style={{ color: LIME }}>tailored</span>&nbsp;to every job.
            </span>
          </div>
          <div style={{ fontSize: 32, color: "#a8a29e" }}>Keep every fact true. Free to start.</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {features.map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                fontSize: 24,
                padding: "10px 20px",
                borderRadius: 999,
                border: "2px solid rgba(154,230,0,0.45)",
                color: LIME,
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
