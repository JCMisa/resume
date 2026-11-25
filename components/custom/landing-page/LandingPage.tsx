"use client";

import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  FileText,
  Mic,
  Shield,
  Zap,
  Upload,
  Layout,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  TrendingUp,
  Clock,
  ChevronDown,
  WandSparkles,
  Lock,
  Hash,
  ShieldCheck,
  ListChecks,
  Trash2,
  Heart,
} from "lucide-react";
import { ShineBorder } from "@/components/ui/shine-border";
import HomeNavbar from "./HomeNavbar";
import dynamic from "next/dynamic";

// WebGL background (three.js): loaded after the page shows, not in the first
// download. It is absolutely positioned decoration, so nothing shifts.
const LightPillar = dynamic(() => import("@/components/custom/LightPillar"), { ssr: false });
import ElectricBorder from "../ElectricBorder";
import { Highlighter } from "@/components/ui/highlighter";
import Image from "next/image";
import { FREE_LIMITS, PLAN_HIGHLIGHTS, PRO_LIMITS, PRO_PRICE_MONTHLY_USD } from "@/lib/plans";
import { TEMPLATE_IDS } from "@/lib/resume-templates";
import ProCheckoutButton from "@/components/custom/ProCheckoutButton";

// ── Sign-up-first links ───────────────────────────────────────────────────────
// Signed-out visitors go to sign-up and land on the feature afterwards (Clerk
// reads redirect_url), instead of being bounced to the sign-in page.
function useStartHref() {
  const { isSignedIn } = useAuth();
  return (to: string) => (isSignedIn ? to : `/sign-up?redirect_url=${encodeURIComponent(to)}`);
}

const TAILOR_PATH = "/resumes/create?mode=tailor";

// ── Phone check ───────────────────────────────────────────────────────────────
// The hero parallax (slide + fade on scroll) suits desktop, where the mockup is
// fully visible first. On phones the mockup sits below the fold, so the effect
// would fade it out while it is being read.
const SMALL_QUERY = "(max-width: 639px)";
function useIsSmallScreen() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(SMALL_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(SMALL_QUERY).matches,
    () => false,
  );
}

// ── Animated Number Counter ───────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const dur = 1600;
    const fps = 60;
    const total = Math.round(dur / (1000 / fps));
    let i = 0;
    const timer = setInterval(() => {
      i++;
      const t = i / total;
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(to * eased));
      if (i >= total) clearInterval(timer);
    }, 1000 / fps);
    return () => clearInterval(timer);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Magnetic Hover Effect ─────────────────────────────────────────────────────
function MagneticButton({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      x.set((e.clientX - cx) * 0.2);
      y.set((e.clientY - cy) * 0.2);
    },
    [x, y],
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
    </motion.a>
  );
}

// ── Noise Texture (SVG based) ─────────────────────────────────────────────────
function GridDots() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.07]"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--brand) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

// ── ATS Score Ring (hero mockup element) ─────────────────────────────────────
function ATSRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 32;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative flex items-center justify-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle
          cx="40"
          cy="40"
          r="32"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-stone-200 dark:text-stone-700"
        />
        <motion.circle
          cx="40"
          cy="40"
          r="32"
          style={{ stroke: "var(--brand)" }}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-brand-strong dark:text-brand">{score}</span>
        <span className="text-[8px] font-medium text-stone-400 leading-tight text-center">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function Hero() {
  const startHref = useStartHref();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const small = useIsSmallScreen();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", small ? "0%" : "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, small ? 1 : 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-5 sm:px-8 overflow-hidden bg-stone-50 dark:bg-stone-950"
    >
      <GridDots />

      {/* Ambient glow blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-brand/8 dark:bg-brand/4 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-brand/5 dark:bg-brand/3 blur-[80px] pointer-events-none" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-5xl mx-auto"
      >
        {/* Eyebrow */}
        {/* Entrance runs in CSS (.hero-rise) so the text paints before JS loads */}
        <div
          className="hero-rise flex justify-center mb-7"
          style={{ "--rise": "16px", animationDuration: "600ms", animationDelay: "50ms" } as React.CSSProperties}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand-strong dark:text-brand text-[11px] font-black uppercase tracking-[0.15em]">
            <Sparkles className="w-3 h-3" />
            New · Tailor your resume to any job
          </div>
        </div>

        {/* Headline — editorial split */}
        <h1
          className="hero-rise text-center mb-7"
          style={{ fontFamily: "'Sora', sans-serif", "--rise": "32px", animationDuration: "800ms", animationDelay: "120ms" } as React.CSSProperties}
        >
          <span className="block text-[clamp(2.6rem,7vw,5.5rem)] font-black tracking-[-0.03em] leading-[1.0] text-stone-900 dark:text-stone-50">
            Your resume,
          </span>
          <span className="block text-[clamp(2.6rem,7vw,5.5rem)] font-black tracking-[-0.03em] leading-[1.05]">
            <span className="relative inline-block">
              <Highlighter action="underline" color="brand">
                <span className="text-brand-strong dark:text-brand">tailored</span>
              </Highlighter>
              {/* Underline accent */}
              <motion.span
                className="absolute -bottom-1 left-0 h-[3px] bg-brand/40 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 0.9,
                  delay: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </span>
            <span className="text-stone-900 dark:text-stone-50"> to every job.</span>
          </span>
        </h1>

        <p
          className="hero-rise text-center text-base sm:text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto mb-10 leading-relaxed font-medium"
          style={{ "--rise": "20px", animationDuration: "700ms", animationDelay: "250ms" } as React.CSSProperties}
        >
          Paste a job post and ResuMe rewrites your resume around it, checks it
          like an ATS would, and lets you practise the interview out loud. Your
          employers, dates and numbers stay exactly as you wrote them.
        </p>

        {/* CTA Row */}
        <div
          className="hero-rise flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          style={{ "--rise": "20px", animationDuration: "600ms", animationDelay: "400ms" } as React.CSSProperties}
        >
          <MagneticButton
            href={startHref(TAILOR_PATH)}
            className="group relative flex w-full sm:w-auto justify-center items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-black bg-brand text-brand-foreground hover:bg-brand-hover transition-all duration-200 shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/35 hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            Tailor My Resume — Free
            <motion.span
              className="inline-block"
              animate={{ x: [0, 3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </MagneticButton>
          <Link
            href="#how-it-works"
            className="flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            See how it works
            <ChevronDown className="w-4 h-4" />
          </Link>
        </div>

        {/* Trust row */}
        <div
          className="hero-rise flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-16"
          style={{ "--rise": "0px", animationDuration: "600ms", animationDelay: "600ms" } as React.CSSProperties}
        >
          {[
            `${FREE_LIMITS.resume_tailor} tailored resumes free`,
            "No credit card needed",
            "No made-up facts",
          ].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-strong dark:text-brand" />
              <span className="font-medium">{t}</span>
            </div>
          ))}
        </div>

        {/* Hero Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-3xl"
        >
          {/* Floating cards */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -4 }}
            animate={{ opacity: 1, x: 0, rotate: -2 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -left-8 sm:-left-16 top-8 z-20 hidden sm:block"
          >
            <div className="bg-white dark:bg-stone-900 rounded-2xl px-4 py-3 border border-stone-200 dark:border-stone-700 shadow-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-brand-strong dark:text-brand" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                  ATS Score
                </p>
                <p className="text-sm font-black text-stone-900 dark:text-stone-100">
                  42 → <span className="text-brand-strong dark:text-brand">91</span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 4 }}
            animate={{ opacity: 1, x: 0, rotate: 2 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -right-8 sm:-right-16 bottom-12 z-20 hidden sm:block"
          >
            <div className="bg-white dark:bg-stone-900 rounded-2xl px-4 py-3 border border-stone-200 dark:border-stone-700 shadow-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                  Interview Live
                </p>
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  AI is listening…
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main card */}
          <div className="relative rounded-[20px] overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl shadow-stone-900/10 dark:shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-100 dark:border-stone-700/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-brand/80" />
              </div>
              <div className="flex-1 h-5 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center px-3">
                <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300 truncate">
                  ResuMe · ATS report
                </span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-brand-strong dark:text-brand uppercase tracking-widest">
                  Analysis Complete
                </span>
                <span className="ml-auto text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  Example
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Score ring */}
                <div className="col-span-1 flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-3 gap-2">
                  <ATSRing score={91} label="ATS" />
                  <span className="text-[9px] font-bold text-brand-strong dark:text-brand uppercase tracking-wide">
                    Excellent
                  </span>
                </div>

                {/* Score bars */}
                <div className="col-span-3 flex flex-col gap-2.5 justify-center">
                  {[
                    { label: "Keyword Match", score: 88 },
                    { label: "Format & Structure", score: 95 },
                    { label: "Work Experience", score: 76 },
                    { label: "Skills Alignment", score: 91 },
                  ].map((item, i) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <span className="text-[9px] sm:text-[10px] text-stone-400 w-20 sm:w-28 flex-shrink-0 font-medium">
                        {item.label}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-brand"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{
                            duration: 1,
                            delay: 0.85 + i * 0.1,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black text-stone-600 dark:text-stone-400 w-6 text-right tabular-nums">
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI tip */}
              <div className="mt-4 p-3 rounded-xl bg-brand/6 dark:bg-brand/5 border border-brand/15">
                <p className="text-[10px] sm:text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  <span className="font-black text-brand-strong dark:text-brand">
                    AI tip:{" "}
                  </span>
                  Add a measurable result (%, $, time saved) to 3 of your
                  Work Experience bullets.
                </p>
              </div>
            </div>
          </div>

          {/* Glow */}
          <div className="absolute -bottom-6 left-1/4 right-1/4 h-10 bg-brand/15 blur-2xl pointer-events-none rounded-full" />
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-4 h-4 text-stone-300 dark:text-stone-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Stats Strip ───────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { value: FREE_LIMITS.resume_tailor, suffix: "", label: "Tailored resumes free" },
    { value: 13, suffix: "", label: "ATS checks in every report" },
    { value: TEMPLATE_IDS.length, suffix: "", label: "ATS-friendly templates" },
    { value: FREE_LIMITS.analyze, suffix: "", label: "Free analyses every month" },
  ];

  return (
    <section className="bg-white dark:bg-stone-900 border-y border-stone-100 dark:border-stone-800 relative">
      <LightPillar
        topColor="#82B02C"
        bottomColor="brand"
        intensity={1}
        rotationSpeed={0.3}
        glowAmount={0.002}
        pillarWidth={3}
        pillarHeight={0.4}
        noiseIntensity={0.5}
        pillarRotation={89}
        interactive={false}
        mixBlendMode="screen"
        quality="high"
      />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="text-center"
          >
            <p
              className="text-3xl sm:text-4xl font-black text-brand-strong dark:text-brand tabular-nums mb-1"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              <Counter to={s.value} suffix={s.suffix} />
            </p>
            <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Features Section ──────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: WandSparkles,
      title: "Tailor to a Job",
      description:
        "Paste a job post and get a new version of your resume built around it: the job's keywords, sharper bullets, your best skills first. Your facts stay exactly as you wrote them.",
      accent: true,
    },
    {
      icon: BarChart3,
      title: "ATS Score Analysis",
      description:
        "A score with the reasons behind it: a 13-point checklist, red flags, keyword gaps and rewrites for your weakest bullets.",
    },
    {
      icon: Layout,
      title: "Live Resume Builder",
      description:
        "Fill in simple forms and watch the page update as you type, or edit right on the page. AI can draft a summary or sharpen a bullet; you choose what stays.",
    },
    {
      icon: Mic,
      title: "Voice Mock Interviews",
      description:
        "Talk with a voice interviewer about the role you want. Questions come from the job and your resume, and you get a scored report afterwards. Included with Pro.",
    },
    {
      icon: FileText,
      title: "PDF & Word, In and Out",
      description:
        "Upload a PDF or Word file, even a scanned one. Download your resume as a PDF anytime, or as Word with Pro.",
    },
    {
      icon: Shield,
      title: "Honest by Design",
      description:
        "Every AI rewrite is checked in code: no invented jobs, numbers or skills. Delete your resumes anytime; we never sell your data.",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 sm:py-32 px-5 sm:px-8 bg-stone-50 dark:bg-stone-950"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-strong dark:text-brand mb-4"
          >
            Everything you need
          </motion.p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 max-w-md leading-tight relative"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Your{" "}
              <Highlighter action="underline" color="brand">
                <span className="text-brand-strong dark:text-brand">complete</span>
              </Highlighter>{" "}
              career toolkit.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="text-sm text-stone-500 dark:text-stone-400 max-w-xs leading-relaxed"
            >
              From the job post to the interview, every step of your
              application in one place.
            </motion.p>
          </div>
        </div>

        {/* Feature grid — intentionally asymmetric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                feat.accent
                  ? "bg-stone-900 dark:bg-stone-800 border-stone-700 dark:border-stone-600"
                  : "bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-brand/30"
              } hover:shadow-lg hover:shadow-stone-900/6 dark:hover:shadow-black/30`}
            >
              {feat.accent && (
                <ShineBorder
                  shineColor={[
                    "var(--brand)",
                    "var(--brand-light)",
                    "var(--brand-strong)",
                  ]}
                  duration={8}
                  borderWidth={1}
                />
              )}
              <div
                className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center ${
                  feat.accent
                    ? "bg-brand/15"
                    : "bg-stone-50 dark:bg-stone-800 group-hover:bg-brand/10 transition-colors"
                }`}
              >
                <feat.icon
                  className={`w-5 h-5 ${feat.accent ? "text-brand" : "text-stone-400 dark:text-stone-500 group-hover:text-brand transition-colors"}`}
                />
              </div>
              <h3
                className={`font-bold text-base mb-2 ${feat.accent ? "text-stone-100" : "text-stone-900 dark:text-stone-100"}`}
              >
                {feat.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${feat.accent ? "text-stone-400" : "text-stone-500 dark:text-stone-400"}`}
              >
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: Upload,
      title: "Upload or Build",
      description:
        "Upload your resume as a PDF or Word file, or build one from scratch in the editor.",
    },
    {
      num: "02",
      icon: WandSparkles,
      title: "Tailor & Check",
      description:
        "Paste the job post. ResuMe tailors your resume to it and shows your ATS score, the keywords you're missing and every change it made.",
    },
    {
      num: "03",
      icon: Mic,
      title: "Interview Practice",
      description:
        "Practise out loud with a voice interviewer for that role, then get a scored report with tips and the full transcript (Pro).",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 sm:py-32 px-5 sm:px-8 bg-white dark:bg-stone-900 relative"
    >
      <LightPillar
        topColor="#82B02C"
        bottomColor="brand"
        intensity={1}
        rotationSpeed={0.3}
        glowAmount={0.002}
        pillarWidth={3}
        pillarHeight={0.4}
        noiseIntensity={0.5}
        pillarRotation={181}
        interactive={false}
        mixBlendMode="screen"
        quality="high"
      />

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-strong dark:text-brand mb-4"
            >
              Simple process
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="text-3xl sm:text-4xl md:text-5xl relative font-black tracking-tight text-stone-900 dark:text-stone-50 mb-5 leading-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              From upload to{" "}
              <Highlighter action="underline" color="brand">
                <span className="text-brand-strong dark:text-brand">interview-ready.</span>
              </Highlighter>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-12"
            >
              Do in one sitting what used to take a weekend of rewrites and
              guesswork.
            </motion.p>

            {/* Steps */}
            <div className="flex flex-col gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex gap-5 group"
                >
                  {/* Number + connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-md shadow-brand/20 flex-shrink-0">
                      <step.icon className="w-5 h-5 text-brand-foreground" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 mt-3 bg-gradient-to-b from-brand/30 to-transparent min-h-[2rem]" />
                    )}
                  </div>
                  <div className="pt-2 pb-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-black text-brand-strong dark:text-brand tracking-widest">
                        STEP {step.num}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-xs">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — Interview preview card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-2xl p-6 pb-16 sm:pb-6">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand/8 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <span className="text-[10px] font-mono font-black text-brand uppercase tracking-widest">
                      Live Session
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    04:32
                  </span>
                </div>

                {/* Chat bubbles */}
                <div className="flex flex-col gap-3 mb-6">
                  {[
                    {
                      role: "AI",
                      text: "Tell me about a time you led a cross-functional project under a tight deadline.",
                      ai: true,
                    },
                    {
                      role: "You",
                      text: "At my previous role, I coordinated a product launch across 4 teams in 6 weeks…",
                      ai: false,
                    },
                    {
                      role: "AI",
                      text: "Excellent. Can you walk me through the specific metrics you used to track success?",
                      ai: true,
                    },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.ai
                          ? "bg-stone-800/80 text-stone-300 border border-stone-700/50"
                          : "bg-brand/8 text-stone-200 border border-brand/15 ml-5"
                      }`}
                    >
                      <span
                        className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${msg.ai ? "text-stone-600" : "text-brand"}`}
                      >
                        {msg.role}
                      </span>
                      {msg.text}
                    </motion.div>
                  ))}
                </div>

                {/* Voice orb */}
                <div className="flex items-center justify-center py-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
                      <Mic className="w-7 h-7 text-brand-foreground" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-brand/20 animate-ping" />
                  </div>
                </div>
                <p className="text-center text-[10px] text-stone-600 font-mono">
                  Listening… speak naturally
                </p>
              </div>
            </div>

            {/* Score badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1, type: "spring", stiffness: 200 }}
              className="absolute -bottom-5 -left-5 sm:-left-8 bg-white dark:bg-stone-800 rounded-2xl p-3.5 shadow-xl border border-stone-100 dark:border-stone-700 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                <Award className="w-5 h-5 text-brand-strong dark:text-brand" />
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-medium">
                  Interview Score
                </p>
                <p className="text-lg font-black text-stone-900 dark:text-stone-100 leading-none">
                  87
                  <span className="text-xs font-medium text-stone-400">
                    /100
                  </span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Deep Capabilities ─────────────────────────────────────────────────────────
function Capabilities() {
  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 bg-stone-50 dark:bg-stone-950">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl relative font-black tracking-tight text-stone-900 dark:text-stone-50 mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Built for{" "}
            <Highlighter action="underline" color="brand">
              <span className="text-brand-strong dark:text-brand">serious</span>
            </Highlighter>{" "}
            job seekers.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto"
          >
            Every feature closes the gap between you and your target role.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Resume Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl p-7 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 overflow-hidden group hover:shadow-lg hover:shadow-stone-900/5 transition-all"
          >
            <ShineBorder
              shineColor={[
                "var(--brand)",
                "var(--brand-strong)",
                "var(--brand-light)",
              ]}
              duration={7}
              borderWidth={1.5}
            />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-sm shadow-brand/30">
                <BarChart3 className="w-5 h-5 text-brand-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                  Resume Analysis Engine
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Full ATS audit with AI
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
              Upload a PDF or Word file and get a full ATS audit: keyword gaps,
              weak phrases, formatting issues and line-by-line suggestions.
              Paste a job post to see how well you match it.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "ATS Scoring",
                "Keyword Gap",
                "Impact Phrases",
                "Format Check",
                "Red Flags",
                "Job Match",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand/8 text-brand-strong dark:text-brand border border-brand/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Resume Builder */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-2xl p-7 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 group hover:shadow-lg hover:shadow-stone-900/5 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                <Layout className="w-5 h-5 text-stone-500 dark:text-stone-400 group-hover:text-brand transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                  Live Resume Builder
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Forms or type on the page
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
              Fill in simple forms and watch your resume update as you type,
              or switch to Document mode and edit right on the page.
            </p>
            <div className="space-y-2.5">
              {[
                "AI help for your summary and bullets",
                "A live ATS score while you write",
                "Drag-and-drop section reordering",
                `${TEMPLATE_IDS.length} ATS-friendly templates`,
                "PDF export, plus Word with Pro",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-strong dark:text-brand flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Voice Interview — wide card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="md:col-span-2 rounded-2xl overflow-hidden bg-stone-950 dark:bg-black border border-stone-800 relative"
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand/6 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand/4 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-100 text-base">
                      Voice Mock Interview
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Real voice conversation · Pro
                    </p>
                  </div>
                </div>
                <p className="text-sm text-stone-400 leading-relaxed mb-5">
                  Tell it the role and add your resume, and the interviewer asks
                  5 questions shaped by both. Speak naturally, then get a scored
                  report with tips and the full transcript. Pro includes
                  {" "}{PRO_LIMITS.interview} interviews a month.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "5 Custom Questions",
                    "Real-time Voice",
                    "Full Transcript",
                    "Communication Score",
                    "Saved Results",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Session results mini */}
              <div className="bg-stone-900/70 rounded-2xl border border-stone-700/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-black text-brand uppercase tracking-widest">
                    Session Results
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Example · 5 min
                  </span>
                </div>
                {[
                  { label: "Communication", score: 88 },
                  { label: "Technical Depth", score: 74 },
                  { label: "Confidence", score: 91 },
                  { label: "Clarity", score: 85 },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-3 mb-2.5 last:mb-0"
                  >
                    <span className="text-[10px] text-stone-500 w-28 flex-shrink-0">
                      {s.label}
                    </span>
                    <div className="flex-1 h-1 rounded-full bg-stone-800">
                      <motion.div
                        className="h-full rounded-full bg-brand"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.score}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.8,
                          delay: 0.3 + i * 0.1,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 w-6 text-right font-mono tabular-nums">
                      {s.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Promises (same card look as the old reviews; no invented testimonials) ──
// Mirrors real behaviour: the tailoring fact guard in lib/resume-tailor.ts.
function Promises() {
  const promises = [
    {
      icon: Lock,
      title: "Your history stays locked",
      text: "Employers, job titles, dates, education and contact details are copied from your original, never rewritten.",
      tag: "Tailor to a job",
    },
    {
      icon: Hash,
      title: "Every number stays",
      text: "If you wrote 12%, the tailored resume says 12%. A rewrite that drops or changes a number is thrown out.",
      tag: "Tailor to a job",
    },
    {
      icon: ShieldCheck,
      title: "No borrowed skills",
      text: "It won't add a tool or certification from the job post that your resume never mentions.",
      tag: "Tailor to a job",
    },
    {
      icon: ListChecks,
      title: "You confirm the rest",
      text: "Skills you might be missing are shown as suggestions. Only the ones you tick are added.",
      tag: "Your choice",
    },
    {
      icon: FileText,
      title: "Readable by ATS software",
      text: "Every template is a single column of real text, so screening software can read it the way a person does.",
      tag: "Templates",
    },
    {
      icon: Trash2,
      title: "Your data, your call",
      text: "Delete any resume whenever you like. We never sell your data.",
      tag: "Privacy",
    },
  ];

  return (
    <section
      id="promises"
      className="py-24 sm:py-32 px-5 sm:px-8 bg-white dark:bg-stone-900 relative"
    >
      <LightPillar
        topColor="#82B02C"
        bottomColor="brand"
        intensity={1}
        rotationSpeed={0.3}
        glowAmount={0.002}
        pillarWidth={3}
        pillarHeight={0.4}
        noiseIntensity={0.5}
        pillarRotation={111}
        interactive={false}
        mixBlendMode="screen"
        quality="high"
      />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-strong dark:text-brand mb-4"
          >
            Built to be trusted
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 relative"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            AI that{" "}
            <Highlighter action="underline" color="brand">
              <span className="text-brand-strong dark:text-brand">won&apos;t</span>
            </Highlighter>{" "}
            make things up.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto mt-4"
          >
            Every AI rewrite is checked in code before you see it. Anything that
            doesn&apos;t pass keeps your original text.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promises.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.09,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700/50 hover:bg-white dark:hover:bg-stone-800 hover:shadow-md hover:shadow-stone-900/5 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center mb-4">
                <p.icon className="w-4 h-4 text-brand-strong dark:text-brand" />
              </div>
              <p className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">
                {p.title}
              </p>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5">
                {p.text}
              </p>
              <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand/8 text-brand-strong dark:text-brand border border-brand/15">
                {p.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function Pricing() {
  const startHref = useStartHref();
  // Generated from lib/plans.ts so the pricing card always matches what the app enforces
  const free = PLAN_HIGHLIGHTS.free;
  const pro = PLAN_HIGHLIGHTS.pro;

  return (
    <section
      id="pricing"
      className="py-24 sm:py-32 px-5 sm:px-8 bg-stone-50 dark:bg-stone-950"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-strong dark:text-brand mb-4"
          >
            Simple pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-4xl md:text-5xl relative font-black tracking-tight text-stone-900 dark:text-stone-50"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Start free.{" "}
            <Highlighter action="underline" color="brand">
              <span className="text-brand-strong dark:text-brand">Upgrade</span>
            </Highlighter>{" "}
            anytime.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-7 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 mb-3">
              Free
            </p>
            <div className="flex items-baseline gap-1 mb-6">
              <span
                className="text-4xl font-black text-stone-900 dark:text-stone-100"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                $0
              </span>
              <span className="text-stone-500 dark:text-stone-400 text-sm">/month</span>
            </div>
            <div className="space-y-3 mb-7">
              {free.map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-stone-300 dark:text-stone-600 flex-shrink-0" />
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={startHref("/dashboard")}
              className="block w-full py-3 text-center rounded-xl text-sm font-bold border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Get started free
            </Link>
          </motion.div>

          {/* Pro */}
          <ElectricBorder
            color="brand"
            speed={0.7}
            chaos={0.12}
            style={{ borderRadius: 7.2 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className=" rounded-2xl p-7 "
            >
              <div className="absolute top-5 right-5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-brand text-brand-foreground uppercase tracking-wider">
                  Popular
                </span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-strong dark:text-brand mb-3">
                Pro
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className="text-4xl font-black dark:text-stone-100 text-stone-900"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  ${PRO_PRICE_MONTHLY_USD}
                </span>
                <span className="text-stone-500 text-sm">/month</span>
              </div>
              <div className="space-y-3 mb-7">
                {pro.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-strong dark:text-brand flex-shrink-0" />
                    <span className="text-sm text-stone-600 dark:text-stone-400">{item}</span>
                  </div>
                ))}
              </div>
              {/* Opens Clerk checkout directly for signed-in free users */}
              <ProCheckoutButton
                className="block w-full py-3 text-center rounded-xl text-sm font-black bg-brand text-brand-foreground hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20 cursor-pointer"
                proLabel="You're on Pro · Manage plan"
              >
                Start Pro Subscription
              </ProCheckoutButton>
            </motion.div>
          </ElectricBorder>
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CTABanner() {
  const startHref = useStartHref();
  return (
    <section className="py-16 sm:py-24 px-5 sm:px-8 bg-stone-100/50 dark:bg-stone-900/30 relative">
      <LightPillar
        topColor="#82B02C"
        bottomColor="brand"
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

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden bg-stone-950 dark:bg-black border border-stone-800 px-6 py-10 sm:p-16 text-center"
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
          <GridDots />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-[0.15em] mb-6">
              <Zap className="w-3 h-3" />
              Free to start
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-50 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Your next application deserves its own resume.
            </h2>
            <p className="text-stone-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              Tailor your first {FREE_LIMITS.resume_tailor} resumes free, see your
              ATS score and every change, then download a PDF that&apos;s ready
              to send.
            </p>
            <MagneticButton
              href={startHref(TAILOR_PATH)}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-4 rounded-2xl text-base font-black bg-brand text-brand-foreground hover:bg-brand-hover transition-all duration-200 shadow-xl shadow-brand/25 hover:shadow-2xl hover:shadow-brand/35 hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Tailor My Resume — Free
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <p className="text-stone-500 text-xs mt-4">
              No credit card required · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <Image src="/logo.svg" alt="logo" width={28} height={28} />
              <span
                className="font-black text-lg tracking-tight text-stone-900 dark:text-stone-50"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Resu<span className="text-brand-strong dark:text-brand">Me</span>
              </span>
            </Link>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Tailor your resume to every job, check it like an ATS would, and
              practise the interview, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-16 text-sm">
            {[
              {
                heading: "Product",
                links: ["Features", "How it works", "Pricing"],
                hrefs: ["#features", "#how-it-works", "#pricing"],
              },
              {
                heading: "Account",
                links: ["Create account", "Sign in"],
                hrefs: ["/sign-up", "/sign-in"],
              },
              {
                heading: "Legal",
                links: ["Privacy", "Terms"],
                hrefs: ["/privacy", "/terms"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <p className="font-bold text-stone-900 dark:text-stone-100 mb-3 text-xs uppercase tracking-wider">
                  {col.heading}
                </p>
                <div className="flex flex-col gap-2.5">
                  {col.links.map((l, i) => (
                    <Link
                      key={l}
                      href={col.hrefs[i]}
                      className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-sm"
                    >
                      {l}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            © {new Date().getFullYear()} ResuMe. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            Made with
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" aria-label="love" />
            by JC Misa
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page Entry ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen relative bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-x-hidden">
      <HomeNavbar />
      <Hero />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <Capabilities />
      <Promises />
      <Pricing />
      <CTABanner />
      <Footer />
    </div>
  );
}
