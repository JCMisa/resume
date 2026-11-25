import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  // the landing page is the entry search engines should show
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
