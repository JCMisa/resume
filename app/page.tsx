"use client";

import Features from "@/components/custom/landing-page/Features";
import Hero from "@/components/custom/landing-page/Hero";
import HomeNavbar from "@/components/custom/landing-page/HomeNavbar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center relative pb-[10px]">
      <HomeNavbar />

      {/* hero section */}
      <Hero />

      {/* feature section */}
      <Features />
    </main>
  );
}
