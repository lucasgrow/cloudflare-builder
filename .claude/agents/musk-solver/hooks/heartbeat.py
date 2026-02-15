#!/usr/bin/env python3
"""
Heartbeat hook for Musk-Solver sessions.
Checks session state and enforces phase progression.

Usage:
  python3 heartbeat.py status    # Show current session status
  python3 heartbeat.py check     # Check if can advance phase
  python3 heartbeat.py init      # Initialize new session
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path


SESSIONS_DIR = Path("sessions")
TEMPLATES_DIR = Path(".claude/agents/musk-solver/templates")

PHASES = [
    {"num": 0, "name": "problem", "file": "00_problem.md"},
    {"num": 1, "name": "assumptions", "file": "01_assumptions.md"},
    {"num": 2, "name": "decomposition", "file": "02_decomposition.md"},
    {"num": 3, "name": "optimization", "file": "03_optimization.md"},
    {"num": 4, "name": "acceleration", "file": "04_acceleration.md"},
    {"num": 5, "name": "conclusion", "file": "05_conclusion.md"},
]


def find_active_session():
    """Find the most recent active musk-solver session."""
    if not SESSIONS_DIR.exists():
        return None

    sessions = sorted(SESSIONS_DIR.glob("musk-*"), reverse=True)
    for session in sessions:
        conclusion = session / "phases" / "05_conclusion.md"
        if not conclusion.exists() or "APPROVED" not in conclusion.read_text():
            return session
    return None


def get_working_md(session_dir):
    """Read WORKING.md from session."""
    working_path = session_dir / "WORKING.md"
    if working_path.exists():
        return working_path.read_text()
    return None


def get_current_phase(session_dir):
    """Determine current phase based on completed phase files."""
    phases_dir = session_dir / "phases"
    if not phases_dir.exists():
        return 0, PHASES[0]

    for i, phase in enumerate(PHASES):
        phase_file = phases_dir / phase["file"]
        if not phase_file.exists():
            return i, phase

        content = phase_file.read_text()
        # Check if phase exit checklist is complete
        if "- [ ]" in content:
            return i, phase

    return len(PHASES), None  # All complete


def check_phase_exit(session_dir, phase):
    """Check if phase exit criteria are met."""
    phase_file = session_dir / "phases" / phase["file"]
    if not phase_file.exists():
        return False, "Phase file not created"

    content = phase_file.read_text()

    # Count unchecked items in exit checklist
    lines = content.split("\n")
    in_checklist = False
    unchecked = []

    for line in lines:
        if "Phase Exit Checklist" in line:
            in_checklist = True
            continue
        if in_checklist and line.strip().startswith("- [ ]"):
            unchecked.append(line.strip())

    if unchecked:
        return False, f"{len(unchecked)} exit criteria not met"

    return True, "OK"


def init_session(problem_description=""):
    """Initialize a new musk-solver session."""
    timestamp = datetime.now().strftime("%Y-%m-%d-%H%M")
    session_id = f"musk-{timestamp}"
    session_dir = SESSIONS_DIR / session_id

    # Create directories
    (session_dir / "phases").mkdir(parents=True, exist_ok=True)
    (session_dir / "memory").mkdir(exist_ok=True)
    (session_dir / "shared").mkdir(exist_ok=True)

    # Copy WORKING.md template
    working_template = TEMPLATES_DIR / "WORKING.md"
    if working_template.exists():
        content = working_template.read_text()
        content = content.replace("{session_id}", session_id)
        content = content.replace("{timestamp}", datetime.now().isoformat())
        content = content.replace("{one_line_description}", problem_description or "TBD")
        (session_dir / "WORKING.md").write_text(content)

    # Initialize shared files
    (session_dir / "shared" / "tasks.json").write_text("[]")
    (session_dir / "shared" / "comments.json").write_text("[]")
    (session_dir / "shared" / "activity.json").write_text("[]")

    # Initialize memory
    today = datetime.now().strftime("%Y-%m-%d")
    (session_dir / "memory" / f"{today}.md").write_text(f"# {today} - Session Started\n\n## Events\n- Session initialized\n")
    (session_dir / "memory" / "MEMORY.md").write_text("# Long-term Memory\n\n## Learnings\n\n## Patterns\n")

    print(f"Session initialized: {session_dir}")
    return session_dir


def show_status():
    """Show current session status."""
    session = find_active_session()
    if not session:
        print("No active musk-solver session found.")
        print("Run: python3 heartbeat.py init")
        return

    print(f"Session: {session.name}")
    print("-" * 40)

    # Current phase
    phase_num, phase = get_current_phase(session)
    if phase:
        print(f"Current Phase: {phase_num} - {phase['name']}")
        complete, msg = check_phase_exit(session, phase)
        print(f"Exit Criteria: {'MET' if complete else 'NOT MET'} - {msg}")
    else:
        print("All phases complete!")

    print()

    # Phase status
    print("Phase Status:")
    for p in PHASES:
        phase_file = session / "phases" / p["file"]
        if phase_file.exists():
            content = phase_file.read_text()
            if "- [ ]" not in content.split("Phase Exit Checklist")[-1] if "Phase Exit Checklist" in content else content:
                status = "✓ DONE"
            else:
                status = "○ IN PROGRESS"
        else:
            status = "  PENDING"
        print(f"  {status} Phase {p['num']}: {p['name']}")

    print()

    # WORKING.md summary
    working = get_working_md(session)
    if working:
        lines = working.split("\n")
        for line in lines:
            if line.startswith("## Current Focus"):
                idx = lines.index(line)
                if idx + 1 < len(lines):
                    print(f"Current Focus: {lines[idx + 1]}")
                break


def heartbeat_check():
    """Run heartbeat check for active session."""
    session = find_active_session()
    if not session:
        print("HEARTBEAT_NONE - No active session")
        return

    phase_num, phase = get_current_phase(session)

    if not phase:
        print("HEARTBEAT_DONE - All phases complete")
        return

    # Check tasks
    tasks_file = session / "shared" / "tasks.json"
    if tasks_file.exists():
        tasks = json.loads(tasks_file.read_text())
        in_progress = [t for t in tasks if t.get("status") == "in_progress"]
        blocked = [t for t in tasks if t.get("status") == "blocked"]

        if blocked:
            print(f"HEARTBEAT_BLOCKED - {len(blocked)} blocked tasks")
            for t in blocked:
                print(f"  - {t.get('title')}")
            return

        if in_progress:
            print(f"HEARTBEAT_WORKING - Phase {phase_num}, {len(in_progress)} tasks in progress")
            return

    # Check if phase can advance
    complete, msg = check_phase_exit(session, phase)
    if complete:
        print(f"HEARTBEAT_PHASE_READY - Phase {phase_num} ready to advance")
    else:
        print(f"HEARTBEAT_OK - Phase {phase_num} - {msg}")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "status"

    if mode == "status":
        show_status()
    elif mode == "check":
        heartbeat_check()
    elif mode == "init":
        problem = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else ""
        init_session(problem)
    else:
        print(f"Unknown mode: {mode}")
        print("Usage: heartbeat.py [status|check|init]")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
