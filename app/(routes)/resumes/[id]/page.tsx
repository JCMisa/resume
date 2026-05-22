/* eslint-disable @typescript-eslint/no-explicit-any */

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Brain,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Award,
  CheckCircle2Icon,
  Globe,
  Code,
  FolderGit2,
} from "lucide-react";
import Link from "next/link";
import { getResumeDetailsAction } from "@/lib/actions/resume";
import ResumeFileViewer from "../_components/ResumeFileViewer";
import AnalyzeResumeButton from "../_components/AnalyzeResumeButton";
import ResumeFileUploader from "../_components/ResumeFileUploader";

interface PageProps {
  params: Promise<{ id: string }>;
}

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
}

interface ResumeAnalysis {
  overallScore?: number;
  readability?: string;
  keyKeywords?: string[];
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: {
    section: string;
    current: string;
    suggested: string;
    reason: string;
  }[];
  gapsDetected?: string[];
}

export default async function ResumeDetailsPage({ params }: PageProps) {
  const { id: resumeId } = await params;
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
  const category = result.data.category;
  const fileUrl = result.data.fileUrl || null;

  // Extract typecast fields with explicit array fallbacks
  const content = (result.data.content as ResumeContent) || {};
  const analysis = (result.data.analysis as ResumeAnalysis) || {};

  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const improvements = analysis.improvements || [];
  const keyKeywords = analysis.keyKeywords || [];
  const gapsDetected = analysis.gapsDetected || [];

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
    <div className="min-h-screen bg-background p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-1"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {title}
          </h1>
          <span className="inline-flex items-center text-xs font-bold px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            {category}
          </span>
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
        </div>

        {/* RIGHT COLUMN: AI AUDIT AND PARSED SCHEMA TABS */}
        <div className="xl:col-span-7 w-full">
          <Tabs defaultValue="analysis" className="w-full space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 !p-1 bg-muted !rounded-2xl !h-12">
              <TabsTrigger
                value="analysis"
                className="!rounded-xl !font-bold !text-sm !gap-2"
              >
                <Brain className="h-4 w-4" />
                AI Audit Report
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="!rounded-xl !font-bold !text-sm !gap-2"
              >
                <FileText className="h-4 w-4" />
                Structured Content
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: AI AUDIT & FEEDBACK */}
            <TabsContent
              value="analysis"
              className="space-y-6 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 lg:p-8 border rounded-3xl bg-card shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold tracking-widest text-primary uppercase">
                      Executive Review Summary
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {analysis?.summary || "No evaluation parsed."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                        <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />{" "}
                        Key Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {strengths.map((str: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground pl-3 border-l-2 border-emerald-500/40"
                          >
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />{" "}
                        Critical Weaknesses
                      </h4>
                      <ul className="space-y-1.5">
                        {weaknesses.map((weak: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground pl-3 border-l-2 border-destructive/40"
                          >
                            {weak}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-7 space-y-6">
                    <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Wording Improvement Lines
                      </h3>
                      <ScrollArea className="h-[280px] pr-2">
                        <div className="space-y-3">
                          {improvements.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-muted/40 border border-transparent text-xs space-y-1 hover:border-primary/20 transition-all"
                            >
                              <span className="font-bold text-primary text-[9px] uppercase tracking-wider">
                                {item.section}
                              </span>
                              <p className="text-muted-foreground">
                                Change{" "}
                                <span className="line-through opacity-60">
                                  {item.current}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-foreground bg-primary/10 px-1 rounded text-xs">
                                  {item.suggested}
                                </span>
                              </p>
                              {item.reason && (
                                <p className="text-[11px] italic text-muted-foreground/70 mt-0.5">
                                  Reason: {item.reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-6">
                    <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-3">
                      <h4 className="font-bold text-xs tracking-tight text-muted-foreground uppercase">
                        Keywords Captured
                      </h4>
                      <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {keyKeywords.map((kw: string) => (
                          <span
                            key={kw}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-muted font-medium border border-border/60"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {gapsDetected.length > 0 && (
                      <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-3xl shadow-sm space-y-2">
                        <h4 className="font-bold text-xs text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Timeline
                          Gaps
                        </h4>
                        <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
                          {gapsDetected.map((gap: string, i: number) => (
                            <li key={i}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                      <p className="text-xs text-muted-foreground leading-relaxed text-justify">
                        {content.professionalSummary}
                      </p>
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
                                        {bullet}
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
                                        {bullet}
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
                                    {cert.description}
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
