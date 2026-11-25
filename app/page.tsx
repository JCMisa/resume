import LandingPage from "@/components/custom/landing-page/LandingPage";
import { ThemeToggler } from "@/components/custom/ThemeToggler";

export default function Home() {
  return (
    <main className="relative">
      <LandingPage />

      {/* solid backing so the button stays visible over dark sections in light mode */}
      <div className="fixed bottom-5 right-5 z-[999999] rounded-md bg-background shadow-md">
        <ThemeToggler />
      </div>
    </main>
  );
}
