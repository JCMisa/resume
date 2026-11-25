/**
 * Public site identity, used by metadata, robots.txt, the sitemap, structured
 * data and the legal pages.
 *
 * SITE_URL: set NEXT_PUBLIC_SITE_URL to the real domain in production
 * (e.g. https://resume.example.com). On Vercel it falls back to the project's
 * production URL; locally to http://localhost:3000.
 */
export const SITE_NAME = "ResuMe";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_TITLE = "ResuMe: Tailor Your Resume to Every Job";

export const SITE_DESCRIPTION =
  "Tailor your resume to any job post, check it like an ATS would, build it with AI help and practise the interview out loud. Free to start, no credit card.";

export const SITE_KEYWORDS = [
  "tailor resume to job description",
  "AI resume builder",
  "ATS resume checker",
  "ATS-friendly resume",
  "resume keyword match",
  "mock interview practice",
  "resume templates",
];

export const SITE_AUTHOR = "JC Misa";

/** Contact address shown on the legal pages (set NEXT_PUBLIC_SUPPORT_EMAIL). */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";

/**
 * Google Search Console "HTML tag" verification: only the `content` value of
 * <meta name="google-site-verification" content="...">. Public by design.
 */
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;

/** Date the privacy policy and terms last changed (shown on both pages). */
export const LEGAL_UPDATED = "November 25, 2026";
