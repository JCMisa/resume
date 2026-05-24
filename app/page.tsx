"use client";

import ElectricBorder from "@/components/custom/ElectricBorder";
import Features from "@/components/custom/landing-page/Features";
import Hero from "@/components/custom/landing-page/Hero";
import HomeNavbar from "@/components/custom/landing-page/HomeNavbar";
import Workflow from "@/components/custom/landing-page/Workflow";
import { ThemeToggler } from "@/components/custom/ThemeToggler";

export default function Home() {
  return (
    <ElectricBorder
      color="#9ae600"
      speed={0.7}
      chaos={0.12}
      style={{ borderRadius: 0 }}
    >
      <main className="flex min-h-screen flex-col items-center relative pb-[10px]">
        <HomeNavbar />

        {/* hero section */}
        <Hero />

        {/* feature section */}
        <Features />

        {/* workflow section */}
        <Workflow />

        <div className="fixed bottom-3 right-3 z-[999999]">
          <ThemeToggler />
        </div>
      </main>
    </ElectricBorder>
  );
}
