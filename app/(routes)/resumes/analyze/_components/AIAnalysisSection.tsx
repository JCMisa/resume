/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Sparkles,
  Search,
  Layout,
  ArrowRightIcon,
  BrainCogIcon,
  TargetIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { Resume } from "@/config/schema";

const AIAnalysisSection = ({
  data,
  onBack,
  ...props
}: {
  data: Resume | null;
  onBack: () => void;
  [key: string]: any;
}) => {
  const router = useRouter();

  const analysis = data?.analysis || {
    overallScore: 0,
    readability: "Pending",
    keyKeywords: [],
    summary: "No evaluation parsed.",
    strengths: [],
    weaknesses: [],
    improvements: [],
    gapsDetected: [],
  };

  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-10"
    >
      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Job Match Score",
            value: `${analysis.overallScore}%`,
            icon: TargetIcon,
            color: "text-primary",
          },
          {
            label: "Key Industry Words",
            value: `${analysis.keyKeywords.length} found`,
            icon: Search,
            color: "text-blue-500",
          },
          {
            label: "Readability Check",
            value: analysis.readability,
            icon: ShieldCheckIcon,
            color: "text-emerald-500",
          },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl border bg-card/50 backdrop-blur-sm shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-xl bg-muted", metric.color)}>
                <metric.icon className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tabular-nums">
                {metric.value}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {metric.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN FEEDBACK BOX */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-8 p-8 rounded-3xl border bg-card/50 backdrop-blur-sm shadow-xl space-y-8"
        >
          <div className="flex items-center gap-3">
            <BrainCogIcon className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">
              AI Resume Feedback
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold tracking-widest text-primary uppercase">
                Overall Summary
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* STRENGTHS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-widest text-primary uppercase">
                Your Core Strengths Detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.strengths.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* CAREER GAPS / CONCERNS AREA */}
            {analysis.gapsDetected.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4" /> Warnings / Timeline
                  Gaps
                </h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {analysis.gapsDetected.map((gap: string, idx: number) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>

        {/* SIDE ACTIONS */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="p-8 rounded-3xl border bg-stone-50 dark:bg-stone-950 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Build Your Career Story
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                  Let AI help you craft a standout resume that highlights your
                  skills and gets noticed by recruiters and hiring platforms.
                </p>
              </div>
              <Button
                onClick={() => router.push("/resumes/create")}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors font-bold py-6 rounded-2xl"
              >
                Start Creating Your Resume
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-3xl border bg-card/50 backdrop-blur-sm space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Layout className="h-4 w-4 text-primary" />
              Industry Suggestions
            </h4>
            <ScrollArea className="h-[180px] pr-3">
              <div className="space-y-2">
                {analysis.improvements
                  .slice(0, 3)
                  .map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-muted/50 text-xs space-y-1"
                    >
                      <p className="font-bold text-primary uppercase text-[10px]">
                        {item.section}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="line-through">{item.current}</span> -{" "}
                        <span className="font-semibold text-foreground">
                          {item.suggested}
                        </span>
                      </p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          <Button
            variant="outline"
            onClick={onBack}
            className="w-full rounded-2xl py-6 border-muted-foreground/20 hover:bg-muted"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Scan a Different File
          </Button>

          <Button
            variant="default"
            onClick={() => router.push("/resumes")}
            className="w-full rounded-2xl py-6 text-white"
          >
            Proceed to Resumes
            <ArrowRightIcon className="h-5 w-5 mr-2" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AIAnalysisSection;
