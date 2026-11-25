/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import {
  SignOutButton,
  UserButton,
  PricingTable,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ProfilePersonalization from "./ProfilePersonalization";
import SecuritySettings from "./SecuritySettings";
import NotificationSettings from "./NotificationSettings";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  FileText,
  Mic,
  Target,
  WandSparkles,
  FileCheck2,
  FilePlus, // 🚀 Added for resume attempts visual styling
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FREE_LIMITS,
  LIMIT_PERIOD,
  PRO_LIMITS,
  formatResetDate,
  type MeteredFeature,
} from "@/lib/plans";

type TabId = "profile" | "security" | "notifications" | "billing";

// Tabs that can actually be opened (incl. via ?tab=). A tab marked comingSoon
// is shown disabled with a "Coming soon" tooltip.
const AVAILABLE_TABS: TabId[] = ["profile", "security", "notifications", "billing"];

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
  comingSoon?: boolean;
}

// ── Props definition matching billing.ts ──
interface SettingsClientLayoutProps {
  billingData: {
    isPro: boolean;
    isAdmin?: boolean;
    limits: {
      analyses: number | string;
      interviews: number | string;
      resumes: number | string;
      jobMatches: number | string;
      aiWrites: number | string;
      tailors: number | string;
      tailorsThisMonth: number | string;
    };
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700/50">
      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-brand-strong dark:text-brand" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-black text-stone-900 dark:text-stone-100 leading-none">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function SettingsClientLayout({
  billingData,
}: SettingsClientLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryTab = searchParams.get("tab") as TabId;
  const [activeTab, setActiveTab] = useState<TabId>(
    AVAILABLE_TABS.includes(queryTab) ? queryTab : "profile",
  );

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    router.push(`/settings?tab=${tabId}`, { scroll: false });
  };

  // 🚀 FIXED: Handle edge cases where browser back/forward buttons are pressed
  useEffect(() => {
    const currentTab = searchParams.get("tab") as TabId;
    if (currentTab && AVAILABLE_TABS.includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const isPro = billingData.isPro; // Derived safely from server context rules
  const usageSub = (feature: MeteredFeature) =>
    isPro
      ? "Pro Subscription Active"
      : LIMIT_PERIOD[feature] === "monthly"
        ? `This month · resets ${formatResetDate()}`
        : "Lifetime Limit";

  const navItems: NavItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Photo, name & appearance",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Passwords & 2-factor auth",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "In-app & device alerts",
    },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCard,
      description: "Plans & payment methods",
    },
  ];

  return (
    // On lg+ the page fills the available height and each column scrolls on its
    // own: the left nav + usage cards stay put, only the right panel scrolls.
    // Below lg the columns stack and the page scrolls normally.
    <main className="min-h-full w-full flex flex-col lg:h-full lg:overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Top bar */}
      <div className="shrink-0 border-b border-stone-100 dark:border-stone-800/60 bg-white/80 dark:bg-stone-900/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="w-full px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="logo" width={22} height={22} />
            <span className="text-stone-300 dark:text-stone-700 text-sm">
              /
            </span>
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Settings
            </span>
          </div>

          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
            <SignOutButton>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all border border-transparent hover:border-stone-200 dark:hover:border-stone-700">
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full px-5 sm:px-8 pt-8 lg:pb-0 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] lg:grid-rows-[minmax(0,1fr)] lg:h-full gap-8 items-start lg:items-stretch">
          {/* ── Left sidebar (fixed; scrolls only if the window is too short) ── */}
          <aside className="space-y-6 lg:min-h-0 lg:overflow-y-auto custom-scrollbar lg:pb-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-brand-strong dark:text-brand mb-1.5">
                Account
              </p>
              <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">
                Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Manage your profile, security, and preferences.
              </p>
            </motion.div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = activeTab === item.id;

                // Placeholder tabs: visible but disabled, with a "Coming soon"
                // tooltip. aria-disabled (not `disabled`) so hover still fires.
                if (item.comingSoon) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-disabled="true"
                          onClick={(e) => e.preventDefault()}
                          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left border border-transparent opacity-50 cursor-not-allowed"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-stone-100 dark:bg-stone-700/50">
                            <item.icon className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-none mb-0.5 text-stone-600 dark:text-stone-400">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-none truncate">
                              {item.description}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-stone-200 dark:border-stone-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Soon
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Coming soon</TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                      active
                        ? "bg-white dark:bg-stone-800 shadow-sm border border-stone-100 dark:border-stone-700"
                        : "hover:bg-white/60 dark:hover:bg-stone-800/40 border border-transparent"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="activeBar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-full"
                      />
                    )}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-brand/10" : "bg-stone-100 dark:bg-stone-700/50 group-hover:bg-brand/8"}`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${active ? "text-brand-strong dark:text-brand" : "text-stone-400 dark:text-stone-500 group-hover:text-brand"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold leading-none mb-0.5 ${active ? "text-stone-900 dark:text-stone-100" : "text-stone-600 dark:text-stone-400 group-hover:text-stone-800"}`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-none truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* 📊 UPDATED: Renders ALL 3 structural metrics fed dynamically from billing.ts */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground px-1 mb-3">
                Usage Limits
              </p>

              <StatCard
                icon={FilePlus}
                label="Manual Creation"
                value={`${billingData.limits.resumes} / ${isPro ? "∞" : FREE_LIMITS.create_resume}`}
                sub={usageSub("create_resume")}
              />

              <StatCard
                icon={FileText}
                label="AI Analyses"
                value={`${billingData.limits.analyses} / ${isPro ? "∞" : FREE_LIMITS.analyze}`}
                sub={usageSub("analyze")}
              />

              <StatCard
                icon={Target}
                label="Job Matches"
                value={`${billingData.limits.jobMatches} / ${isPro ? "∞" : FREE_LIMITS.job_match}`}
                sub={usageSub("job_match")}
              />

              <StatCard
                icon={WandSparkles}
                label="AI Writing"
                value={`${billingData.limits.aiWrites} / ${isPro ? "∞" : FREE_LIMITS.ai_write}`}
                sub={usageSub("ai_write")}
              />

              {/* Free: a 3-resume trial that never resets; Pro: 30 a month */}
              <StatCard
                icon={FileCheck2}
                label="Tailored Resumes"
                value={
                  billingData.isAdmin
                    ? `${billingData.limits.tailorsThisMonth} / ∞`
                    : isPro
                      ? `${billingData.limits.tailorsThisMonth} / ${PRO_LIMITS.resume_tailor}`
                      : `${billingData.limits.tailors} / ${FREE_LIMITS.resume_tailor}`
                }
                sub={
                  billingData.isAdmin
                    ? "Admin: no cap"
                    : isPro
                      ? `This month · resets ${formatResetDate()}`
                      : "Free trial · doesn't reset"
                }
              />

              <StatCard
                icon={Mic}
                label="Mock Interviews"
                value={
                  !isPro
                    ? "Pro only"
                    : `${billingData.limits.interviews} / ${billingData.isAdmin ? "∞" : PRO_LIMITS.interview}`
                }
                sub={
                  !isPro
                    ? "Upgrade to unlock"
                    : billingData.isAdmin
                      ? "Admin: no cap"
                      : `This month · resets ${formatResetDate()}`
                }
              />
            </div>
          </aside>

          {/* ── Right panel (the only part that scrolls) ─────────────────── */}
          <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "profile" ? (
                  <ProfilePersonalization />
                ) : activeTab === "security" ? (
                  <SecuritySettings />
                ) : activeTab === "notifications" ? (
                  <NotificationSettings />
                ) : (
                  <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm p-6 space-y-6">
                    <div className="flex items-start gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-brand-strong dark:text-brand" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-0.5 tracking-tight">
                          Billing & Plan
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          Current Subscription Tier:{" "}
                          <span className="font-extrabold text-brand-strong dark:text-brand uppercase">
                            {isPro ? "Pro" : "Free"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="clerk-pricing-embedded-container">
                      <PricingTable />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        .clerk-settings-wrapper .cl-card { box-shadow: none !important; border: none !important; background: transparent !important; }
        .clerk-settings-wrapper .cl-navbar { display: none !important; }
        .clerk-settings-wrapper .cl-scrollBox { padding: 1.5rem !important; }
        .clerk-settings-wrapper .cl-headerTitle, .clerk-settings-wrapper .cl-headerSubtitle { display: none !important; }
      `}</style>
    </main>
  );
}
