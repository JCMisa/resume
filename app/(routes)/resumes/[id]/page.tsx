/* eslint-disable @typescript-eslint/no-explicit-any */

import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RichBlocks, RichInline } from "@/components/resume-templates/RichText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Brain,
  FileText,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  Award,
  Globe,
  Code,
  FolderGit2,
  Target,
  FilePen,
  Copy,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { getResumeDetailsAction } from "@/lib/actions/resume";
import ResumeFileViewer from "../_components/ResumeFileViewer";
import AnalyzeResumeButton from "../_components/AnalyzeResumeButton";
import ResumeFileUploader from "../_components/ResumeFileUploader";
import AnalysisReport from "../_components/report/AnalysisReport";
import JobMatchPanel from "../_components/job-match/JobMatchPanel";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = ["analysis", "match", "content"] as const;

// Strictly map types according to our updated JSONB column definition
interface ResumeContent {
  personalDetails?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    links?: { label: string; url: string }[];
  };
  professionalSummary?: string;
  skills?: { id: string; category: string; value: string }[];
  experiences?: {
    id: string;
    company: string;
    role: string;
    duration: string;
    bullets: string[];
  }[];
  projects?: {
    id: string;
    title: string;
    duration: string;
    description: string[];
    links?: { label: string; url: string }[];
  }[];
  educations?: {
    id: string;
    schoolName: string;
    course: string;
    major?: string;
    duration: string;
    gwa?: string;
  }[];
  certificates?: {
    id: string;
    title: string;
    issuedDate: string;
    expirationDate?: string;
    description?: string;
    links?: { label: string; url: string }[];
  }[];
  sectionOrder?: string[];
  customSections?: { id: string; title: string; body: string }[];
}


export default async function ResumeDetailsPage({ params, searchParams }: PageProps) {
  const { id: resumeId } = await params;
  // ?tab=match opens the Job match tab (e.g. from "Tailor for a job")
  const { tab } = await searchParams;
  const initialTab = TABS.find((t) => t === tab) ?? "analysis";
  const result = await getResumeDetailsAction(resumeId);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Resume Profile Not Found</h2>
        <p className="text-muted-foreground max-w-sm">
          This document could not be located or you do not have permission to
          view it.
        </p>
        <Button asChild rounded-2xl>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const title = result.data.title;
  const builtInEditor = result.data.status === "created";
  const category = result.data.category;
  const fileUrl = result.data.fileUrl || null;

  // Extract typecast fields with explicit array fallbacks
  const content = (result.data.content as ResumeContent) || {};
  const analysis = result.data.analysis ?? null;

  const personalDetails = content.personalDetails || {};
  const personalLinks = personalDetails.links || [];
  const skills = content.skills || [];
  const experiences = content.experiences || [];
  const projects = content.projects || [];
  const educations = content.educations || [];
  const certificates = content.certificates || [];

  // Group manual skills matching the exact grouping helper inside our creator preview engine
  const groupedSkills = skills.reduce((acc: Record<string, string[]>, curr) => {
    if (!curr.category || !curr.value) return acc;
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr.value);
    return acc;
  }, {});

  return (
    <div className="min-h-screen w-full bg-background p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <Link
            href="/resumes"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-1"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Resumes
          </Link>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center text-xs font-bold px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
              {category}
            </span>
            {/* Built resumes open in the editor; uploads are edited as a copy */}
            <Link
              href={builtInEditor ? `/resumes/${resumeId}/edit` : `/resumes/create?from=${resumeId}`}
              className={cn(buttonVariants({ size: "sm", variant: builtInEditor ? "default" : "outline" }), "rounded-lg gap-1.5 h-7")}
            >
              {builtInEditor ? <FilePen className="size-3.5" /> : <Copy className="size-3.5" />}
              {builtInEditor ? "Edit resume" : "Edit a copy"}
            </Link>
            {builtInEditor && (
              <Link
                href={`/resumes/${resumeId}/share`}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg gap-1.5 h-7")}
              >
                <Share2 className="size-3.5" /> Download & share
              </Link>
            )}
          </div>
        </div>

        {analysis?.overallScore && (
          <div className="bg-card border rounded-2xl p-4 flex items-center gap-4 shadow-sm shrink-0">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                AI Score Rating
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">
                  {analysis.overallScore}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <Progress
              value={analysis.overallScore}
              className="w-20 h-2 bg-primary/10"
            />
          </div>
        )}
      </div>

      {/* CORE WORKSPACE SPLIT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: ATTACHED EMBEDPDF BACKUP VIEWER */}
        <div className="xl:col-span-5 lg:sticky lg:top-24">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Original Document Archive
          </h3>

          <ResumeFileViewer url={fileUrl} />

          <ResumeFileUploader resumeId={resumeId} />
          <AnalyzeResumeButton resumeId={resumeId} />
          {analysis && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Re-analyzing uses one AI analysis from your plan.
            </p>
          )}
        </div>

        {/* RIGHT COLUMN: AI AUDIT AND PARSED SCHEMA TABS */}
        <div className="xl:col-span-7 w-full">
          <Tabs defaultValue={initialTab} className="w-full space-y-6">
            <TabsList className="grid w-full max-w-xl grid-cols-3 !p-1 bg-muted !rounded-2xl !h-12">
              <TabsTrigger
                value="analysis"
                className="!rounded-xl !font-bold !text-xs sm:!text-sm !gap-2 min-w-0"
              >
                <Brain className="h-4 w-4 shrink-0" />
                <span className="truncate">AI Report</span>
              </TabsTrigger>
              <TabsTrigger
                value="match"
                className="!rounded-xl !font-bold !text-xs sm:!text-sm !gap-2 min-w-0"
              >
                <Target className="h-4 w-4 shrink-0" />
                <span className="truncate">Job match</span>
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="!rounded-xl !font-bold !text-xs sm:!text-sm !gap-2 min-w-0"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Content</span>
              </TabsTrigger>
            </TabsList>

            {/* JOB MATCH: compare this resume with a pasted job description */}
            <TabsContent
              value="match"
              className="focus-visible:outline-none animate-in fade-in duration-300"
            >
              <JobMatchPanel resumeId={resumeId} />
            </TabsContent>

            {/* TAB 1: AI REPORT (shared with the analyze page) */}
            <TabsContent
              value="analysis"
              className="focus-visible:outline-none animate-in fade-in duration-300"
            >
              {analysis ? (
                <AnalysisReport analysis={analysis} resumeId={resumeId} />
              ) : (
                <div className="rounded-3xl border border-dashed bg-card p-8 text-center space-y-2">
                  <Brain className="size-7 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-bold">Not analyzed yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Run an AI analysis to get your ATS score, a checklist of fixes and
                    bullet-by-bullet rewrites.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: STRUCTURED UNIFIED DATABASE VIEW (ALIGNED TO FORM SCHEMAS) */}
            <TabsContent
              value="content"
              className="space-y-6 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 gap-6">
                {/* PERSONAL DETAILS CARD WITH PROFILE LINK EMBEDS */}
                <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight">
                        {personalDetails.name || "Candidate Name"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                        {personalDetails.email && (
                          <span>{personalDetails.email}</span>
                        )}
                        {personalDetails.phone && (
                          <span>{personalDetails.phone}</span>
                        )}
                        {personalDetails.address && (
                          <span>{personalDetails.address}</span>
                        )}
                      </div>
                    </div>

                    {personalLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {personalLinks.map((link: any, idx: number) => (
                          <Button
                            key={idx}
                            asChild
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs gap-1"
                          >
                            <a href={link.url} target="_blank" rel="noreferrer">
                              <Globe className="h-3.5 w-3.5 text-primary" />
                              {link.label || "Link"}
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {content.professionalSummary && (
                    <div className="pt-4 border-t border-dashed space-y-1">
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        Professional Summary
                      </h4>
                      <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
                        <RichBlocks value={content.professionalSummary} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* LEFT SPLIT PANEL: EXPERIENCES & PROJECTS */}
                  <div className="md:col-span-8 space-y-8 flex flex-col">
                    {/* EXPERIENCES BLOCK */}
                    {experiences.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold flex items-center gap-2 px-1 text-muted-foreground uppercase tracking-wider">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                          Work Experience History
                        </h3>
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {experiences.map((exp: any) => (
                              <div
                                key={exp.id}
                                className="p-5 border rounded-2xl bg-card shadow-sm space-y-3 relative overflow-hidden"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <div>
                                    <h4 className="font-extrabold text-base leading-snug">
                                      {exp.role}
                                    </h4>
                                    <p className="text-xs font-semibold text-primary">
                                      {exp.company}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted border text-muted-foreground self-start sm:self-auto">
                                    {exp.duration}
                                  </span>
                                </div>
                                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-dashed">
                                  {exp.bullets?.map(
                                    (bullet: string, i: number) => (
                                      <li key={i} className="leading-relaxed">
                                        <RichInline value={bullet} linkStyle={{ textDecoration: "underline" }} />
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* PROJECTS BLOCK */}
                    {projects.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold flex items-center gap-2 px-1 text-muted-foreground uppercase tracking-wider">
                          <FolderGit2 className="h-3.5 w-3.5 text-primary" />
                          Technical Software Projects
                        </h3>
                        <ScrollArea className="h-[350px] pr-4">
                          <div className="space-y-4">
                            {projects.map((proj: any) => (
                              <div
                                key={proj.id}
                                className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <h4 className="font-extrabold text-base leading-none">
                                    {proj.title}
                                  </h4>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted border text-muted-foreground self-start sm:self-auto">
                                    {proj.duration}
                                  </span>
                                </div>
                                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-dashed">
                                  {proj.description?.map(
                                    (bullet: string, i: number) => (
                                      <li key={i} className="leading-relaxed">
                                        <RichInline value={bullet} linkStyle={{ textDecoration: "underline" }} />
                                      </li>
                                    ),
                                  )}
                                </ul>
                                {proj.links?.[0]?.url && (
                                  <div className="pt-1 flex">
                                    <a
                                      href={proj.links[0].url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] font-bold text-primary underline flex items-center gap-1"
                                    >
                                      <Code className="h-3 w-3" />
                                      {proj.links[0].label ||
                                        "View Project Deployment"}
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>

                  {/* RIGHT SPLIT PANEL: SKILLS, EDUCATION & CERTIFICATES */}
                  <div className="md:col-span-4 space-y-6">
                    {/* SKILLS BOX (SUPPORTING BOTH GROUPED CATEGORIES & LEGACY EXTRACTS) */}
                    <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-3">
                      <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-primary" /> Parsed
                        Stack Skills
                      </h3>
                      {Object.keys(groupedSkills).length > 0 ? (
                        <ScrollArea className="h-[220px] pr-4">
                          <div className="space-y-3">
                            {Object.keys(groupedSkills).map((cat) => (
                              <div key={cat} className="space-y-1">
                                <p className="text-[10px] font-extrabold uppercase text-primary tracking-wider">
                                  {cat}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {groupedSkills[cat].map((sk, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted border"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-[160px] overflow-y-auto pr-1">
                          {(result.data.content as any)?.skills?.map(
                            (skill: string) => (
                              <span
                                key={skill}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 tracking-wide"
                              >
                                {skill}
                              </span>
                            ),
                          ) || (
                            <p className="text-xs text-muted-foreground italic">
                              No skills mapped.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* EDUCATION BOX */}
                    <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-3">
                      <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-primary" />{" "}
                        Education History
                      </h3>
                      <ScrollArea className="max-h-[220px] pr-4">
                        <div className="space-y-4">
                          {educations.length > 0
                            ? educations.map((edu: any) => (
                                <div
                                  key={edu.id}
                                  className="space-y-0.5 pl-2.5 border-l-2 border-primary/30"
                                >
                                  <h4 className="font-bold text-xs leading-tight">
                                    {edu.course}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground font-semibold">
                                    {edu.schoolName}
                                  </p>
                                  <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-[9px] font-mono text-muted-foreground">
                                      {edu.duration}
                                    </span>
                                    {edu.gwa && (
                                      <span className="text-[9px] font-mono font-bold text-primary">
                                        GWA: {edu.gwa}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            : content.educations?.map(
                                (edu: any, index: number) => (
                                  <div
                                    key={index}
                                    className="space-y-0.5 pl-2.5 border-l-2 border-primary/30"
                                  >
                                    <h4 className="font-bold text-xs leading-tight">
                                      {edu.degree}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground font-semibold">
                                      {edu.institution}
                                    </p>
                                    <p className="text-[9px] font-mono font-bold text-primary/70">
                                      {edu.year}
                                    </p>
                                  </div>
                                ),
                              )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* CERTIFICATES BOX */}
                    {certificates.length > 0 && (
                      <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-3">
                        <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-primary" />{" "}
                          Certifications
                        </h3>
                        <ScrollArea className="max-h-[220px] pr-4">
                          <div className="space-y-3">
                            {certificates.map((cert: any) => (
                              <div
                                key={cert.id}
                                className="space-y-0.5 pl-2.5 border-l-2 border-primary/30"
                              >
                                <h4 className="font-bold text-xs leading-tight">
                                  {cert.title}
                                </h4>
                                {cert.description && (
                                  <p className="text-[11px] text-muted-foreground font-medium">
                                    <RichInline value={cert.description} />
                                  </p>
                                )}
                                <p className="text-[9px] font-mono text-muted-foreground">
                                  {cert.issuedDate}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* CUSTOM SECTIONS (from the editor) */}
                    {(content.customSections ?? [])
                      .filter((c) => c.body?.trim())
                      .map((c) => (
                        <div key={c.id} className="p-5 border rounded-2xl bg-card shadow-sm space-y-3">
                          <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" /> {c.title || "Custom section"}
                          </h3>
                          <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5 [&_ul]:list-disc [&_ul]:pl-4">
                            <RichBlocks value={c.body} lists />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
