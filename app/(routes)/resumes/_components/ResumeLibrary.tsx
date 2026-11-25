"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ArrowDownUp,
  Check,
  Copy,
  FilePen,
  Share2,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  PenLine,
  Search,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  deleteResumeAction,
  renameResumeAction,
} from "@/lib/actions/resume-library";
import type { ResumeLibraryItem } from "@/lib/resume-stats";
import AnalyzeResumeButton from "./AnalyzeResumeButton";

type Filter = "all" | "analyzed" | "not_analyzed" | "parsed" | "created";
type Sort = "recent" | "score_desc" | "score_asc" | "name";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "analyzed", label: "Analyzed" },
  { id: "not_analyzed", label: "Not analyzed" },
  { id: "parsed", label: "Uploaded" },
  { id: "created", label: "Built" },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: "recent", label: "Recently updated" },
  { id: "score_desc", label: "Highest score" },
  { id: "score_asc", label: "Lowest score" },
  { id: "name", label: "Name (A–Z)" },
];

function matchesFilter(i: ResumeLibraryItem, f: Filter) {
  switch (f) {
    case "analyzed":
      return i.score != null;
    case "not_analyzed":
      return i.score == null;
    case "parsed":
    case "created":
      return i.status === f;
    default:
      return true;
  }
}

export function ScorePill({ score, className }: { score: number | null; className?: string }) {
  if (score == null) {
    return (
      <span className={cn("rounded-lg bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground", className)}>
        Not analyzed
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-lg px-2 py-1 text-xs font-black tabular-nums",
        score >= 80
          ? "bg-brand/15 text-brand-strong dark:text-brand"
          : score >= 60
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
        className,
      )}
      title={`ATS score ${score}/100`}
    >
      {score}
      <span className="font-bold opacity-60">/100</span>
    </span>
  );
}

function ResumeCard({
  item,
  onRename,
  onDelete,
}: {
  item: ResumeLibraryItem;
  onRename: () => void;
  onDelete: () => void;
}) {
  const Icon = item.status === "parsed" ? UploadCloud : PenLine;
  return (
    <li className="group rounded-2xl border bg-card p-4 flex flex-col gap-3 hover:border-brand/40 hover:shadow-md transition-all min-w-0">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center">
          <FileText className="size-5 text-brand-strong dark:text-brand" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/resumes/${item.id}`}
            className="block text-sm font-bold truncate hover:underline underline-offset-4"
            title={item.title}
          >
            {item.title}
          </Link>
          {item.tailored ? (
            <Link
              href={`/resumes/${item.id}/tailored`}
              className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand-strong dark:text-brand hover:bg-brand/20"
              title="See what was tailored"
            >
              <WandSparkles className="size-3 shrink-0" />
              <span className="truncate">
                Tailored{item.tailored.company || item.tailored.jobTitle ? ` · ${item.tailored.company || item.tailored.jobTitle}` : ""}
                {!item.tailored.done && " · finish it"}
              </span>
            </Link>
          ) : (
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Icon className="size-3 shrink-0" />
              <span className="truncate">
                {item.status === "parsed" ? "Uploaded PDF" : "Built in editor"} · {item.category}
              </span>
            </p>
          )}
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 rounded-lg"
              aria-label={`Actions for ${item.title}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/resumes/${item.id}`}>
                <FolderOpen className="size-4" /> Open
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              {item.status === "created" ? (
                <Link href={`/resumes/${item.id}/edit`}>
                  <FilePen className="size-4" /> Edit
                </Link>
              ) : (
                <Link href={`/resumes/create?from=${item.id}`}>
                  <Copy className="size-4" /> Edit a copy
                </Link>
              )}
            </DropdownMenuItem>
            {item.status === "created" && (
              <DropdownMenuItem asChild>
                <Link href={`/resumes/${item.id}/share`}>
                  <Share2 className="size-4" /> Download & share
                </Link>
              </DropdownMenuItem>
            )}
            {item.tailored && (
              <DropdownMenuItem asChild>
                <Link href={`/resumes/${item.id}/tailored`}>
                  <WandSparkles className="size-4" /> What was tailored
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={`/resumes/create?mode=tailor&from=${item.id}`}>
                <WandSparkles className="size-4" /> Tailor to a job
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/resumes/${item.id}?tab=match`}>
                <Target className="size-4" /> Match to a job
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRename}>
              <PenLine className="size-4" /> Rename
            </DropdownMenuItem>
            {item.fileUrl && (
              <DropdownMenuItem asChild>
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" /> Original PDF
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between gap-2">
        <ScorePill score={item.score} />
        {item.readability && (
          <span className="text-[11px] text-muted-foreground truncate">
            Readability: <span className="font-semibold text-foreground">{item.readability}</span>
          </span>
        )}
      </div>

      {/* Section completeness */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Sections filled</span>
          <span className="font-bold tabular-nums">{item.completeness}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-brand" style={{ width: `${item.completeness}%` }} />
        </div>
        {item.missingSections.length > 0 && (
          <p className="text-[11px] text-muted-foreground truncate" title={item.missingSections.join(", ")}>
            Missing: {item.missingSections.join(", ")}
          </p>
        )}
      </div>

      {item.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.keywords.slice(0, 3).map((k) => (
            <span key={k} className="rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {k}
            </span>
          ))}
          {item.keywords.length > 3 && (
            <span className="px-1 py-0.5 text-[11px] text-muted-foreground">+{item.keywords.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-2 border-t flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground truncate">
          Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
          {item.improvementsCount > 0 && ` · ${item.improvementsCount} tips`}
        </span>
        {item.score == null ? (
          <AnalyzeResumeButton resumeId={item.id} compact />
        ) : (
          <Link
            href={`/resumes/${item.id}`}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-lg font-bold")}
          >
            View report
          </Link>
        )}
      </div>
    </li>
  );
}

export default function ResumeLibrary({ items }: { items: ResumeLibraryItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [renaming, setRenaming] = useState<ResumeLibraryItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<ResumeLibraryItem | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, items.filter((i) => matchesFilter(i, f.id)).length])) as Record<Filter, number>,
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(
      (i) =>
        matchesFilter(i, filter) &&
        (!q ||
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.keywords.some((k) => k.toLowerCase().includes(q))),
    );
    const byScore = (dir: 1 | -1) => (a: ResumeLibraryItem, b: ResumeLibraryItem) => {
      // Unscored always last
      if (a.score == null) return b.score == null ? 0 : 1;
      if (b.score == null) return -1;
      return (a.score - b.score) * dir;
    };
    return [...list].sort(
      sort === "score_desc"
        ? byScore(-1)
        : sort === "score_asc"
          ? byScore(1)
          : sort === "name"
            ? (a, b) => a.title.localeCompare(b.title)
            : (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    );
  }, [items, query, filter, sort]);

  const submitRename = () => {
    if (!renaming) return;
    const target = renaming;
    startTransition(async () => {
      const res = await renameResumeAction(target.id, renameValue);
      if (res.success) {
        toast.success("Resume renamed.");
        setRenaming(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const res = await deleteResumeAction(target.id);
      if (res.success) {
        toast.success(`Deleted "${target.title}".`);
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <section className="rounded-3xl border bg-card shadow-sm p-5 space-y-4">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black tracking-tight">Your resumes</h2>
          <p className="text-[11px] text-muted-foreground">
            {items.length} total · search by title, category or keyword
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resumes…"
              className="pl-8 pr-8 rounded-xl"
              aria-label="Search resumes"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-lg gap-1.5 font-bold">
                <ArrowDownUp className="size-3.5" />
                {SORTS.find((s) => s.id === sort)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              {SORTS.map((s) => (
                <DropdownMenuItem key={s.id} onSelect={() => setSort(s.id)}>
                  <Check className={cn("size-4", sort === s.id ? "opacity-100" : "opacity-0")} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Filter chips: scroll horizontally on small screens */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Filter resumes">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-colors",
              filter === f.id
                ? "bg-brand text-brand-foreground border-brand"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-70">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <Search className="size-6 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-bold">No resumes match</p>
          <p className="text-xs text-muted-foreground">Try a different search or filter.</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <ResumeCard
              key={item.id}
              item={item}
              onRename={() => {
                setRenameValue(item.title);
                setRenaming(item);
              }}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </ul>
      )}

      {/* Rename */}
      <Dialog open={renaming !== null} onOpenChange={(o) => !o && !pending && setRenaming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename resume</DialogTitle>
            <DialogDescription>Only you see this name.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitRename();
            }}
            className="space-y-4"
          >
            <Input
              autoFocus
              value={renameValue}
              maxLength={120}
              onChange={(e) => setRenameValue(e.target.value)}
              aria-label="Resume title"
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRenaming(null)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !renameValue.trim()} className="gap-1.5">
                {pending && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && !pending && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; and its AI report will be permanently removed
              {deleting?.fileUrl ? ", along with the saved PDF" : ""}. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep open until the delete finishes
                confirmDelete();
              }}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90 gap-1.5"
            >
              {pending && <Loader2 className="size-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export function LibraryEmptyActions() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Link href="/resumes/analyze" className={cn(buttonVariants(), "rounded-lg font-bold gap-1.5")}>
        <Sparkles className="size-4" /> Analyze a resume
      </Link>
      <Link
        href="/resumes/create"
        className={cn(buttonVariants({ variant: "outline" }), "rounded-lg font-bold gap-1.5")}
      >
        <FilePlus2 className="size-4" /> Build from scratch
      </Link>
    </div>
  );
}
