# Task [N]: [Brief Description] - Implementation Plan

**Task Number:** [N]
**Created:** [YYYY-MM-DDTHH:MM:SSZ]
**Status:** 🟡 Planning | 🔵 Ready to Implement | 🟢 In Progress | ✅ Completed
**TODO Reference:** Task [X.Y] in `/TODO.md` (e.g., Task 1.1, 1.2, etc.)

---

## 1. Exploration & Context

### Current State
- Describe what exists now
- List relevant files/directories
- Note any dependencies or constraints

### References Reviewed
- [ ] Checked `/TODO.md` for task requirements
- [ ] Reviewed related existing code
- [ ] Checked `/.claude/CLAUDE.md` for conventions (if exists)
- [ ] Reviewed Cloudflare docs (if applicable)
- [ ] Read previous task progress (if applicable)

### Relevant Code Patterns
```typescript
// Example of existing pattern we'll follow
```

---

## 2. Clarifying Questions

### Answered
- **Q:** [Question about implementation detail]
- **A:** [Decision made]

### Open Questions
- [ ] [Unresolved question that needs answering]

---

## 3. File Tree of Changes

```
/Users/lfari/Projects/cloudflare-builder/
├── wrangler.toml                       UPDATE
├── package.json                        UPDATE
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── new-route/
│   │   │       └── route.ts            NEW
│   │   └── page.tsx                    UPDATE
│   ├── components/
│   │   └── new-component.tsx           NEW
│   ├── lib/
│   │   └── helpers.ts                  UPDATE
│   └── server/
│       └── db/
│           └── schema.ts               UPDATE
└── drizzle/
    └── migrations/
        └── 0002_name.sql               NEW (generated)
```

**Summary:**
- [N] files to update
- [N] new files to create
- [N] files to delete (if any)

---

## 4. File-by-File Implementation Plan

### File 1: `[path/to/file.ts]` ([UPDATE|NEW|DELETE])

**Purpose:** [Why we're changing this file]

**Changes:**
1. [First change description]
2. [Second change description]

**Code Snippet:**
```typescript
// Show the main implementation
export function newFunction() {
  // ...
}
```

**Dependencies:**
- Requires: [other files/packages]
- Impacts: [what depends on this]

**Testing:**
- [ ] [Test case 1]
- [ ] [Test case 2]

---

### File 2: `[path/to/another-file.ts]` ([UPDATE|NEW|DELETE])

**Purpose:** [Why we're changing this file]

**Changes:**
1. [Change description]

**Code Snippet:**
```typescript
// Implementation snippet
```

**Dependencies:**
- Requires: [dependencies]

**Testing:**
- [ ] [Test case]

---

[Repeat for all files...]

---

## 5. Implementation Order

Implement changes in this order to avoid breaking dependencies:

1. **Step 1:** [First thing to implement]
   - Files: `file1.ts`, `file2.ts`
   - Why first: [reason]

2. **Step 2:** [Second thing]
   - Files: `file3.ts`
   - Why now: [reason]

3. **Step 3:** [Third thing]
   - Files: `file4.ts`, `file5.ts`
   - Why last: [reason]

---

## 6. Rationale & Context

### Why These Changes?
- [Explain the overall approach]
- [Justify key decisions]

### Alternative Approaches Considered
- **Option A:** [Description] - Rejected because [reason]
- **Option B:** [Description] - Chosen because [reason]

### Side Effects & Risks
- ⚠️ [Potential issue 1]
- ⚠️ [Potential issue 2]

### Mitigation Strategies
- [How we'll handle each risk]

---

## 7. Testing Plan

### Unit Tests
```bash
# Commands to run tests
bun test [specific-test-file]
```

**Test Cases:**
- [ ] Test case 1: [description]
- [ ] Test case 2: [description]

### Integration Tests
```bash
# Commands to run integration tests
curl -X POST http://localhost:3000/api/endpoint -d '{}'
```

**Scenarios:**
- [ ] Scenario 1: [description]
- [ ] Scenario 2: [description]

### Manual Testing
- [ ] Start dev server: `bun run dev`
- [ ] Navigate to: [URL]
- [ ] Verify: [expected behavior]

---

## 8. Dependencies & Prerequisites

### Must Be Completed First
- [ ] [Task from previous phase]
- [ ] [External dependency]

### Packages to Install
```bash
bun add [package-name]
bun add -D [dev-package]
```

### Environment Variables
```bash
# Add to .dev.vars or .env
VARIABLE_NAME=value
```

---

## 9. Success Criteria

This task is complete when:

- [ ] All files listed in File Tree are created/updated
- [ ] All tests pass
- [ ] Manual testing shows expected behavior
- [ ] No TypeScript errors
- [ ] No breaking changes to existing features
- [ ] Code committed with proper message
- [ ] `TODO.md` checkboxes marked complete
- [ ] `progress.md` has final timestamp entry

---

## 10. Next Steps

After completing this task:

1. Update `/TODO.md` checkboxes for this task
2. Final entry in `progress.md` with "Task complete" status
3. Commit changes: `git commit -m "feat(task-N): [brief-description]"`
4. Wait for user to specify next task

---

**Notes:**
- [Any additional notes, warnings, or reminders]
