CREATE TABLE `projects` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `palette_json` text NOT NULL,
  `typography_json` text NOT NULL,
  `logo_description` text,
  `prompt_injection` text NOT NULL,
  `logo_dark_r2_key` text,
  `logo_light_r2_key` text,
  `photo_r2_key` text,
  `created_by` text,
  `created_at` text,
  FOREIGN KEY (`created_by`) REFERENCES `user`(`id`)
);

CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);

CREATE TABLE `project_refs` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `r2_key` text NOT NULL,
  `type` text NOT NULL,
  `label` text,
  `created_at` text,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
);

CREATE TABLE `templates` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `prompt_template` text NOT NULL,
  `layout_description` text,
  `is_custom` integer DEFAULT 0,
  `project_id` text,
  `created_at` text,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
);

CREATE UNIQUE INDEX `templates_slug_unique` ON `templates` (`slug`);

CREATE TABLE `jobs` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `template_id` text NOT NULL,
  `headline` text NOT NULL,
  `benefits_json` text,
  `cta_text` text NOT NULL,
  `keywords_json` text,
  `status` text NOT NULL DEFAULT 'queued',
  `error_message` text,
  `output_r2_key` text,
  `parent_job_id` text,
  `edit_prompt` text,
  `created_by` text,
  `created_at` text,
  `completed_at` text,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`),
  FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `user`(`id`)
);

CREATE TABLE `briefings` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `input_text` text NOT NULL,
  `extracted_json` text,
  `status` text DEFAULT 'pending',
  `created_by` text,
  `created_at` text,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `user`(`id`)
);
