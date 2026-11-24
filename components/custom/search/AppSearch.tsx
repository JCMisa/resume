"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Bell,
  CreditCard,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchAppAction } from "@/lib/actions/search";
import { SEARCH_MAX_CHARS, isSearchable, matchPages, normalizeSearchQuery, type PageIconId } from "@/lib/search";

const PAGE_ICON: Record<PageIconId, React.ElementType> = {
  dashboard: LayoutDashboard,
  resumes: LayoutGrid,
  create: FilePlus2,
  analyze: Sparkles,
  interviews: Video,
  settings: Settings,
  billing: CreditCard,
  notifications: Bell,
  security: Shield,
  admin: ShieldCheck,
};

type Results = Extract<Awaited<ReturnType<typeof searchAppAction>>, { success: true }>["data"];

const DEBOUNCE_MS = 250;
const itemClass = "gap-3 py-2 text-sm cursor-pointer";

function Score({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <span className="ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black tabular-nums text-muted-foreground">
      {value}/100
    </span>
  );
}

/**
 * Header search (command palette). Opens from the header box, the mobile icon,
 * or Ctrl/⌘ K. Finds app pages instantly, and the user's own resumes and
 * interviews from the server (debounced).
 */
export function AppSearch({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const requestId = useRef(0);

  // ⌘K label on Apple devices (read after mount to avoid a hydration mismatch)
  useEffect(() => {
    const t = setTimeout(() => {
      if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setShortcut("⌘K");
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Ctrl/⌘ K toggles the palette from anywhere in the app
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced server search; stale responses are ignored
  const normalized = normalizeSearchQuery(query);
  useEffect(() => {
    const id = ++requestId.current;
    if (!isSearchable(normalized)) {
      const t = setTimeout(() => {
        setResults(null);
        setLoading(false);
        setError(null);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await searchAppAction(normalized);
      if (id !== requestId.current) return;
      setLoading(false);
      if (res.success) {
        setResults(res.data);
        setError(null);
      } else {
        setError(res.error);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [normalized]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const pages = matchPages(normalized, isAdmin);
  const searched = isSearchable(normalized);
  const fresh = results?.query === normalized; // results belong to what's typed
  const resumeHits = fresh ? results!.resumes : [];
  const interviewHits = fresh ? results!.interviews : [];
  const nothing = searched && fresh && !loading && !pages.length && !resumeHits.length && !interviewHits.length;

  return (
    <>
      {/* Desktop: looks like a search box, opens the palette */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:flex sm:mr-3 w-48 lg:w-64 h-8 items-center gap-2 rounded-lg border bg-muted/20 px-3 text-[11px] text-muted-foreground hover:bg-muted/40 transition-colors"
        aria-label="Search resumes, interviews and pages"
      >
        <Search className="size-[13px] shrink-0" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">{shortcut}</kbd>
      </button>

      {/* Mobile: icon button */}
      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-[1.2rem] w-[1.2rem]" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Search ResuMe"
        description="Search your resumes, interviews and pages"
        className="sm:max-w-lg"
      >
        {/* Server results are already filtered; pages are filtered by matchPages */}
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            maxLength={SEARCH_MAX_CHARS}
            placeholder="Search resumes, interviews and pages…"
          />
          <CommandList className="max-h-[min(420px,60vh)]">
            {nothing && <CommandEmpty>No results for &ldquo;{normalized}&rdquo;.</CommandEmpty>}

            {resumeHits.length > 0 && (
              <CommandGroup heading="Resumes">
                {resumeHits.map((r) => (
                  <CommandItem key={r.id} value={`resume-${r.id}`} onSelect={() => go(`/resumes/${r.id}`)} className={itemClass}>
                    <FileText className="size-4! text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {r.status === "parsed" ? "Uploaded" : "Built"} · {r.category} · {format(new Date(r.updatedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Score value={r.score} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {interviewHits.length > 0 && (
              <CommandGroup heading="Interviews">
                {interviewHits.map((i) => (
                  <CommandItem
                    key={i.id}
                    value={`interview-${i.id}`}
                    onSelect={() => go(`/interviews/results/${i.id}`)}
                    className={itemClass}
                  >
                    <Video className="size-4! text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{i.jobRole}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {i.status === "completed" ? "Graded" : "Waiting for grading"} · {format(new Date(i.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Score value={i.score} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {pages.length > 0 && (
              <CommandGroup heading={searched ? "Pages" : "Go to"}>
                {pages.map((p) => {
                  const Icon = PAGE_ICON[p.icon];
                  return (
                    <CommandItem key={p.href} value={`page-${p.href}`} onSelect={() => go(p.href)} className={itemClass}>
                      <Icon className="size-4! text-muted-foreground" />
                      <span className="truncate">{p.title}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>

          <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-[11px] text-muted-foreground">
            <span className={cn(error && "text-destructive")}>
              {error ?? (searched ? "Your resumes, interviews and pages" : "Type at least 2 letters to search your resumes and interviews")}
            </span>
            {loading && <Loader2 className="size-3.5 animate-spin shrink-0" aria-label="Searching" />}
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
