import SliderPage from "@/components/ui-lora/SliderPage";
import { SparklesIcon } from "lucide-react";
import React from "react";

const Features = () => {
  return (
    <section className="overflow-hidden w-[calc(100vw-40px)] mx-[20px] space-y-10 py-12 ">
      {/* Proprietary Heading Layer */}
      <div className="text-center max-w-2xl mx-auto space-y-3 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
          <SparklesIcon className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Engineered Workspace Core
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 dark:text-stone-50">
          Platform Feature Breakdown
        </h2>
        <p className="text-sm text-muted-foreground font-medium max-w-lg mx-auto">
          Take a look at the core interfaces designed to optimize your
          application process from layout building to voice simulation.
        </p>
      </div>

      {/* 🚀 Your untouched WebGL Fluid Shader Grid Canvas */}
      <div className="rounded-[30px] overflow-hidden border border-stone-200/40 dark:border-stone-800/40 shadow-2xl">
        <SliderPage />
      </div>
    </section>
  );
};

export default Features;
