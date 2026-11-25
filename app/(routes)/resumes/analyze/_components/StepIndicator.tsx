import React from "react";
import { UploadCloud, BrainCogIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ViewStep } from "../page";

const StepIndicator = ({ currentStep }: { currentStep: ViewStep }) => {
  const steps = [
    { id: "upload", label: "Upload & Read", icon: UploadCloud },
    { id: "analysis", label: "AI Results", icon: BrainCogIcon },
  ];

  return (
    <div className="flex items-center gap-3 shrink-0">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                currentStep === step.id
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : steps.findIndex((s) => s.id === currentStep) > index
                    ? "border-primary bg-primary/20 text-brand-strong dark:text-brand"
                    : "border-muted text-muted-foreground",
              )}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <span
              className={cn(
                "text-xs font-bold tracking-tight hidden md:block",
                currentStep === step.id
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="h-[2px] w-10 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: currentStep === "analysis" ? "100%" : "0%" }}
                className="h-full bg-primary"
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
