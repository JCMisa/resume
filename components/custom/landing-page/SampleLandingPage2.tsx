"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Mic,
  Brain,
  Shield,
  Zap,
  Star,
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
} from "lucide-react";
import { ShineBorder } from "@/components/ui/shine-border";
import HomeNavbar from "./HomeNavbar";
import LightPillar from "../LightPillar";
import ElectricBorder from "../ElectricBorder";
import { Highlighter } from "@/components/ui/highlighter";
import Image from "next/image";

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
          "radial-gradient(circle, #9ae600 1px, transparent 1px)",
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
          stroke="#9ae600"
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
        <span className="text-lg font-black text-[#9ae600]">{score}</span>
        <span className="text-[8px] font-medium text-stone-400 leading-tight text-center">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-5 sm:px-8 overflow-hidden bg-stone-50 dark:bg-stone-950"
    >
      <GridDots />

      {/* Ambient glow blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#9ae600]/8 dark:bg-[#9ae600]/4 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#9ae600]/5 dark:bg-[#9ae600]/3 blur-[80px] pointer-events-none" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-5xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="flex justify-center mb-7"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#9ae600]/10 border border-[#9ae600]/20 text-[#4d7000] dark:text-[#9ae600] text-[11px] font-black uppercase tracking-[0.15em]">
            <Sparkles className="w-3 h-3" />
            Powered by Google Gemini AI & VAPI Voice
          </div>
        </motion.div>

        {/* Headline — editorial split */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-7"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          <span className="block text-[clamp(2.6rem,7vw,5.5rem)] font-black tracking-[-0.03em] leading-[1.0] text-stone-900 dark:text-stone-50">
            Your resume,
          </span>
          <span className="block text-[clamp(2.6rem,7vw,5.5rem)] font-black tracking-[-0.03em] leading-[1.05]">
            <span className="relative inline-block">
              <Highlighter action="underline" color="#9ae600">
                <span className="text-primary">precision-built</span>
              </Highlighter>
              {/* Underline accent */}
              <motion.span
                className="absolute -bottom-1 left-0 h-[3px] bg-[#9ae600]/40 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 0.9,
                  delay: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </span>
            <span className="text-stone-900 dark:text-stone-50"> by AI.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-base sm:text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto mb-10 leading-relaxed font-medium"
        >
          Upload your resume, get a full ATS audit, build a new one live, then
          practice with a voice AI interviewer — all in one tool.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          <MagneticButton
            href="/resumes/analyze"
            className="group relative flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-black bg-[#9ae600] text-[#1e3800] hover:bg-[#a8f000] transition-all duration-200 shadow-lg shadow-[#9ae600]/25 hover:shadow-xl hover:shadow-[#9ae600]/35 hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            Analyze My Resume — Free
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
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            See how it works
            <ChevronDown className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex flex-wrap items-center justify-center gap-5 text-xs text-stone-400 dark:text-stone-500 mb-16"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["#9ae600", "#7acc00", "#5ab000", "#3a9400"].map((c, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-stone-50 dark:border-stone-950 flex items-center justify-center text-[8px] font-black text-white"
                  style={{ background: c }}
                >
                  {["A", "B", "C", "D"][i]}
                </div>
              ))}
            </div>
            <span className="font-medium">50,000+ professionals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className="w-3 h-3 fill-[#9ae600] text-[#9ae600]"
                />
              ))}
            </div>
            <span className="font-medium">4.9 rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#9ae600]" />
            <span className="font-medium">No credit card needed</span>
          </div>
        </motion.div>

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
              <div className="w-9 h-9 rounded-xl bg-[#9ae600]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#9ae600]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                  ATS Score
                </p>
                <p className="text-sm font-black text-stone-900 dark:text-stone-100">
                  42 → <span className="text-[#9ae600]">91</span>
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
              <div className="w-2 h-2 rounded-full bg-[#9ae600] animate-pulse" />
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
                <div className="w-3 h-3 rounded-full bg-[#9ae600]/80" />
              </div>
              <div className="flex-1 h-5 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center px-3">
                <span className="text-[10px] font-mono text-stone-400">
                  app.resume.me/analyze
                </span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-[#9ae600] animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-[#9ae600] uppercase tracking-widest">
                  Analysis Complete
                </span>
                <span className="ml-auto text-[10px] text-stone-400 font-mono">
                  0.4s
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Score ring */}
                <div className="col-span-1 flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-3 gap-2">
                  <ATSRing score={91} label="ATS" />
                  <span className="text-[9px] font-bold text-[#9ae600] uppercase tracking-wide">
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
                          className="h-full rounded-full bg-[#9ae600]"
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
              <div className="mt-4 p-3 rounded-xl bg-[#9ae600]/6 dark:bg-[#9ae600]/5 border border-[#9ae600]/15">
                <p className="text-[10px] sm:text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  <span className="font-black text-[#4d7000] dark:text-[#9ae600]">
                    Gemini AI:{" "}
                  </span>
                  Add 3 quantified achievements to Work Experience.
                  Metric-driven bullets increase recruiter engagement by 40%.
                </p>
              </div>
            </div>
          </div>

          {/* Glow */}
          <div className="absolute -bottom-6 left-1/4 right-1/4 h-10 bg-[#9ae600]/15 blur-2xl pointer-events-none rounded-full" />
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
    { value: 50000, suffix: "+", label: "Resumes Analyzed" },
    { value: 94, suffix: "%", label: "ATS Pass Rate" },
    { value: 12000, suffix: "+", label: "Interviews Practiced" },
    { value: 4.9, suffix: "/5", label: "User Rating" },
  ];

  return (
    <section className="bg-white dark:bg-stone-900 border-y border-stone-100 dark:border-stone-800 relative">
      <LightPillar
        topColor="#82B02C"
        bottomColor="#9ae600"
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
              className="text-3xl sm:text-4xl font-black text-[#9ae600] tabular-nums mb-1"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              <Counter to={s.value} suffix={s.suffix} />
            </p>
            <p className="text-xs sm:text-sm font-medium text-stone-400 dark:text-stone-500">
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
      icon: BarChart3,
      title: "ATS Score Analysis",
      description:
        "Instant keyword gap analysis, section ratings, structural feedback, and actionable improvement tips — the same lens ATS machines use.",
      accent: true,
    },
    {
      icon: Brain,
      title: "Gemini AI Engine",
      description:
        "Google Gemini 1.5 Pro understands context, tone, and industry nuance. Not just keyword matching — genuine intelligence.",
    },
    {
      icon: Layout,
      title: "Live Resume Builder",
      description:
        "Dual-panel editor: structured form on the left, live preview canvas on the right. Watch your resume render as you type.",
    },
    {
      icon: Mic,
      title: "Voice Mock Interviews",
      description:
        "VAPI-powered voice sessions generate questions from your resume and target role. The AI speaks first — then you respond, naturally.",
    },
    {
      icon: FileText,
      title: "PDF Import & Export",
      description:
        "Upload any PDF for instant text extraction and analysis. Export your polished resume in high-fidelity PDF format anytime.",
    },
    {
      icon: Shield,
      title: "Secure & Scalable",
      description:
        "Clerk OAuth, Arcjet rate limiting, and enterprise infrastructure. Your data is yours — always encrypted, never shared.",
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
            className="text-[11px] font-black uppercase tracking-[0.15em] text-[#9ae600] mb-4"
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
              <Highlighter action="underline" color="#9ae600">
                <span className="text-primary">complete</span>
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
              From upload to offer letter — ResuMe covers every step of your
              application.
            </motion.p>
          </div>
        </div>

        {/* Feature grid — intentionally asymmetric */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  : "bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-[#9ae600]/30"
              } hover:shadow-lg hover:shadow-stone-900/6 dark:hover:shadow-black/30`}
            >
              {feat.accent && (
                <ShineBorder
                  shineColor={["#9ae600", "#c8f400", "#6aaa00"]}
                  duration={8}
                  borderWidth={1}
                />
              )}
              <div
                className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center ${
                  feat.accent
                    ? "bg-[#9ae600]/15"
                    : "bg-stone-50 dark:bg-stone-800 group-hover:bg-[#9ae600]/10 transition-colors"
                }`}
              >
                <feat.icon
                  className={`w-5 h-5 ${feat.accent ? "text-[#9ae600]" : "text-stone-400 dark:text-stone-500 group-hover:text-[#9ae600] transition-colors"}`}
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
        "Import your existing PDF resume or craft one from scratch with our live editor. Instant extraction, zero friction.",
    },
    {
      num: "02",
      icon: Brain,
      title: "AI Audit",
      description:
        "Gemini AI analyzes every section — identifying ATS gaps, weak impact phrases, missing keywords, and structural issues.",
    },
    {
      num: "03",
      icon: Mic,
      title: "Interview Practice",
      description:
        "Paste the job description, upload your resume, and go live with your AI voice interviewer. Get scored and reviewed.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 sm:py-32 px-5 sm:px-8 bg-white dark:bg-stone-900 relative"
    >
      <LightPillar
        topColor="#82B02C"
        bottomColor="#9ae600"
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
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[11px] font-black uppercase tracking-[0.15em] text-[#9ae600] mb-4"
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
              <Highlighter action="underline" color="#9ae600">
                <span className="text-primary">interview-ready.</span>
              </Highlighter>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-12"
            >
              ResuMe compresses what used to take weeks of prep into a single,
              seamless session.
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
                    <div className="w-12 h-12 rounded-2xl bg-[#9ae600] flex items-center justify-center shadow-md shadow-[#9ae600]/20 flex-shrink-0">
                      <step.icon className="w-5 h-5 text-[#1e3800]" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 mt-3 bg-gradient-to-b from-[#9ae600]/30 to-transparent min-h-[2rem]" />
                    )}
                  </div>
                  <div className="pt-2 pb-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-black text-[#9ae600] tracking-widest">
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
            <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-2xl p-6">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#9ae600]/8 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#9ae600] animate-pulse" />
                    <span className="text-[10px] font-mono font-black text-[#9ae600] uppercase tracking-widest">
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
                          : "bg-[#9ae600]/8 text-stone-200 border border-[#9ae600]/15 ml-5"
                      }`}
                    >
                      <span
                        className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${msg.ai ? "text-stone-600" : "text-[#9ae600]"}`}
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
                    <div className="w-16 h-16 rounded-full bg-[#9ae600] flex items-center justify-center shadow-lg shadow-[#9ae600]/30">
                      <Mic className="w-7 h-7 text-[#1e3800]" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-[#9ae600]/20 animate-ping" />
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
              <div className="w-10 h-10 rounded-xl bg-[#9ae600]/15 flex items-center justify-center">
                <Award className="w-5 h-5 text-[#9ae600]" />
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
            <Highlighter action="underline" color="#9ae600">
              <span className="text-primary">serious</span>
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

        <div className="grid md:grid-cols-2 gap-5">
          {/* Resume Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl p-7 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 overflow-hidden group hover:shadow-lg hover:shadow-stone-900/5 transition-all"
          >
            <ShineBorder
              shineColor={["#9ae600", "#6aaa00", "#c8f400"]}
              duration={7}
              borderWidth={1.5}
            />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#9ae600] flex items-center justify-center shadow-sm shadow-[#9ae600]/30">
                <BarChart3 className="w-5 h-5 text-[#1e3800]" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                  Resume Analysis Engine
                </h3>
                <p className="text-[11px] text-stone-400">
                  Powered by Gemini 1.5 Pro
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
              Upload your PDF and get a complete ATS audit in seconds. Identify
              keyword gaps, weak impact phrases, formatting issues, and
              line-by-line improvement suggestions.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "ATS Scoring",
                "Keyword Gap",
                "Impact Phrases",
                "Format Check",
                "Section Ratings",
                "Industry Match",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#9ae600]/8 text-[#3d6000] dark:text-[#9ae600] border border-[#9ae600]/15"
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
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-[#9ae600]/10 transition-colors">
                <Layout className="w-5 h-5 text-stone-500 dark:text-stone-400 group-hover:text-[#9ae600] transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                  Live Resume Builder
                </h3>
                <p className="text-[11px] text-stone-400">
                  Two-column real-time editor
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
              Structured form left, live canvas right. Type your details and
              watch your polished resume render instantly. Then pass it straight
              to AI for analysis.
            </p>
            <div className="space-y-2.5">
              {[
                "Personal details & professional summary",
                "Work experience with bullet points",
                "Education, skills & projects sections",
                "Drag-and-drop section reordering",
                "High-fidelity PDF export",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9ae600] flex-shrink-0 mt-0.5" />
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
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#9ae600]/6 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9ae600]/4 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 p-7 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#9ae600]/10 border border-[#9ae600]/15 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-[#9ae600]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-100 text-base">
                      Voice Mock Interview
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Powered by VAPI Voice AI
                    </p>
                  </div>
                </div>
                <p className="text-sm text-stone-400 leading-relaxed mb-5">
                  Paste the job description, upload your resume, and the AI
                  generates 5 custom questions. Speak naturally — get a full
                  session transcript and performance breakdown instantly after.
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
                  <span className="text-[10px] font-mono font-black text-[#9ae600] uppercase tracking-widest">
                    Session Results
                  </span>
                  <span className="text-[10px] text-stone-600 font-mono">
                    12 min
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
                        className="h-full rounded-full bg-[#9ae600]"
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

// ── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      quote:
        "Landed my dream role at a FAANG company after two weeks. The ATS analysis was surgical.",
      name: "Alicia Chen",
      role: "Software Engineer @ Google",
      stars: 5,
    },
    {
      quote:
        "The mock interview AI asked harder questions than my real interview. I was genuinely prepared.",
      name: "Marcus Rivera",
      role: "Product Manager @ Stripe",
      stars: 5,
    },
    {
      quote:
        "My resume score went from 42 to 91 in one session. The suggestions were specific and real.",
      name: "Priya Nair",
      role: "Data Scientist @ Shopify",
      stars: 5,
    },
    {
      quote:
        "The live builder is so clean. Built my entire resume in under 20 minutes. Looks completely professional.",
      name: "Jake Thompson",
      role: "UX Designer @ Figma",
      stars: 5,
    },
    {
      quote:
        "Finally an AI tool that gets what recruiters actually want. Not fluff — real, actionable insights.",
      name: "Sofia Morales",
      role: "Marketing Lead @ HubSpot",
      stars: 5,
    },
    {
      quote:
        "After 3 sessions with ResuMe, I aced my actual interview without breaking a sweat.",
      name: "Daniel Kim",
      role: "Backend Engineer @ Vercel",
      stars: 5,
    },
  ];

  return (
    <section
      id="reviews"
      className="py-24 sm:py-32 px-5 sm:px-8 bg-white dark:bg-stone-900 relative"
    >
      <LightPillar
        topColor="#82B02C"
        bottomColor="#9ae600"
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
            className="text-[11px] font-black uppercase tracking-[0.15em] text-[#9ae600] mb-4"
          >
            Real results
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 relative"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <Highlighter action="underline" color="#9ae600">
              <span className="text-primary">Loved</span>
            </Highlighter>{" "}
            by job seekers worldwide.
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
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
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.stars }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-3.5 h-3.5 fill-[#9ae600] text-[#9ae600]"
                  />
                ))}
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5 italic">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9ae600]/60 to-[#6aaa00]/40 flex items-center justify-center text-[11px] font-black text-[#1e3800]">
                  {r.name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {r.name}
                  </p>
                  <p className="text-[10px] text-stone-400">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function Pricing() {
  const free = [
    "3 resume analyses / month",
    "1 resume in the builder",
    "2 mock interview sessions",
    "Basic ATS scoring",
  ];
  const pro = [
    "Unlimited resume analyses",
    "Unlimited resume builder",
    "Unlimited mock interviews",
    "Advanced ATS scoring",
    "Priority AI processing",
    "Saved interview history",
    "PDF export & import",
  ];

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
            className="text-[11px] font-black uppercase tracking-[0.15em] text-[#9ae600] mb-4"
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
            <Highlighter action="underline" color="#9ae600">
              <span className="text-primary">Upgrade</span>
            </Highlighter>{" "}
            anytime.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-7 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 mb-3">
              Free
            </p>
            <div className="flex items-baseline gap-1 mb-6">
              <span
                className="text-4xl font-black text-stone-900 dark:text-stone-100"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                $0
              </span>
              <span className="text-stone-400 text-sm">/month</span>
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
              href="/sign-up"
              className="block w-full py-3 text-center rounded-xl text-sm font-bold border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Get started free
            </Link>
          </motion.div>

          {/* Pro */}
          <ElectricBorder
            color="#9ae600"
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
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-[#9ae600] text-[#1e3800] uppercase tracking-wider">
                  Popular
                </span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#9ae600] mb-3">
                Pro
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className="text-4xl font-black dark:text-stone-100 text-stone-900"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  $12
                </span>
                <span className="text-stone-500 text-sm">/month</span>
              </div>
              <div className="space-y-3 mb-7">
                {pro.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#9ae600] flex-shrink-0" />
                    <span className="text-sm text-stone-400">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/sign-up?plan=pro"
                className="block w-full py-3 text-center rounded-xl text-sm font-black bg-[#9ae600] text-[#1e3800] hover:bg-[#a8f000] transition-colors shadow-lg shadow-[#9ae600]/20"
              >
                Start Pro free trial
              </Link>
            </motion.div>
          </ElectricBorder>
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-16 sm:py-24 px-5 sm:px-8 bg-stone-100/50 dark:bg-stone-900/30 relative">
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

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden bg-stone-950 dark:bg-black border border-stone-800 p-10 sm:p-16 text-center"
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#9ae600]/10 blur-3xl pointer-events-none" />
          <GridDots />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#9ae600]/10 border border-[#9ae600]/20 text-[#9ae600] text-[10px] font-black uppercase tracking-[0.15em] mb-6">
              <Zap className="w-3 h-3" />
              Ready in 30 seconds
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-50 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Ready to land your dream job?
            </h2>
            <p className="text-stone-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              Join 50,000+ professionals who used ResuMe to craft perfect
              resumes and ace their interviews.
            </p>
            <MagneticButton
              href="/resumes/analyze"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-black bg-[#9ae600] text-[#1e3800] hover:bg-[#a8f000] transition-all duration-200 shadow-xl shadow-[#9ae600]/25 hover:shadow-2xl hover:shadow-[#9ae600]/35 hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Analyze My Resume — Free
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <p className="text-stone-600 text-xs mt-4">
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
                Resu<span className="text-[#9ae600]">Me</span>
              </span>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed">
              AI-powered resume analysis, building, and mock interview practice
              — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            {[
              {
                heading: "Product",
                links: ["Features", "Pricing", "Changelog"],
                hrefs: ["#features", "#pricing", "/changelog"],
              },
              {
                heading: "Resources",
                links: ["Blog", "Docs", "Support"],
                hrefs: ["/blog", "/docs", "/support"],
              },
              {
                heading: "Company",
                links: ["About", "Privacy", "Terms"],
                hrefs: ["/about", "/privacy", "/terms"],
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
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} ResuMe. All rights reserved.
          </p>
          <p className="text-xs text-stone-400">
            Built with Gemini AI &amp; VAPI Voice
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page Entry ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen relative bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-x-hidden">
      <HomeNavbar />
      <Hero />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <Capabilities />
      <Testimonials />
      <Pricing />
      <CTABanner />
      <Footer />
    </div>
  );
}
