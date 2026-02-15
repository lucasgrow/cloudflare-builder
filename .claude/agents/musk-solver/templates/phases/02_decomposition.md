# Phase 2: Decomposition & Deletion

## Problem Decomposition

### Hierarchical Breakdown
```
[Problem]
├── [Component 1]
│   ├── [Sub-component 1.1]
│   │   ├── [Element 1.1.1] ← ATOMIC
│   │   └── [Element 1.1.2] ← ATOMIC
│   └── [Sub-component 1.2]
├── [Component 2]
│   └── ...
└── [Component 3]
```

### Atomic Elements List

| # | Element | Purpose | Who Asked | If Remove | Verdict |
|---|---------|---------|-----------|-----------|---------|
| 1 | | | | | KEEP/DELETE |
| 2 | | | | | KEEP/DELETE |
| 3 | | | | | KEEP/DELETE |

## Deletion Candidates

### Marked for DELETE

| # | Item | Reason for Deletion | Risk if Deleted | Test Needed |
|---|------|---------------------|-----------------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Deletion Target:** ≥20% of total items
**Current:** {X}% ({Y} of {Z} items)

### "Zero-Based" Check

Para cada item que sobreviveu:
> "Se começasse do zero, incluiria isto?"

| # | Item | Zero-Based Answer | Keep? |
|---|------|-------------------|-------|
| 1 | | Yes/No - because | |
| 2 | | Yes/No - because | |

## Minimum Viable Version

Se tivéssemos que fazer com 50% dos recursos:
{Descrição da versão mínima}

What would we cut?
- {item 1}
- {item 2}

## Human Approval Required

**ATENÇÃO: Esta fase requer aprovação humana para deleções.**

### Deletions Pending Approval

| # | Item | Impact | Reversible? | Approved |
|---|------|--------|-------------|----------|
| 1 | | | Yes/No | [ ] |
| 2 | | | Yes/No | [ ] |

### Human Decision
- [ ] APPROVED - proceed with deletions
- [ ] MODIFIED - changes requested: {details}
- [ ] REJECTED - reason: {details}

Approved by: {name}
Date: {timestamp}

## Post-Deletion Tests

| # | Deleted Item | Test | Result |
|---|--------------|------|--------|
| 1 | | System works without it? | PASS/FAIL |
| 2 | | System works without it? | PASS/FAIL |

## Phase Exit Checklist
- [ ] Problema decomposto em átomos
- [ ] Mínimo 20% marcados DELETE
- [ ] Humano aprovou deleções
- [ ] tester validou deleções
- [ ] critic revisou
