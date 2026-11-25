"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Image from "next/image";
import { toast } from "sonner";
import {
  Camera,
  Check,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ACCENTS, ACCENT_IDS, type AccentId } from "@/lib/accents";
import { useAccent, useSetAccent } from "@/components/custom/AccentProvider";
import { syncProfileFromClerkAction } from "@/lib/actions/user";
import { useUserStore } from "@/store/userStore";

const MAX_AVATAR_BYTES = 10 * 1024 * 1024; // Clerk's profile image limit
const noopSubscribe = () => () => {};

/** Clerk API errors carry a readable longMessage; fall back to a generic one. */
function clerkErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    errors?: { longMessage?: string; message?: string }[];
  };
  return err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || fallback;
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm p-6 space-y-6">
      <div className="flex items-start gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
        <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-brand-strong dark:text-brand" />
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
      {children}
    </section>
  );
}

export default function ProfilePersonalization() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const setUserDetails = useUserStore((s) => s.setUserDetails);

  // null = untouched, so the inputs show Clerk's current values
  const [firstNameDraft, setFirstName] = useState<string | null>(null);
  const [lastNameDraft, setLastName] = useState<string | null>(null);
  const firstName = firstNameDraft ?? user?.firstName ?? "";
  const lastName = lastNameDraft ?? user?.lastName ?? "";
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mirror the new Clerk profile into our users table + client store right away
  async function syncToDatabase() {
    const res = await syncProfileFromClerkAction();
    if (res.success && res.data) setUserDetails(res.data);
  }

  const nameChanged =
    !!user &&
    (firstName.trim() !== (user.firstName ?? "") ||
      lastName.trim() !== (user.lastName ?? ""));

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !nameChanged) return;
    if (!firstName.trim()) {
      toast.error("First name can't be empty.");
      return;
    }
    setSavingName(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await syncToDatabase();
      setFirstName(null); // back to showing Clerk's (now updated) values
      setLastName(null);
      toast.success("Name updated.");
    } catch (error) {
      toast.error(clerkErrorMessage(error, "Couldn't update your name."));
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!user || !file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Images must be 10 MB or smaller.");
      return;
    }
    setSavingAvatar(true);
    try {
      await user.setProfileImage({ file });
      await user.reload();
      await syncToDatabase();
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(clerkErrorMessage(error, "Couldn't update your photo."));
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleAvatarRemove() {
    if (!user) return;
    setSavingAvatar(true);
    try {
      await user.setProfileImage({ file: null });
      await user.reload();
      await syncToDatabase();
      toast.success("Profile photo removed.");
    } catch (error) {
      toast.error(clerkErrorMessage(error, "Couldn't remove your photo."));
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <div className="space-y-6">
      <Section
        icon={User}
        title="Profile"
        description="Your photo and name, shown across the app and your account."
      >
        {!isLoaded || !user ? (
          <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
        ) : (
          <div className="space-y-8">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative size-20 shrink-0">
                <Image
                  src={user.imageUrl}
                  alt="Profile photo"
                  fill
                  sizes="80px"
                  className="rounded-2xl object-cover border border-stone-200 dark:border-stone-700"
                />
                {savingAvatar && (
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg font-bold gap-1.5"
                  >
                    <Camera className="size-3.5" /> Change photo
                  </Button>
                  {user.hasImage && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={savingAvatar}
                      onClick={handleAvatarRemove}
                      className="rounded-lg font-bold gap-1.5"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  JPG, PNG, GIF or WebP, up to 10 MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            {/* Name */}
            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                    First name
                  </span>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={64}
                    className="rounded-md py-4"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                    Last name
                  </span>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={64}
                    className="rounded-md py-4"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                  Email
                </span>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {user.primaryEmailAddress?.emailAddress ?? "—"}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openUserProfile()}
                  className="text-xs font-semibold text-brand-strong dark:text-brand hover:underline"
                >
                  Manage email, password & security
                </button>
                <Button
                  type="submit"
                  disabled={!nameChanged || savingName}
                  className="rounded-lg py-4 px-8 cursor-pointer font-bold gap-1.5"
                >
                  {savingName && <Loader2 className="size-3.5 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        )}
      </Section>

      <AppearanceSection />
    </div>
  );
}

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  const setAccent = useSetAccent();
  // next-themes and the accent only exist on the client; avoid a hydration mismatch
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  async function chooseAccent(id: AccentId) {
    if (id === accent) return;
    const res = await setAccent(id);
    if (!res.success) {
      toast.error(
        "Applied on this device, but couldn't save it to your account.",
      );
    }
  }

  return (
    <Section
      icon={Palette}
      title="Appearance"
      description="Make ResuMe yours. Your color theme applies everywhere: the builder, analyzer, interviews and the home page."
    >
      <div className="space-y-3">
        <p className="text-xs font-bold text-stone-600 dark:text-stone-300">
          Mode
        </p>
        <div className="grid grid-cols-3 gap-2 max-w-sm">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mounted && theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand bg-brand/10 text-stone-900 dark:text-stone-100"
                    : "border-stone-200 dark:border-stone-700 text-stone-500 hover:border-stone-300 dark:hover:border-stone-600",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-stone-600 dark:text-stone-300">
          Color theme
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACCENT_IDS.map((id) => {
            const shades = ACCENTS[id];
            const active = mounted && accent === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => chooseAccent(id)}
                aria-pressed={active}
                aria-label={`${shades.label} color theme`}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors",
                  active
                    ? "border-stone-900 dark:border-stone-100"
                    : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600",
                )}
              >
                <span
                  className="size-9 rounded-full flex items-center justify-center shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${shades.light}, ${shades.brand} 55%, ${shades.strong})`,
                  }}
                >
                  {active && (
                    <Check
                      className="size-4"
                      style={{ color: shades.foreground }}
                    />
                  )}
                </span>
                <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                  {shades.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
