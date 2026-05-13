import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
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

// USERS
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  role: roleEnum("role").default("user"),
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
  category: text("category").notNull().default("General"), // e.g., "Tech", "Healthcare", "VA"
  content: jsonb("content").notNull(), // Structured JSON from Gemini

  // Professional touches
  isDefault: boolean("is_default").default(false),
  templateId: text("template_id").default("modern"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// INTERVIEW SESSIONS
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "set null",
  }),

  vapiCallId: text("vapi_call_id").unique(),
  status: interviewStatusEnum("status").default("in-progress"),

  // Metadata from Vapi end-of-call report
  transcript: text("transcript"),
  recordingUrl: text("recording_url"),
  durationSeconds: integer("duration_seconds"),

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

  suggestions: jsonb("suggestions").$type<
    {
      category: string;
      score: number;
      tip: string;
    }[]
  >(),

  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * RELATIONSHIPS
 */

export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  interviews: many(interviews),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  user: one(users, {
    fields: [interviews.userId],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [interviews.resumeId],
    references: [resumes.id],
  }),
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
