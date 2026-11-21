import type { Metadata } from "next";
import { Geist_Mono, Geist, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/custom/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { UserStoreWatcher } from "@/providers/UserStoreWatcher";
import { accentBootScript, accentCss } from "@/lib/accents";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResuMe | AI-Powered Smart Resume Builder",
  description:
    "Transform your career with ResuMe. Using Gemini AI to analyze, improve, and generate high-fidelity, ATS-friendly resumes in seconds.",
  keywords: [
    "AI Resume Builder",
    "Next.js Resume Generator",
    "ATS-Friendly Resume",
    "Career AI",
    "Professional CV Maker",
  ],
  authors: [{ name: "John Carlo S. Misa" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <head>
        {/* Accent color themes: CSS variables for every palette, and a tiny
            script that applies the saved one before first paint (no flash). */}
        <style dangerouslySetInnerHTML={{ __html: accentCss() }} />
        <script dangerouslySetInnerHTML={{ __html: accentBootScript() }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Clerk's shadcn theme reads var(--primary), which follows the accent */}
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <UserStoreWatcher />
              {children}
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
