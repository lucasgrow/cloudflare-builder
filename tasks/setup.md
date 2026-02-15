# 🔧 Repository Setup - Collaborative Development System

Claude, you are setting up the **Collaborative Development System** for this repository. This system enables incremental, test-driven development with real-time human feedback.

## Your Task

Analyze this repository and fill in the configuration variables that will be used in the collaborative workflow. Follow these steps:

---

## Step 1: Analyze Repository Structure

Explore the following files and directories:

1. **`package.json`** or **`pyproject.toml`** or **`Cargo.toml`** or similar
   - Identify: project name, package manager (npm/bun/yarn/pnpm/pip/cargo/etc), main scripts

2. **Root README.md** or **documentation files**
   - Extract: project description, tech stack, key features

3. **Configuration files**
   - Look for: `next.config.js`, `vite.config.js`, `tsconfig.json`, `.env.example`, `wrangler.toml`, etc.
   - Identify: framework, runtime environment, build tools

4. **Directory structure**
   - Map out: main source directories (`src/`, `app/`, `lib/`, etc.)
   - Identify: API routes, components, database schemas, etc.

5. **Git status and branches**
   - Check: current branch, main/master branch name, any uncommitted changes

---

## Step 2: Extract Key Information

Based on your analysis, determine these variables:

### Project Info
- **PROJECT_NAME**: The name of this project
- **PROJECT_DESCRIPTION**: Brief 1-2 sentence description of what this project does

### Tech Stack
- **LANGUAGE**: Primary programming language (TypeScript, Python, Rust, Go, etc.)
- **FRAMEWORK**: Main framework (Next.js, React, FastAPI, Flask, Actix, etc.)
- **RUNTIME**: Runtime environment (Node.js, Bun, Python, etc.)
- **PACKAGE_MANAGER**: Package manager (npm, bun, yarn, pnpm, pip, cargo, etc.)

### Development Environment
- **DEV_COMMAND**: Command to start dev server (e.g., `bun run dev`, `npm run dev`, `python manage.py runserver`)
- **DEV_PORT**: Port number where dev server runs (e.g., 3000, 8000, 5173)
- **DEV_PROTOCOL**: Protocol used (http or https)
- **DEV_URL**: Full local development URL (e.g., `http://localhost:3000`)

### Build & Test Commands
- **BUILD_COMMAND**: Build command (e.g., `bun run build`, `npm run build`, `cargo build`)
- **TEST_COMMAND**: Test command (e.g., `bun test`, `npm test`, `pytest`, `cargo test`)
- **LINT_COMMAND**: Linting command if available (e.g., `npm run lint`, `eslint .`, `flake8`)

### Infrastructure (if applicable)
- **DATABASE**: Database type (PostgreSQL, MySQL, SQLite, D1, MongoDB, etc.) or "None"
- **DATABASE_ORM**: ORM/Query builder (Drizzle, Prisma, SQLAlchemy, Diesel, etc.) or "None"
- **CLOUD_PROVIDER**: Cloud provider (Cloudflare, AWS, Vercel, Railway, etc.) or "None"
- **SPECIAL_TOOLS**: Any special tools or services (Workers AI, Supabase, Redis, etc.)

### File Paths
- **SOURCE_DIR**: Main source directory path (e.g., `/src`, `/app`, `/lib`)
- **API_ROUTES_DIR**: API routes directory if exists (e.g., `/app/api`, `/src/routes`)
- **CONFIG_FILES**: List important config files (e.g., `wrangler.toml`, `next.config.js`, `.env.example`)

### Git Info
- **MAIN_BRANCH**: Name of main branch (usually `main` or `master`)
- **CURRENT_BRANCH**: Current git branch

---

## Step 3: Present Configuration Summary

After gathering all information, present it in this format:

```markdown
## 📋 Repository Configuration Summary

### Project
- **Name**: [PROJECT_NAME]
- **Description**: [PROJECT_DESCRIPTION]

### Tech Stack
- **Language**: [LANGUAGE]
- **Framework**: [FRAMEWORK]
- **Runtime**: [RUNTIME]
- **Package Manager**: [PACKAGE_MANAGER]

### Development
- **Dev Command**: `[DEV_COMMAND]`
- **Dev URL**: [DEV_URL]
- **Build Command**: `[BUILD_COMMAND]`
- **Test Command**: `[TEST_COMMAND]`

### Infrastructure
- **Database**: [DATABASE] ([DATABASE_ORM])
- **Cloud Provider**: [CLOUD_PROVIDER]
- **Special Tools**: [SPECIAL_TOOLS]

### Structure
- **Source Directory**: `[SOURCE_DIR]`
- **API Routes**: `[API_ROUTES_DIR]`
- **Config Files**: [CONFIG_FILES]

### Git
- **Main Branch**: [MAIN_BRANCH]
- **Current Branch**: [CURRENT_BRANCH]
```

---

## Step 4: Ask for Confirmation

After presenting the summary, ask:

**"Is this configuration correct? Should I proceed to initialize the collaborative workflow files with these settings?"**

---

## Step 5: Initialize Workflow Files (After User Confirms)

Once the user confirms, update these files with the collected variables:

1. **`tasks/prompt.md`** - Replace all `{{VARIABLE}}` placeholders with actual values
2. **`tasks/README.md`** - Replace all `{{VARIABLE}}` placeholders with actual values

Then inform the user:

**"✅ Collaborative workflow initialized! You can now use the workflow by reading `tasks/prompt.md` and telling me which task you want to work on."**

---

## Notes

- If you can't find a specific value, use `"Unknown"` or `"Not configured"` and note it in the summary
- If the repository has multiple frameworks/languages, list the primary one
- Be thorough but concise - the goal is to understand the project quickly
- If you find a `TODO.md` or similar task file, note its location

---

**Ready to begin?** Start by analyzing the repository structure.
