/* eslint-disable react-hooks/set-state-in-effect */
// app/dashboard/settings/SettingsClientLayout.tsx
"use client";

import {
  SignOutButton,
  UserButton,
  UserProfile,
  PricingTable,
} from "@clerk/nextjs";
import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
  FileText,
  Mic,
  FilePlus, // 🚀 Added for resume attempts visual styling
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type TabId = "profile" | "security" | "notifications" | "billing";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

// ── Props definition matching billing.ts ──
interface SettingsClientLayoutProps {
  billingData: {
    isPro: boolean;
    limits: {
      analyses: number | string;
      interviews: number | string;
      resumes: number | string; // 🚀 Handles your status = 'created' attempts counts!
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
      <div className="w-8 h-8 rounded-lg bg-[#9ae600]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#5a8800] dark:text-[#9ae600]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-black text-stone-900 dark:text-stone-100 leading-none">
          {value}
        </p>
        <p className="text-[10px] text-stone-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function PlaceholderPanel({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  items: { label: string; value: string; toggle?: boolean }[];
}) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(
      items.filter((i) => i.toggle).map((i) => [i.label, true]),
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
        <div className="w-10 h-10 rounded-xl bg-[#9ae600]/10 border border-[#9ae600]/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#5a8800] dark:text-[#9ae600]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-0.5 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/40 hover:bg-white dark:hover:bg-stone-800 transition-colors group"
          >
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {item.label}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">{item.value}</p>
            </div>
            {item.toggle ? (
              <button
                onClick={() =>
                  setToggles((p) => ({ ...p, [item.label]: !p[item.label] }))
                }
                className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${
                  toggles[item.label]
                    ? "bg-[#9ae600]"
                    : "bg-stone-200 dark:bg-stone-700"
                }`}
                style={{ height: "22px", width: "40px" }}
                aria-label={`Toggle ${item.label}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${
                    toggles[item.label] ? "translate-x-[18px]" : "translate-x-0"
                  }`}
                />
              </button>
            ) : (
              <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-400 transition-colors" />
            )}
          </div>
        ))}
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
    ["profile", "security", "notifications", "billing"].includes(queryTab)
      ? queryTab
      : "profile",
  );

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    router.push(`/settings?tab=${tabId}`, { scroll: false });
  };

  // 🚀 FIXED: Handle edge cases where browser back/forward buttons are pressed
  useEffect(() => {
    const currentTab = searchParams.get("tab") as TabId;
    if (
      currentTab &&
      ["profile", "security", "notifications", "billing"].includes(currentTab)
    ) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const isPro = billingData.isPro; // Derived safely from server context rules

  const navItems: NavItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Manage your account identity",
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
      description: "Email & in-app alerts",
    },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCard,
      description: "Plans & payment methods",
    },
  ];

  const securityItems = [
    { label: "Change Password", value: "Last updated 3 months ago" },
    {
      label: "Two-Factor Authentication",
      value: "SMS or authenticator app",
      toggle: true,
    },
    { label: "Active Sessions", value: "2 devices currently signed in" },
    { label: "Connected Accounts", value: "Google — connected" },
  ];

  const notifItems = [
    {
      label: "Resume Analysis Complete",
      value: "Get notified when AI finishes auditing",
      toggle: true,
    },
    {
      label: "Interview Session Summary",
      value: "Receive your session score report",
      toggle: true,
    },
    {
      label: "Weekly Progress Digest",
      value: "Summary of your activity each week",
      toggle: false,
    },
    {
      label: "Product Updates",
      value: "New features & improvements",
      toggle: true,
    },
    {
      label: "Marketing Emails",
      value: "Tips, guides, and career resources",
      toggle: false,
    },
  ];

  const panelContent: Record<
    TabId,
    {
      icon: React.ElementType;
      title: string;
      description: string;
      items: { label: string; value: string; toggle?: boolean }[];
    } | null
  > = {
    profile: null,
    security: {
      icon: Shield,
      title: "Security",
      description: "Keep your account safe and your sessions secure.",
      items: securityItems,
    },
    notifications: {
      icon: Bell,
      title: "Notifications",
      description: "Choose what activity triggers an alert.",
      items: notifItems,
    },
    billing: null,
  };

  return (
    <main className="min-h-screen w-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Top bar */}
      <div className="border-b border-stone-100 dark:border-stone-800/60 bg-white/80 dark:bg-stone-900/60 backdrop-blur-xl sticky top-0 ">
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
                variables: { colorPrimary: "#9ae600" },
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

      <div className="w-full px-5 sm:px-8 py-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <aside className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#5a8800] dark:text-[#9ae600] mb-1.5">
                Account
              </p>
              <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">
                Settings
              </h1>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Manage your profile, security, and preferences.
              </p>
            </motion.div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = activeTab === item.id;
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
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#9ae600] rounded-full"
                      />
                    )}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-[#9ae600]/10" : "bg-stone-100 dark:bg-stone-700/50 group-hover:bg-[#9ae600]/8"}`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${active ? "text-[#5a8800] dark:text-[#9ae600]" : "text-stone-400 dark:text-stone-500 group-hover:text-[#9ae600]"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold leading-none mb-0.5 ${active ? "text-stone-900 dark:text-stone-100" : "text-stone-600 dark:text-stone-400 group-hover:text-stone-800"}`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] text-stone-400 leading-none truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* 📊 UPDATED: Renders ALL 3 structural metrics fed dynamically from billing.ts */}
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400 px-1 mb-3">
                Usage Limits
              </p>

              <StatCard
                icon={FilePlus}
                label="Manual Creation"
                value={`${billingData.limits.resumes} / ${isPro ? "∞" : "5"}`}
                sub={isPro ? "Pro Subscription Active" : "Resets Monthly"}
              />

              <StatCard
                icon={FileText}
                label="AI Analyses"
                value={`${billingData.limits.analyses} / ${isPro ? "∞" : "3"}`}
                sub={isPro ? "Pro Subscription Active" : "Lifetime Limit"}
              />

              <StatCard
                icon={Mic}
                label="Mock Interviews"
                value={`${billingData.limits.interviews} / ${isPro ? "∞" : "2"}`}
                sub={isPro ? "Pro Subscription Active" : "Lifetime Limit"}
              />
            </div>
          </aside>

          {/* ── Right panel ──────────────────────────────────────────────── */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "profile" ? (
                  <div className="rounded-2xl overflow-hidden border max-w-4xl border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
                    <div className="px-6 pt-6 pb-5 border-b border-stone-50 dark:border-stone-800">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#9ae600]/10 border border-[#9ae600]/15 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#5a8800] dark:text-[#9ae600]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-0.5 tracking-tight">
                            Profile
                          </h2>
                          <p className="text-sm text-stone-500 dark:text-stone-400">
                            Manage your name, email, avatar, and connected
                            accounts.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="clerk-settings-wrapper flex items-center justify-center py-2">
                      <Suspense
                        fallback={
                          <div className="p-8 h-32 w-full bg-muted rounded-xl animate-pulse" />
                        }
                      >
                        <UserProfile
                          path="/settings"
                          appearance={{
                            variables: {
                              colorPrimary: "#9ae600",
                              colorBackground: "transparent",
                              borderRadius: "0.75rem",
                            },
                            elements: {
                              card: "shadow-none border-none bg-transparent p-0 rounded-none",
                              navbar: "hidden",
                              navbarMobileMenuButton: "hidden",
                              pageScrollBox: "p-6 pt-4",
                              headerTitle: "hidden",
                              headerSubtitle: "hidden",
                              formButtonPrimary:
                                "bg-[#9ae600] text-[#1e3800] hover:bg-[#a8f000] font-bold shadow-none rounded-xl text-sm",
                              formFieldInput:
                                "rounded-xl border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm",
                              avatarBox: "rounded-2xl",
                            },
                          }}
                        />
                      </Suspense>
                    </div>
                  </div>
                ) : activeTab === "billing" ? (
                  <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm p-6 space-y-6">
                    <div className="flex items-start gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
                      <div className="w-10 h-10 rounded-xl bg-[#9ae600]/10 border border-[#9ae600]/15 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-[#5a8800] dark:text-[#9ae600]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-0.5 tracking-tight">
                          Billing & Plan
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          Current Subscription Tier:{" "}
                          <span className="font-extrabold text-[#5a8800] dark:text-[#9ae600] uppercase">
                            {isPro ? "Pro" : "Free"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="clerk-pricing-embedded-container">
                      <PricingTable />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm p-6">
                    {panelContent[activeTab] && (
                      <PlaceholderPanel {...panelContent[activeTab]!} />
                    )}
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
