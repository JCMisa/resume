/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { ThemeToggler } from "@/components/custom/ThemeToggler";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Form Components
import ResumeLivePreview from "./_components/ResumeLivePreview";
import PersonalForm from "./_components/PersonalForm";
import SummaryForm from "./_components/SummaryForm";
import SkillsForm from "./_components/SkillsForm";
import ExperienceForm from "./_components/ExperienceForm";
import ProjectsForm from "./_components/ProjectsForm";
import EducationForm from "./_components/EducationForm";
import CertificatesForm from "./_components/CertificatesForm";
import { createManualResumeAction } from "@/lib/actions/resume";

export type FormSections =
  | "personal"
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certificates";

export default function CreateResumePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<FormSections>("personal");
  const [isFinalPreview, setIsFinalPreview] = useState(false);
  const [resumeTitle, setResumeTitle] = useState("Untitled Resume Workspace");
  const [isSaving, setIsSaving] = useState(false); // Track server actions locks

  // Multi-Form State Bucket Values
  const [resumeState, setResumeState] = useState({
    personalDetails: {
      name: "",
      phone: "",
      email: "",
      address: "",
      links: [] as any[],
    },
    professionalSummary: "",
    skills: [] as any[],
    experiences: [] as any[],
    projects: [] as any[],
    educations: [] as any[],
    certificates: [] as any[],
    sectionOrder: [
      "personal",
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certificates",
    ],
  });

  const sectionFlow: FormSections[] = [
    "personal",
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certificates",
  ];

  const updateState = (sectionKey: keyof typeof resumeState, data: any) => {
    setResumeState((prev) => ({ ...prev, [sectionKey]: data }));
  };

  const handleNext = () => {
    const currentIndex = sectionFlow.indexOf(activeSection);
    if (currentIndex < sectionFlow.length - 1) {
      setActiveSection(sectionFlow[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const currentIndex = sectionFlow.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(sectionFlow[currentIndex - 1]);
    }
  };

  // 🛠️ COMPLETED: Seamless database compilation and action flow routing logic
  const handleFinishSavePipeline = async () => {
    if (isSaving) return;

    setIsSaving(true);
    const toastId = toast.loading(
      "Compiling portfolio metadata and generating secure data frames...",
    );

    try {
      const response = await createManualResumeAction({
        title: resumeTitle,
        category: "General", // Default classification tag mapping value
        content: resumeState,
      });

      if (response.success && response.data) {
        toast.success("Resume asset saved safely to your collection!", {
          id: toastId,
        });

        // Immediate redirect to our newly adjusted polymorphic dynamic details workspace page!
        router.push(`/resumes/${response.data.id}`);
      } else {
        throw new Error(response.error || "Storage pipeline rejection.");
      }
    } catch (error: any) {
      console.error("Save execution error:", error);
      toast.error(error.message || "Failed to complete cataloging steps.", {
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      {/* GLOBAL WORKSPACE NAV BAR */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <div className="h-7 w-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                <Search className="h-4 w-4" />
              </div>
              <span>ResuMe Studio</span>
            </div>
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="bg-muted/40 px-3 py-1.5 rounded-xl border border-transparent hover:border-border focus:border-primary text-sm font-bold transition-all focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFinalPreview(!isFinalPreview)}
              className="rounded-xl font-bold gap-1.5 text-xs hidden md:flex"
            >
              <Eye className="h-4 w-4" />
              {isFinalPreview ? "Edit Mode" : "Final Clear View"}
            </Button>
            <ThemeToggler />
          </div>
        </div>
      </nav>

      {/* CORE TWO COLUMN BUILDER WORKSPACE SCREEN */}
      <div className="flex-grow max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-8 items-start">
        {/* LEFT COLUMN PANEL: STEP FORM ENTRY (5 Spans) */}
        <div className="lg:col-span-5 border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl flex flex-col min-h-[650px] overflow-hidden sticky top-24">
          {/* Quick Header Mini Step Indicator Tabs bar */}
          <div className="border-b bg-muted/20 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              Section: {activeSection}
            </span>
            <span className="text-xs font-mono font-bold opacity-60">
              Step {sectionFlow.indexOf(activeSection) + 1} of{" "}
              {sectionFlow.length}
            </span>
          </div>

          {/* DYNAMIC COMPONENT CONDITIONAL FORM INJECTION BOUNDARY */}
          <div className="flex-grow p-6 overflow-y-auto max-h-[500px]">
            {activeSection === "personal" && (
              <PersonalForm
                data={resumeState.personalDetails}
                onChange={(val) => updateState("personalDetails", val)}
              />
            )}
            {activeSection === "summary" && (
              <SummaryForm
                data={resumeState.professionalSummary}
                onChange={(val) => updateState("professionalSummary", val)}
              />
            )}
            {activeSection === "skills" && (
              <SkillsForm
                data={resumeState.skills}
                onChange={(val) => updateState("skills", val)}
              />
            )}
            {activeSection === "experience" && (
              <ExperienceForm
                data={resumeState.experiences}
                onChange={(val) => updateState("experiences", val)}
              />
            )}
            {activeSection === "projects" && (
              <ProjectsForm
                data={resumeState.projects}
                onChange={(val) => updateState("projects", val)}
              />
            )}
            {activeSection === "education" && (
              <EducationForm
                data={resumeState.educations}
                onChange={(val) => updateState("educations", val)}
              />
            )}
            {activeSection === "certificates" && (
              <CertificatesForm
                data={resumeState.certificates}
                onChange={(val) => updateState("certificates", val)}
              />
            )}
          </div>

          {/* ACTION BUTTON CONTROL PANEL FOUNTAIN CONTAINER */}
          <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-4 mt-auto">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={sectionFlow.indexOf(activeSection) === 0 || isSaving}
              className="rounded-xl font-bold text-xs gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {sectionFlow.indexOf(activeSection) === sectionFlow.length - 1 ? (
              <Button
                onClick={handleFinishSavePipeline}
                disabled={isSaving}
                className="rounded-xl font-black text-xs gap-1 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finish & Create
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="rounded-xl font-bold text-xs gap-1"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN PANEL: VIRTUAL RESUME PREVIEW MATRIX SCREEN (7 Spans) */}
        <div className="lg:col-span-7 bg-stone-50 dark:bg-stone-950 p-4 lg:p-8 rounded-3xl border shadow-inner min-h-[850px]">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground px-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Document Rendering Preview Engine
            </span>
          </div>

          {/* Live Document Preview Workspace Panel Component */}
          <ResumeLivePreview
            data={resumeState}
            isFinalPreview={isFinalPreview}
            onOrderChange={(newSectionOrder) =>
              updateState("sectionOrder", newSectionOrder)
            }
          />
        </div>
      </div>
    </div>
  );
}
