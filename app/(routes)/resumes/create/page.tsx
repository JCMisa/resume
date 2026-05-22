/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  LayoutGrid,
  DownloadIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PDFDownloadLink } from "@react-pdf/renderer";

// Form Components
import ResumeLivePreview from "./_components/ResumeLivePreview";
import PersonalForm from "./_components/PersonalForm";
import SummaryForm from "./_components/SummaryForm";
import SkillsForm from "./_components/SkillsForm";
import ExperienceForm from "./_components/ExperienceForm";
import ProjectsForm from "./_components/ProjectsForm";
import EducationForm from "./_components/EducationForm";
import CertificatesForm from "./_components/CertificatesForm";
import ResumePDFTemplate from "./_components/ResumePDFTemplate";
import { createManualResumeAction } from "@/lib/actions/resume";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const resumePrintRef = useRef<HTMLDivElement>(null);

  const [activeSection, setActiveSection] = useState<FormSections>("personal");
  const [isFinalPreview, setIsFinalPreview] = useState(false);
  const [resumeTitle, setResumeTitle] = useState("Untitled Resume Workspace");
  const [resumeCategory, setResumeCategory] = useState("General");
  const [isSaving, setIsSaving] = useState(false);

  // Dialog Visibility states
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  // Final confirmation save to Neon DB
  const handleFinishSavePipeline = async () => {
    setIsConfirmOpen(false); // Shut confirmation modal
    if (isSaving) return;

    setIsSaving(true);
    const toastId = toast.loading(
      "Compiling portfolio metadata and generating secure data frames...",
    );

    try {
      const response = await createManualResumeAction({
        title: resumeTitle,
        category: resumeCategory,
        content: resumeState,
      });

      if (response.success && response.data) {
        toast.success("Resume asset saved safely to your collection!", {
          id: toastId,
        });
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden max-w-[1400px] mx-auto overflow-y-auto no-scrollbar flex flex-col">
      {/* GLOBAL WORKSPACE NAV BAR */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 w-[calc(100%-20px)]">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="bg-muted/40 px-3 py-1.5 rounded-xl border border-transparent hover:border-border focus:border-primary text-sm font-bold transition-all focus:outline-none"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFinalPreview(!isFinalPreview)}
            className="rounded-xl font-bold gap-1.5 text-xs hidden md:flex"
          >
            <Eye className="h-4 w-4" />
            {isFinalPreview ? "Edit Mode" : "Final Clear View"}
          </Button>
        </div>
      </nav>

      {/* CORE TWO COLUMN BUILDER WORKSPACE SCREEN */}
      <div className="flex-grow w-full  grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-8 items-start">
        {/* LEFT PANEL FORM */}
        <div className="lg:col-span-5 border bg-card/40 backdrop-blur-sm rounded-3xl shadow-xl flex flex-col min-h-[650px] overflow-hidden sticky top-24">
          <div className="border-b bg-muted/20 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              Section: {activeSection}
            </span>
            <span className="text-xs font-mono font-bold opacity-60">
              Step {sectionFlow.indexOf(activeSection) + 1} of{" "}
              {sectionFlow.length}
            </span>
          </div>

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

          {/* ACTION CONTROL BUTTON PANELS */}
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
              <div className="flex items-center gap-2">
                {/* 1. DOWNLOAD CONSOLE DIALOG */}
                <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={isSaving}
                      variant="outline"
                      className="rounded-xl font-black text-xs gap-1 shadow-sm"
                    >
                      <DownloadIcon className="h-4 w-4 text-primary" />
                      Download
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Download Your Resume</DialogTitle>
                      <DialogDescription>
                        Give your resume a custom name and category before
                        downloading the PDF version to your device.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <FieldGroup>
                        <Field>
                          <Label>Title</Label>
                          <Input
                            name="title"
                            value={resumeTitle}
                            onChange={(e) => setResumeTitle(e.target.value)}
                          />
                        </Field>
                        <Field>
                          <Label>Category</Label>
                          <Input
                            name="category"
                            value={resumeCategory}
                            onChange={(e) => setResumeCategory(e.target.value)}
                          />
                        </Field>
                      </FieldGroup>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>

                      {/* 🚀 THE FREE HIGH-FIDELITY SOLUTION BUTTON */}
                      <PDFDownloadLink
                        document={<ResumePDFTemplate data={resumeState} />}
                        fileName={`${resumeTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`}
                      >
                        {({ loading }) => (
                          <Button
                            disabled={loading}
                            onClick={() =>
                              setTimeout(() => setIsDownloadOpen(false), 1000)
                            }
                            className="w-full sm:w-auto"
                          >
                            {loading
                              ? "Compiling Vector PDF..."
                              : "Download PDF"}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 2. INTERCEPTING CONFIRMATION DIALOG (FINISH & CREATE) */}
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={isSaving}
                      className="rounded-xl font-black text-xs gap-1 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Finish & Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader className="flex flex-col items-center text-center space-y-2">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 mb-1 animate-pulse">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <DialogTitle className="text-xl font-bold tracking-tight">
                        Did you download your resume first?
                      </DialogTitle>
                      <DialogDescription className="max-w-xs leading-relaxed text-xs">
                        Finishing this step will compile your template
                        configuration and finalize storage setups in your
                        personal dashboard workspace.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setIsConfirmOpen(false); // Close this warning
                          setIsDownloadOpen(true); // Fire open the download sheet!
                        }}
                        className="rounded-xl font-bold text-xs gap-1.5 w-full py-4 border"
                      >
                        <DownloadIcon className="h-3.5 w-3.5 text-primary" />
                        Download PDF Now
                      </Button>
                      <Button
                        type="button"
                        onClick={handleFinishSavePipeline}
                        className="rounded-xl font-black text-xs bg-primary py-4 text-primary-foreground w-full shadow-md"
                      >
                        Yes, Save & Exit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="rounded-xl font-bold text-xs gap-1 text-primary-foreground"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN PANEL: LIVE PREVIEW ENGINE */}
        <div className="lg:col-span-7 bg-stone-50 dark:bg-stone-950 p-4 lg:p-8 rounded-3xl border shadow-inner min-h-[850px]">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground px-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Document Rendering Preview Engine
            </span>
          </div>

          <div ref={resumePrintRef} className="print:p-0 bg-transparent w-full">
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
    </div>
  );
}
