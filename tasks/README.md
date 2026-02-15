# Tasks Implementation Guidelines

This directory contains detailed implementation plans and progress tracking for collaborative development.

## Directory Structure

```
tasks/
├── README.md                           # This file - guidelines and conventions
├── setup.md                            # Initial setup prompt (run first!)
├── prompt.md                           # Collaborative mode prompt (template with variables)
├── template.md                         # Template for creating new task plans
├── task-1-[description]/
│   ├── plan.md                         # Implementation plan (created before)
│   └── progress.md                     # Detailed progress log (updated during)
├── task-2-[description]/
│   ├── plan.md
│   └── progress.md
├── task-3-[description]/
│   ├── plan.md
│   └── progress.md
└── ... (incremental task numbers)
```

## How to Use This System

### First Time Setup (New Repository)
1. **Run setup first**: Copy content from `setup.md` and paste it in your conversation with Claude
2. Claude will analyze your repository and collect project information
3. Claude will ask you to confirm the detected configuration
4. Once confirmed, Claude will fill in the variables in `prompt.md` and other templates

### Starting a New Session (After Setup)
1. Copy content from `prompt.md` (now filled with your project details) and paste it in your conversation with Claude
2. Claude will read it and work in collaborative mode
3. Tell Claude which task you want to work on

## Workflow

### 1. Starting a Task

When you want to work on a specific task:

1. Tell Claude: **"Implement [description] using collaborative mode"**
   - Example: "Implement user authentication using collaborative mode"
   - Example: "Add database migration using collaborative mode"
2. Claude will:
   - Read `prompt.md` automatically (already filled with your project details)
   - Read `template.md` for structure
   - Ask what task number this is (if not specified)
   - Create `task-N-[description]/` directory
   - Create `plan.md` from template
   - Fill out the plan and ask for your approval
3. After you approve the plan, implementation begins

### 2. During Implementation

For each task/file you work on:

1. Add entry to `progress.md` with:
   - Timestamp (ISO 8601 format)
   - Task description
   - File(s) affected
   - Implementation details
   - Testing results
   - Issues encountered

2. Use this bash command to get timestamp:
   ```bash
   date -u +"%Y-%m-%dT%H:%M:%SZ"
   ```

3. Mark checkboxes in `/TODO.md` as you complete them

### 3. After Completing a Task

1. Review `progress.md` for completeness
2. Verify all tests passed
3. Commit changes with descriptive message
4. Update `/TODO.md` checkboxes
5. Move to next task

## File Naming Conventions

- `plan.md` - Implementation plan (created BEFORE coding)
- `progress.md` - Detailed progress log (updated DURING coding)
- Task directories: `task-N-brief-description/` where N is incremental (1, 2, 3...)
  - Example: `task-1-setup-authentication/`
  - Example: `task-2-add-api-endpoints/`
  - Example: `task-3-database-migration/`

## Progress Log Format

Each entry in `progress.md` should follow this structure:

```markdown
### [YYYY-MM-DDTHH:MM:SSZ] Task Name

**Status:** 🟡 In Progress | ✅ Completed | ❌ Blocked

**Files Affected:**
- `src/path/to/file.ts` (UPDATE)
- `src/path/to/new-file.ts` (NEW)

**Implementation Details:**
- What was implemented
- Key decisions made
- Code patterns used

**Code Changes:**
```typescript
// Brief snippet showing main change
```

**Testing:**
- [ ] Test case 1
- [x] Test case 2

**Issues/Notes:**
- Any problems encountered
- Workarounds applied
- TODOs for later
```

## Implementation Plan Format

Each `plan.md` should follow the structure in `TEMPLATE.md`:

1. **Exploration** - Understand existing code
2. **Questions** - Clarify ambiguities
3. **File Tree** - Visual overview of changes
4. **File-by-File Plan** - Detailed change descriptions
5. **Rationale** - Why these changes
6. **Testing Plan** - How to validate

## Best Practices

### ✅ DO

- Write the plan BEFORE writing code
- Update progress.md in real-time as you work
- Include timestamps for all entries
- Document decisions and rationale
- Add code snippets to illustrate changes
- Test incrementally and document results
- Commit frequently with references to task files

### ❌ DON'T

- Skip writing the plan
- Backfill progress.md after completing work
- Leave entries without timestamps
- Skip testing steps
- Make multiple unrelated changes in one session

## Commit Message Format

When committing work from a task phase:

```
feat(phase-N): Brief description of changes

Implements task X.Y from TODO.md
See tasks/phase-N-name/progress.md for details

- Bullet point summary
- Of main changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Example Workflow

```bash
# First time in new repository
# You: [paste content from setup.md]
# Claude analyzes repo and shows configuration
# You: "Yes, correct"
# Claude fills in prompt.md with variables

# Regular session starts
# You: "Implement user authentication using collaborative mode"

# Claude creates:
# tasks/task-1-user-authentication/plan.md
# tasks/task-1-user-authentication/progress.md

# Claude asks: "Ready to start?"
# You: "OK"

# Claude implements step by step
# You test each step
# Claude updates progress.md with timestamps

# When done:
# Claude: "Task 1 complete. Ready for commit?"
# You: "Committed ✅"

# Next task:
# You: "Implement API endpoints using collaborative mode"
# (Task 2 begins...)
```

## References

- Main implementation checklist: `/TODO.md` (create one if it doesn't exist)
- Project conventions: `/.claude/CLAUDE.md` (optional, for project-specific instructions)
- This system is framework-agnostic and works with any tech stack

---

**Last Updated:** 2026-02-11
