import LandingPage from "@/components/custom/landing-page/SampleLandingPage2";
import { ThemeToggler } from "@/components/custom/ThemeToggler";

export default function Home() {
  return (
    <main className="relative">
      <LandingPage />

      <div className="fixed bottom-5 right-5 z-[999999]">
        <ThemeToggler />
      </div>
    </main>
  );
}
