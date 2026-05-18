import { Skeleton } from "@/components/ui/skeleton";
import { Brain, FileText } from "lucide-react";

export default function ResumeDetailsLoading() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        <div className="border rounded-2xl p-4 flex items-center gap-4 w-48 h-20 shrink-0 bg-card/50">
          <div className="space-y-2 w-full">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      {/* MOCK TABS LIST */}
      <div className="grid w-full max-w-md grid-cols-2 p-1 bg-muted rounded-2xl h-12 items-center">
        <div className="flex items-center justify-center gap-2 bg-background text-foreground rounded-xl h-10 font-bold text-sm shadow-sm">
          <Brain className="h-4 w-4 text-muted-foreground" />
          AI Audit Report
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground rounded-xl h-10 font-bold text-sm">
          <FileText className="h-4 w-4" />
          Structured Content
        </div>
      </div>

      {/* BODY CONTENT SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 lg:p-8 border rounded-3xl bg-card space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-3xl bg-card space-y-4">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 border rounded-3xl bg-card space-y-4">
            <Skeleton className="h-4 w-36" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-7 w-14 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
