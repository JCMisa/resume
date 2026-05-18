/* eslint-disable @typescript-eslint/no-explicit-any */

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import Link from "next/link";
import { getResumeDetailsAction } from "@/lib/actions/resume";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ResumeContent {
  fullName?: string;
  email?: string;
  skills?: string[];
  experience?: {
    company: string;
    role: string;
    duration: string;
    bullets: string[];
  }[];
  education?: {
    institution: string;
    degree: string;
    year: string;
  }[];
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
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 space-y-4">
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

  const content = (result.data.content as ResumeContent) || {};
  const analysis = (result.data.analysis as ResumeAnalysis) || {};

  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const improvements = analysis.improvements || [];
  const keyKeywords = analysis.keyKeywords || [];
  const gapsDetected = analysis.gapsDetected || [];
  const experience = content.experience || [];
  const skills = content.skills || [];
  const education = content.education || [];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 max-w-6xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
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

      {/* MAIN VIEW CONTROLS */}
      <Tabs defaultValue="analysis" className="w-full space-y-8">
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

        {/* TAB 1: AI AUDIT & METRICS */}
        <TabsContent
          value="analysis"
          className="space-y-8 focus-visible:outline-none"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Box: Audit Feedback details */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 lg:p-8 border rounded-3xl bg-card shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold tracking-widest text-primary uppercase">
                    Executive Review Summary
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {analysis?.summary || "No data calculated."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />{" "}
                      Key Strengths Identified
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

              {/* Dynamic word recommendations lists */}
              <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Contextual Wording Improvement Lines
                </h3>
                <div className="space-y-3">
                  {improvements.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-muted/40 border border-transparent text-sm space-y-1 hover:border-primary/20 transition-all"
                    >
                      <span className="font-bold text-primary text-[10px] uppercase tracking-wider">
                        {item.section}
                      </span>
                      <p className="text-muted-foreground">
                        Change{" "}
                        <span className="line-through opacity-60 px-1">
                          {item.current}
                        </span>{" "}
                        to{" "}
                        <span className="font-bold text-foreground bg-primary/10 px-1.5 py-0.5 rounded text-xs">
                          {item.suggested}
                        </span>
                      </p>
                      <p className="text-xs italic text-muted-foreground/80 mt-1">
                        Reason: {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side contextual modules tags panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-4">
                <h4 className="font-bold text-sm tracking-tight text-muted-foreground uppercase">
                  Target Keywords Captured
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {keyKeywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="text-xs px-2.5 py-1 rounded-md bg-muted font-medium border border-border/60"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {gapsDetected.length > 0 && (
                <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-3xl shadow-sm space-y-3">
                  <h4 className="font-bold text-sm text-amber-500 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Timeline Anomalies /
                    Gaps
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
                    {gapsDetected.map((gap: string, i: number) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: DETECTED STRUCTURED DATA */}
        <TabsContent
          value="content"
          className="space-y-8 focus-visible:outline-none"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Profile Basic details card info */}
              <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">
                    {content?.fullName || "Candidate Name"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {content?.email || "No email parsed"}
                  </p>
                </div>
              </div>

              {/* Experience timeline parameters lists loop */}
              <div className="flex flex-col">
                <h3 className="text-lg font-bold flex items-center gap-2 px-2 text-muted-foreground uppercase tracking-wider">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Work Experience History
                </h3>

                <ScrollArea className="h-[840px] mt-4 pr-4">
                  <div className="space-y-4">
                    {experience.map((exp: any, index: number) => (
                      <div
                        key={index}
                        className="p-6 border rounded-3xl bg-card shadow-sm space-y-3 relative overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <h4 className="font-extrabold text-lg leading-snug">
                              {exp.role}
                            </h4>
                            <p className="text-sm font-semibold text-primary">
                              {exp.company}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-muted border text-muted-foreground self-start sm:self-auto">
                            {exp.duration}
                          </span>
                        </div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5 pt-2 border-t border-dashed">
                          {exp.bullets?.map((bullet: string, i: number) => (
                            <li key={i} className="leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Sidebar Skill badges + Education parameters */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-4">
                <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Parse Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10 tracking-wide"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-4">
                <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Education
                  History
                </h3>
                <div className="space-y-4">
                  {education.map((edu: any, index: number) => (
                    <div
                      key={index}
                      className="space-y-1 pl-3 border-l-2 border-primary/30"
                    >
                      <h4 className="font-bold text-sm leading-tight">
                        {edu.degree}
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {edu.institution}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-primary/70">
                        {edu.year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
