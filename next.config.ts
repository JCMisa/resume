import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type errors now fail the build (no ignoreBuildErrors), so broken types
  // can't be deployed. Run `npx tsc --noEmit` locally to check first.
  experimental: {
    serverActions: {
      // Default is 1MB. Scanned-resume analysis sends the PDF itself (capped at
      // SCANNED_PDF_MAX_BYTES = 3.5MB in lib/resume-text.ts). Vercel caps request
      // bodies at 4.5MB, so don't raise this past 4mb.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // Only hosts we actually serve through next/image. A wildcard here would let
    // anyone use our image optimizer as a free proxy for arbitrary URLs.
    remotePatterns: [
      {
        // Clerk user avatars (Clerk-hosted and uploaded profile photos)
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
