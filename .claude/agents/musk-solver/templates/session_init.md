# Session Initialization Guide

## Quick Start

```bash
# Initialize a new session
python3 .claude/agents/musk-solver/hooks/heartbeat.py init "descrição do problema"

# Or via command
/musk-solve descrição do problema
```

## What Gets Created

```
sessions/musk-{timestamp}/
├── WORKING.md                 # Estado atual - LER PRIMEIRO
├── memory/
│   ├── MEMORY.md              # Learnings permanentes
│   └── YYYY-MM-DD.md          # Daily notes
├── shared/
│   ├── tasks.json             # []
│   ├── comments.json          # []
│   └── activity.json          # []
├── phases/
│   └── (created as you progress)
└── summary.md                 # (created at end)
```

## Initial WORKING.md

O WORKING.md inicial terá:
- Session ID
- Timestamp
- Problem description (se fornecida)
- Phase: 0 (Setup)
- Empty subagent status table

## First Steps After Init

1. **Read WORKING.md** - Always first
2. **Define problem** - Fill out phases/00_problem.md
3. **Set scope** - What's IN and OUT
4. **Identify ground truths** - At least 3
5. **Update WORKING.md** - Current focus and next steps

## Heartbeat Commands

```bash
# Check session status
python3 .claude/agents/musk-solver/hooks/heartbeat.py status

# Run heartbeat check
python3 .claude/agents/musk-solver/hooks/heartbeat.py check
```

## Manual Session Creation

If you prefer to create manually:

```bash
# Create directories
mkdir -p sessions/musk-YYYY-MM-DD-HHMM/{phases,memory,shared}

# Copy WORKING.md template
cp .claude/agents/musk-solver/templates/WORKING.md sessions/musk-YYYY-MM-DD-HHMM/

# Initialize shared files
echo "[]" > sessions/musk-YYYY-MM-DD-HHMM/shared/tasks.json
echo "[]" > sessions/musk-YYYY-MM-DD-HHMM/shared/comments.json
echo "[]" > sessions/musk-YYYY-MM-DD-HHMM/shared/activity.json

# Copy phase templates as needed
cp .claude/agents/musk-solver/templates/phases/00_problem.md sessions/musk-YYYY-MM-DD-HHMM/phases/
```
