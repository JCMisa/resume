import LightPillar from "@/components/custom/LightPillar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  CpuIcon,
  FileCheckIcon,
  SparklesIcon,
  UserCheckIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative min-h-[900px] lg:h-[calc(100vh-40px)] w-[calc(100%-20px)] m-[10px] rounded-[30px] shadow-2xl bg-stone-100/40 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800/50 text-foreground overflow-hidden flex items-center justify-center p-6 md:p-12 lg:p-20 z-0">
      <LightPillar
        topColor="#82B02C"
        bottomColor="#9ae600"
        intensity={1}
        rotationSpeed={0.3}
        glowAmount={0.002}
        pillarWidth={3}
        pillarHeight={0.4}
        noiseIntensity={0.5}
        pillarRotation={45}
        interactive={false}
        mixBlendMode="screen"
        quality="high"
      />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* LEFT COLUMN: THE CORE CONVERSIVE VALUE PROPOSITION */}
        <div className="lg:col-span-7 space-y-8 text-left max-w-2xl animate-in fade-in slide-in-from-left-6 duration-700">
          {/* AI Feature Badge tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-neutral-950/60 border border-stone-200/60 dark:border-neutral-800 backdrop-blur-md shadow-sm">
            <SparklesIcon className="h-3.5 w-3.5 text-[#82B02C] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-300">
              Next-Gen AI Resume Architecture
            </span>
          </div>

          {/* Main Hook Header */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.95] text-stone-900 dark:text-stone-50">
              Build resumes that pass the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#82B02C] to-[#9ae600]">
                ATS Gatekeepers.
              </span>
            </h1>
            <p className="text-base md:text-lg text-stone-600 dark:text-stone-400 font-medium leading-relaxed max-w-xl">
              Optimize your professional narrative with instant AI audits,
              automated section restructuring, and live real-time voice
              interview simulations tailored precisely to your target career
              paths.
            </p>
          </div>

          {/* Call-to-Action Interactive Buttons Container */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/resumes/create"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[#82B02C] hover:bg-[#9ae600] text-white font-black rounded-xl tracking-wide gap-2 text-sm px-8 py-6 shadow-lg shadow-[#82B02C]/20 transform transition-all hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              Build Your Resume
              <ArrowRightIcon className="h-4 w-4" />
            </Link>

            <Link
              href="/interviews"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-xl font-bold tracking-wide text-sm px-6 py-6 border-stone-300 dark:border-stone-700 bg-white/30 dark:bg-neutral-900/30 backdrop-blur-md gap-2 hover:bg-stone-200/50 dark:hover:bg-neutral-800/50",
              )}
            >
              <VideoIcon className="h-4 w-4 text-[#82B02C]" />
              Simulate Live Interview
            </Link>
          </div>

          {/* Platform Performance Features Row */}
          <div className="py-6 px-4 grid grid-cols-3 gap-4 border-t border-stone-200/30 dark:border-stone-800/30 shadow-2xl place-items-center rounded-[16px]">
            <div>
              <p className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                100%
              </p>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-500">
                ATS Compliance
              </p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                Proprietary
              </p>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-500">
                Advanced Studio Core
              </p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                &lt; 1ms
              </p>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-500">
                Arcjet Shield Speed
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MODERN INTERACTIVE DASHBOARD PREVIEW PANEL */}
        <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-6 duration-700 delay-150">
          {/* Main Decorative Workspace Canvas Wrapper */}
          <div className="w-full max-w-[420px] bg-white/70 dark:bg-neutral-950/70 border border-stone-200/60 dark:border-neutral-800/60 p-6 rounded-[24px] backdrop-blur-xl shadow-2xl relative space-y-6">
            {/* Simulated Workspace Header Row */}
            <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-neutral-800/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-stone-400 uppercase">
                resumestudio_runtime
              </span>
            </div>

            {/* Simulated Interactive Matrix Row A: AI Scoring Ring */}
            <div className="p-4 rounded-2xl bg-stone-100/50 dark:bg-neutral-900/50 border border-stone-200/30 dark:border-neutral-800/30 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                  <CpuIcon className="h-3.5 w-3.5 text-[#82B02C]" /> Realtime
                  Audit
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  Keywords alignment validated.
                </p>
              </div>
              <div className="size-12 rounded-full border-2 border-dashed border-[#82B02C] flex items-center justify-center text-xs font-black text-[#82B02C] animate-spin-slow">
                94%
              </div>
            </div>

            {/* Simulated Interactive Matrix Row B: Voice AI Channel Block */}
            <div className="p-4 rounded-2xl bg-stone-100/50 dark:bg-neutral-900/50 border border-stone-200/30 dark:border-neutral-800/30 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                  <VideoIcon className="h-3.5 w-3.5 text-[#82B02C]" /> Voice
                  Session
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  Ready to initialize simulation.
                </p>
              </div>
              <span className="inline-flex px-2 py-1 text-[9px] font-mono font-bold rounded-md bg-[#82B02C]/10 text-[#82B02C] border border-[#82B02C]/20 tracking-wider uppercase animate-pulse">
                Online
              </span>
            </div>

            {/* Floating Glass Macro Badge Top-Left */}
            <div className="absolute -top-6 -left-6 bg-white/80 dark:bg-neutral-950/80 border border-stone-200/50 dark:border-neutral-800/50 p-3 rounded-xl backdrop-blur-md shadow-md hidden sm:flex items-center gap-2.5 animate-bounce-slow">
              <div className="p-2 bg-[#82B02C]/10 text-[#82B02C] rounded-lg">
                <FileCheckIcon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider leading-none">
                  ATS Pass
                </p>
                <p className="text-xs font-black text-stone-800 dark:text-stone-100 mt-0.5">
                  Verified Stream
                </p>
              </div>
            </div>

            {/* Floating Glass Macro Badge Bottom-Right */}
            <div className="absolute -bottom-6 -right-6 bg-white/80 dark:bg-neutral-950/80 border border-stone-200/50 dark:border-neutral-800/50 p-3 rounded-xl backdrop-blur-md shadow-md hidden sm:flex items-center gap-2.5">
              <div className="p-2 bg-[#82B02C]/10 text-[#82B02C] rounded-lg">
                <UserCheckIcon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider leading-none">
                  Recruiter Role
                </p>
                <p className="text-xs font-black text-stone-800 dark:text-stone-100 mt-0.5">
                  Simulations Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
