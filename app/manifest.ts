import type { MetadataRoute } from "next";

// Web app manifest: lets ResuMe be installed (Add to Home Screen), which iOS
// requires before it allows device notifications.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ResuMe: AI resume builder & mock interviewer",
    short_name: "ResuMe",
    description: "AI resume analysis, job matching and voice mock interviews.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#0c0a09",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
