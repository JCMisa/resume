import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/site";

/** Shared frame for /privacy and /terms: plain, readable, both themes. */
export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="ResuMe home">
            <Image src="/logo.svg" alt="" width={28} height={28} />
            <span className="text-lg font-black tracking-tight">
              Resu<span className="text-brand-strong dark:text-brand">Me</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-strong dark:text-brand">
          Last updated {LEGAL_UPDATED}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <div className="mt-5 text-base leading-relaxed text-stone-600 dark:text-stone-400">{intro}</div>

        <div
          className={[
            "mt-10 space-y-10 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:dark:text-stone-50 [&_h2]:mb-3",
            "[&_p+p]:mt-3 [&_ul+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_strong]:font-semibold [&_strong]:text-stone-900 [&_strong]:dark:text-stone-100",
            "[&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_a]:text-brand-strong [&_a]:dark:text-brand",
          ].join(" ")}
        >
          {children}
          <section>
            <h2>Contact</h2>
            {SUPPORT_EMAIL ? (
              <p>
                Questions or requests about this page: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            ) : (
              <p>Questions or requests about this page: contact the ResuMe team from your account.</p>
            )}
          </section>
        </div>

        <nav className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-200 pt-6 text-sm dark:border-stone-800">
          <Link href="/privacy" className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
            Terms of Service
          </Link>
          <Link href="/" className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
            Home
          </Link>
        </nav>
      </main>
    </div>
  );
}
