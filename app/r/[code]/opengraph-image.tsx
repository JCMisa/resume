import { ImageResponse } from "next/og";
import { getPublicResume } from "@/lib/public-resume";
import { headline } from "@/lib/resume-share";

// Link-preview card for a shared resume (LinkedIn, Messenger, Slack…).
// Only the name and latest role: never contact details.
// Fixed colors on purpose: this PNG is drawn on the server, where the
// --brand CSS variables (user accent themes) do not exist.

export const alt = "Resume shared with ResuMe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const resume = await getPublicResume(code);
  const name = resume?.content.personalDetails?.name?.trim() || resume?.title || "Resume";
  const line = resume ? headline(resume.content) : "This resume isn't available";

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
          color: "#fafaf9",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#9ae600" }} />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>ResuMe</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{name.slice(0, 60)}</div>
          {line && <div style={{ fontSize: 36, color: "#a8a29e" }}>{line.slice(0, 90)}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: "#9ae600" }}>
          <div style={{ width: 60, height: 6, background: "#9ae600", borderRadius: 3 }} />
          View resume
        </div>
      </div>
    ),
    size,
  );
}
