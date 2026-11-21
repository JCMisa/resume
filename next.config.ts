import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type errors now fail the build (no ignoreBuildErrors), so broken types
  // can't be deployed. Run `npx tsc --noEmit` locally to check first.
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
