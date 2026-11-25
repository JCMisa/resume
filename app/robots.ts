import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines may crawl the public pages. The signed-in app is blocked here
// (and noindexed in app/(routes)/layout.tsx). Shared resumes (/r/...) are NOT
// blocked: link-preview bots (LinkedIn, Slack…) obey robots.txt, and those
// pages already carry their own noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/resumes", "/interviews", "/settings", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
