import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── NextAuth tables ──────────────────────────────────────────────

export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ── App tables ───────────────────────────────────────────────────

export const userSettings = sqliteTable("user_settings", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme", { enum: ["light", "dark", "system"] }).default("system"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ── Creative Post tables ─────────────────────────────────────────

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => `prj_${crypto.randomUUID()}`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  paletteJson: text("palette_json").notNull(),
  typographyJson: text("typography_json").notNull(),
  logoDescription: text("logo_description"),
  promptInjection: text("prompt_injection").notNull(),
  logoDarkR2Key: text("logo_dark_r2_key"),
  logoLightR2Key: text("logo_light_r2_key"),
  photoR2Key: text("photo_r2_key"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const projectRefs = sqliteTable("project_refs", {
  id: text("id").primaryKey().$defaultFn(() => `prf_${crypto.randomUUID()}`),
  projectId: text("project_id").notNull().references(() => projects.id),
  r2Key: text("r2_key").notNull(),
  type: text("type").notNull(), // 'style_ref' | 'extra_photo'
  label: text("label"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey().$defaultFn(() => `tpl_${crypto.randomUUID()}`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  promptTemplate: text("prompt_template").notNull(),
  layoutDescription: text("layout_description"),
  isCustom: integer("is_custom").default(0),
  projectId: text("project_id").references(() => projects.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey().$defaultFn(() => `job_${crypto.randomUUID()}`),
  projectId: text("project_id").notNull().references(() => projects.id),
  templateId: text("template_id").notNull().references(() => templates.id),
  headline: text("headline").notNull(),
  benefitsJson: text("benefits_json"),
  ctaText: text("cta_text").notNull(),
  keywordsJson: text("keywords_json"),
  status: text("status").notNull().default("queued"), // queued | processing | done | failed
  errorMessage: text("error_message"),
  outputR2Key: text("output_r2_key"),
  parentJobId: text("parent_job_id"),
  editPrompt: text("edit_prompt"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
});

export const briefings = sqliteTable("briefings", {
  id: text("id").primaryKey().$defaultFn(() => `brf_${crypto.randomUUID()}`),
  projectId: text("project_id").notNull().references(() => projects.id),
  inputText: text("input_text").notNull(),
  extractedJson: text("extracted_json"),
  status: text("status").default("pending"), // pending | processed | approved
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
