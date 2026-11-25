import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  pgEnum,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ResumeAnalysisData } from "../lib/analysis-types";
import type { JobMatchData } from "../lib/job-match";
import type { TailoredFor } from "../lib/resume-tailor";
import type {
  NotificationCategory,
  NotificationKind,
  NotificationPrefs,
} from "../lib/notifications";
import {
  relations,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const interviewStatusEnum = pgEnum("interview_status", [
  "in-progress",
  "completed",
  "failed",
]);
export const resumeStatusEnum = pgEnum("resume_status", ["parsed", "created"]);
export const usageKindEnum = pgEnum("usage_kind", [
  "resume_analysis", // AI analysis (new upload or re-analysis)
  "resume_create", // resume built in the editor
  "job_match", // resume vs job description match
  "ai_write", // AI writing help in the editor (summary, bullets, skills, tailor)
  "resume_tailor", // "Tailor to a job" on the Create screen (Free: 3 ever, Pro: 30/month)
]);

// USERS
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  role: roleEnum("role").default("user"),
  // App accent color theme (see lib/accents.ts); null = default
  themeAccent: text("theme_accent"),
  // Per-category in-app / device notification switches (lib/notifications.ts);
  // null = defaults (everything on)
  notificationPrefs: jsonb("notification_prefs").$type<NotificationPrefs>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RESUMES
export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("General"),
  fileUrl: text("file_url"), // Cloudinary URL generated upon clicking "Finish"

  // Differentiating the source background
  status: resumeStatusEnum("status").default("created").notNull(),

  // 100% Flexible JSON data object containing user form entries + section ordering positions
  content: jsonb("content")
    .$type<{
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
        duration: string; // e.g., "July 2025 - Present"
        bullets: string[];
      }[];
      projects?: {
        id: string;
        title: string;
        duration: string;
        description: string[]; // Bullet points
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
      // Free-form sections from the editor (key "custom:<id>" in sectionOrder).
      // body uses the inline markup in lib/rich-text.ts.
      customSections?: { id: string; title: string; body: string }[];
      // Document-mode look settings (lib/resume-templates.ts effectiveTemplate)
      design?: {
        textScale?: "sm" | "md" | "lg";
        dividers?: boolean;
        sectionTitles?: Record<string, string>;
        /** Pro: accent colour "#rrggbb" (headings, rules, links, header band) */
        accent?: string;
        /** Pro: font family override */
        font?: "sans" | "serif";
      };
      // 🎛️ DRAG & DROP TRACKING ORDER SECTION
      // Keeps track of user preferences, e.g., ["personal", "summary", "projects", "skills"...]
      sectionOrder: string[];
    }>()
    .notNull(),

  // Store Gemini's direct resume analysis, grading flags, and tips (Nullable if manual build)
  // Shape (v1 + optional v2 fields) lives in lib/analysis-types.ts
  analysis: jsonb("analysis").$type<ResumeAnalysisData>(),

  isDefault: boolean("is_default").default(false),
  // Editor template id (lib/resume-templates.ts); null = default (Classic)
  templateId: text("template_id"),

  // Public share link (/r/<shareCode>). Off by default; the code is made the
  // first time sharing is turned on and can be regenerated (old link dies).
  shareCode: text("share_code").unique(),
  shareEnabled: boolean("share_enabled").default(false).notNull(),
  // Privacy: hide phone + address on the public page (on by default)
  shareHideContact: boolean("share_hide_contact").default(true).notNull(),
  shareViews: integer("share_views").default(0).notNull(),
  // Set on resumes made by "Tailor to a job": the job, before/after score and
  // what changed (lib/resume-tailor.ts). Null for every other resume.
  tailoredFor: jsonb("tailored_for").$type<TailoredFor>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// INTERVIEW SESSIONS
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Job Meta parameters requested by user forms
  jobRole: text("job_role").notNull(),
  jobDescription: text("job_description"),
  resumeText: text("resume_text").notNull(), // Stores raw text strings extracted locally

  status: interviewStatusEnum("status").default("in-progress"),
  transcript: text("transcript"), // Aggregated text lines appended upon completion
  // Vapi call created for this session by /api/vapi/call/web (one call per
  // session; "pending" while the call is being created)
  vapiCallId: text("vapi_call_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// INTERVIEW RESULTS
export const interviewResults = pgTable("interview_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .references(() => interviews.id, { onDelete: "cascade" })
    .unique(),
  overallScore: integer("overall_score"),
  feedback: text("feedback"),
  suggestions:
    jsonb("suggestions").$type<
      { category: string; score: number; tip: string }[]
    >(),
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// USAGE EVENTS (append-only log of metered actions, used for plan limits)
// Rows survive resume deletion (resumeId -> null) so usage can't be reset by deleting.
export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    kind: usageKindEnum("kind").notNull(),
    resumeId: uuid("resume_id").references(() => resumes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("usage_events_user_kind_idx").on(t.userId, t.kind, t.createdAt)],
);

// RESUME VERSIONS (Pro version history: snapshots of a built resume)
// Taken automatically while editing (at most one per 10 minutes), on
// "Save version", and before a restore. Deleted with their resume.
export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeId: uuid("resume_id")
      .references(() => resumes.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /** "auto" | "manual" | "restore" (typed in lib/resume-versions.ts) */
    kind: text("kind").notNull(),
    /** User's name for a manual version */
    label: text("label"),
    title: text("title").notNull(),
    templateId: text("template_id"),
    content: jsonb("content").$type<Resume["content"]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("resume_versions_resume_created_idx").on(t.resumeId, t.createdAt)],
);

// JOB MATCHES (a resume compared against a pasted job description)
// Deleted with their resume. Usage is logged separately in usage_events, so
// deleting a match doesn't give the allowance back.
export const jobMatches = pgTable(
  "job_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    resumeId: uuid("resume_id")
      .references(() => resumes.id, { onDelete: "cascade" })
      .notNull(),
    jobTitle: text("job_title").notNull().default(""),
    company: text("company").notNull().default(""),
    jobDescription: text("job_description").notNull(),
    matchScore: integer("match_score").notNull(),
    result: jsonb("result").$type<JobMatchData>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("job_matches_resume_idx").on(t.resumeId, t.createdAt)],
);

// NOTIFICATIONS (in-app bell; also pushed to the user's devices)
// kind/category are text (typed in TS) so adding a kind needs no enum migration.
// Rows older than NOTIFICATION_RETENTION_DAYS are pruned when the list loads.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").$type<NotificationKind>().notNull(),
    category: text("category").$type<NotificationCategory>().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    href: text("href"),
    // Same key for the same user is stored (and pushed) only once
    dedupeKey: text("dedupe_key"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
    uniqueIndex("notifications_user_dedupe_idx").on(t.userId, t.dedupeKey),
  ],
);

// PUSH SUBSCRIPTIONS (one row per browser/device that turned on device
// notifications). The endpoint is unique: if another account turns push on in
// the same browser, the row moves to that account.
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    label: text("label").notNull().default("Browser"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("push_subscriptions_user_idx").on(t.userId)],
);

/**
 * RELATIONSHIPS
 */

export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  interviews: many(interviews),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  user: one(users, { fields: [interviews.userId], references: [users.id] }),
  result: one(interviewResults, {
    fields: [interviews.id],
    references: [interviewResults.interviewId],
  }),
}));

export const resultsRelations = relations(interviewResults, ({ one }) => ({
  interview: one(interviews, {
    fields: [interviewResults.interviewId],
    references: [interviews.id],
  }),
}));

// TYPE INFERENCE (Select and Insert)
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Resume = InferSelectModel<typeof resumes>;
export type NewResume = InferInsertModel<typeof resumes>;

export type Interview = InferSelectModel<typeof interviews>;
export type NewInterview = InferInsertModel<typeof interviews>;

export type InterviewResult = InferSelectModel<typeof interviewResults>;
export type NewInterviewResult = InferInsertModel<typeof interviewResults>;

export type JobMatch = InferSelectModel<typeof jobMatches>;
export type ResumeVersion = InferSelectModel<typeof resumeVersions>;
export type NewJobMatch = InferInsertModel<typeof jobMatches>;

export type UsageEvent = InferSelectModel<typeof usageEvents>;
export type NewUsageEvent = InferInsertModel<typeof usageEvents>;
