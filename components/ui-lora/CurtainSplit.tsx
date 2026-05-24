"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface CurtainSplitProps {
  accentColor?: string;
  title?: React.ReactNode;
  description?: string;
  sublabel?: string;
  backgroundContent?: React.ReactNode; // 🚀 Replaced static image string with a dynamic node slot!
}

export const CurtainSplit = ({
  accentColor = "#e879f9",
  title = (
    <>
      Contextual
      <br />
      Creation
    </>
  ),
  description = "System intent mapping.",
  sublabel = "Core Engine",
  backgroundContent, // 🚀 This will receive your <LightPillar /> instance
}: CurtainSplitProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Smooth splitting values to slide the green pillar background apart symmetrically
  const leftX = useTransform(scrollYProgress, [0, 0.75], ["0%", "-102%"]);
  const rightX = useTransform(scrollYProgress, [0, 0.75], ["0%", "102%"]);

  const contentOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.5, 0.8, 1],
    [0, 1, 1, 0],
  );
  const contentY = useTransform(scrollYProgress, [0.28, 0.55], [20, 0]);
  const seamOpacity = useTransform(scrollYProgress, [0, 0.08, 0.45], [1, 1, 0]);

  return (
    <div
      ref={containerRef}
      className="relative h-[100vh] bg-stone-950 transition-colors duration-500"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Central Core: Revealed Text Content */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="absolute inset-0 flex flex-col items-center justify-center z-0 text-center px-6 md:px-8"
        >
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div
              className="h-px w-6 md:w-10"
              style={{ backgroundColor: `${accentColor}50` }}
            />
            <span
              className="text-[8px] md:text-[10px] font-mono tracking-[0.4em] uppercase font-bold"
              style={{ color: accentColor }}
            >
              {sublabel}
            </span>
            <div
              className="h-px w-6 md:w-10"
              style={{ backgroundColor: `${accentColor}50` }}
            />
          </div>

          <h2
            className="font-black leading-[0.93] tracking-[-0.04em] text-stone-50 mb-6 md:mb-8 italic uppercase"
            style={{ fontSize: "clamp(2.5rem, 12vw, 6rem)" }}
          >
            {title}
          </h2>

          <p className="text-stone-400 text-xs md:text-sm font-bold max-w-[280px] md:max-w-sm leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* 🎬 Left Curtain Panel */}
        <motion.div
          style={{ x: leftX }}
          className="absolute top-0 left-0 w-[50%] h-full z-10 overflow-hidden border-r border-stone-800/10"
        >
          <div className="absolute top-0 left-0 w-[200%] h-full">
            {backgroundContent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-stone-950/40" />
        </motion.div>

        {/* 🎬 Right Curtain Panel */}
        <motion.div
          style={{ x: rightX }}
          className="absolute top-0 right-0 w-[50%] h-full z-10 overflow-hidden border-left border-stone-800/10"
        >
          <div className="absolute top-0 right-0 w-[200%] h-full mr-[-100%]">
            {backgroundContent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-stone-950/40" />
        </motion.div>

        {/* Subtle center split line marker */}
        <motion.div
          style={{ opacity: seamOpacity }}
          className="absolute top-0 bottom-0 left-1/2 w-[1px] z-20 bg-stone-500/10"
        />
      </div>
    </div>
  );
};
