"use client";

import React from "react";
import { motion } from "framer-motion";

interface CinematicGridProps {
  title?: string;
  description?: string;
  accentColor?: string;
}

const features = [
  {
    label: "Phase 01 — Document Ingestion",
    heading: "Automated Core Parsing",
    sub: "Drop in your legacy PDF file. Our custom parsing architecture extracts raw textual layout nodes instantly, initializing your secure workspace profile.",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop", // 🖼️ Screenshot Target: /resumes/analyze upload dropzone
  },
  {
    label: "Phase 02 — Performance Audit",
    heading: "Matrix Score Optimization",
    sub: "Receive an immediate, critical diagnostic check. Our internal engine identifies keyword alignment gaps and quantifies structural ATS compliance traits.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop", // 🖼️ Screenshot Target: /resumes/analyze dashboard score rings
  },
  {
    label: "Phase 03 — Canvas Studio",
    heading: "Hierarchical Restructuring",
    sub: "Take absolute control over your document order sequence list. Reorder entire project logs, skill boxes, and history blocks with native drag-and-drop mechanics.",
    img: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1200&auto=format&fit=crop", // 🖼️ Screenshot Target: Drag & Drop vertical grid reordering
  },
  {
    label: "Phase 04 — Interactive Simulation",
    heading: "Conversational Spoken Practice",
    sub: "Launch low-latency, real-time voice evaluation environments tailored explicitly to your target role path. Speak to an automated interviewer that tests technical depth.",
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop", // 🖼️ Screenshot Target: /interviews live voice orb page
  },
  {
    label: "Phase 05 — Diagnostic Report",
    heading: "Performance Evaluation Summary",
    sub: "End your audio session to trigger an immediate audit breakdown. Review full conversation transcripts, key communication grades, and actionable category tips.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop", // 🖼️ Screenshot Target: /interviews/results assessment metrics view
  },
];

const CinematicGrid: React.FC<CinematicGridProps> = ({
  title = "Your path to a precision-engineered application.",
  description = "No complex configuration or hidden layers. Transition from a raw document to active conversational interview practice in three clear intervals.",
  accentColor = "#82B02C", // 🚀 Default aligned with your branding color palette
}) => {
  return (
    <div className="py-24 px-4 md:px-12 font-sans bg-stone-50/50 dark:bg-stone-950/50 rounded-[30px] w-full relative z-10">
      {/* Section header */}
      <div className="max-w-5xl mx-auto mb-24 text-center space-y-4">
        <p
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          Seamless Execution Loop
        </p>
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
          {title}
        </h2>
        <p className="text-neutral-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Stacked Sticky Scroll Track */}
      <div className="max-w-5xl mx-auto space-y-24">
        {features.map((feat, i) => (
          <div
            key={i}
            className="sticky top-28 min-h-[60vh] flex items-center justify-center py-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              whileInView={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ margin: "-5% 0px -5% 0px" }}
              className="relative w-full h-[460px] rounded-[32px] overflow-hidden bg-neutral-950 border border-white/5 shadow-2xl group"
            >
              {/* Media Container Layer */}
              <div className="absolute inset-0">
                <img
                  src={feat.img}
                  className="w-full h-full object-cover opacity-30 group-hover:scale-[1.03] transition-transform duration-1000"
                  alt=""
                />
                {/* 🚀 CSS Noise Film Grain Post-Processing Overlay */}
                <div className="absolute inset-0 mix-blend-overlay bg-[url('/noise.png')] opacity-[0.35] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>

              {/* Text Meta Content Details */}
              <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end z-10 space-y-3">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit backdrop-blur-md"
                  style={{
                    backgroundColor: accentColor + "15",
                    color: accentColor,
                    border: `1px solid ${accentColor}25`,
                  }}
                >
                  {feat.label}
                </span>
                <h3 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none">
                  {feat.heading}
                </h3>
                <p className="text-sm md:text-base text-neutral-400 max-w-xl font-medium leading-relaxed">
                  {feat.sub}
                </p>
              </div>

              {/* Dynamic Number Index Tracker */}
              <div className="absolute top-8 right-8 font-mono text-xs font-black text-white/20 select-none">
                0{i + 1} / 0{features.length}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CinematicGrid;
