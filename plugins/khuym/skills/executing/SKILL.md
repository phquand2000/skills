---
name: executing
description: >-
  Per-agent worker procedure for the khuym ecosystem. Load when you are a worker subagent
  spawned by the khuym:swarming skill via the `codex` MCP tool. Implements one bead per
  invocation: register with Agent Mail, read context, reserve files, implement, verify,
  close, and report back to the orchestrator. Workers do NOT loop — each `codex()` call
  handles exactly one bead. The orchestrator decides next steps between turns.
metadata:
  ecosystem: khuym
  dependencies:
    - id: beads-cli
      kind: command
      command: br
      missing_effect: unavailable
      reason: Workers read, update, and close beads through br.
    - id: beads-viewer
      kind: command
      command: bv
      missing_effect: unavailable
      reason: Worker self-routing relies on bv robot priority output.
    - id: agent-mail
      kind: mcp_server
      server_names: [mcp_agent_mail]
      config_sources: [codex_project_config, codex_global_config]
      missing_effect: unavailable
      reason: Reservations, coordination, and reporting are executed via Agent Mail.
---

# Executing — Worker Procedure (1 Bead Per Call)

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and note this in your report — do not fabricate content.

You are a **worker subagent** spawned by the swarming orchestrator via `codex()` MCP tool. Your job is to implement **exactly one bead**, then return a structured report. You do not loop. You do not pick up additional beads after completion.

## Execution Model

```
Step 1: Register → Step 2: Read Context → Step 3: Post ONLINE → Step 4: Reserve Files
→ Step 5: Implement → Step 6: Verify → Step 7: Close & Report
```

One pass. No loop-back. The orchestrator processes your response and decides whether to spawn another call.

---

## Step 1: Confirm Identity

Your Agent Mail identity is **pre-registered by the orchestrator**. You receive `AGENT_MAIL_NAME` in your spawn prompt. Use it for all Agent Mail calls — do NOT register again.

If `AGENT_MAIL_NAME` is missing from your prompt, use `macro_start_session` MCP tool as fallback:
```
startup = macro_start_session(
  human_key="<project-root-path>",
  program="codex-cli",
  model="gpt-5.4",
  task_description="khuym worker execution"
)
AGENT_MAIL_NAME = startup.agent.name
```

---

## Step 2: Read Project Context

Read in this order:

1. **AGENTS.md** — project operating manual (mandatory; skip nothing)
2. If present: `node .codex/khuym_status.mjs --json` — quick scout
3. **.khuym/STATE.md** — current project focus and active blockers
4. **history/\<feature\>/CONTEXT.md** — locked decisions that MUST be honored

If any file does not exist, note the absence and proceed.

---

## Step 3: Post ONLINE

Before touching any files, post to the epic thread:

```
send_message(
  project_key="<PROJECT_KEY>",
  sender_name=AGENT_MAIL_NAME,
  to=["<COORDINATOR_AGENT_NAME>"],
  subject="[ONLINE] " + AGENT_MAIL_NAME + " ready",
  body_md="Agent Mail name: " + AGENT_MAIL_NAME + "\nAGENTS.md: read\nAssigned bead: <BEAD_ID>\nNext: reserve files then implement.",
  thread_id="<EPIC_ID>",
  topic="<EPIC_TOPIC>"
)
```

Then immediately poll:
```
fetch_inbox(
  project_key="<PROJECT_KEY>",
  agent_name=AGENT_MAIL_NAME,
  topic="<EPIC_TOPIC>"
)
```

Do not proceed to Step 4 until this is done.

---

## Step 4: Reserve Files

Read the bead fully:
```bash
br show <BEAD_ID>
```

Understand: description, dependencies, verification criteria, file scope, decision IDs from CONTEXT.md.

Reserve every file this bead will modify:
```
file_reservation_paths(
  project_key="<PROJECT_KEY>",
  agent_name=AGENT_MAIL_NAME,
  paths=[<files from bead scope>],
  reason="Working bead <BEAD_ID>"
)
```

**If reservation returns a conflict:**
```
send_message(
  project_key="<PROJECT_KEY>",
  sender_name=AGENT_MAIL_NAME,
  to=["<COORDINATOR_AGENT_NAME>"],
  subject="[FILE CONFLICT] <path/to/file>",
  body_md="Need: [list]. Held by: [holder]. Bead: <BEAD_ID>. Awaiting decision.",
  thread_id="<EPIC_ID>",
  topic="<EPIC_TOPIC>"
)
```
Stop. Do not proceed without reservations. Keep polling `fetch_inbox(...)` while waiting.

---

## Step 5: Implement

### Read before writing

Read every source file you will modify. Do not write from memory or assumptions.

### Honor CONTEXT.md locked decisions

Scan the bead description for decision IDs (D1, D2, …). For each:
1. Read the entry in `history/<feature>/CONTEXT.md`
2. Implement exactly as locked — do not reinterpret

### Follow existing patterns

Match naming conventions, error handling, import styles, and test structures.

### No pseudo-implementations

Every artifact must be:
- **Substantive**: real logic, not stubs or TODOs
- **Wired**: imported, exported, integrated — not floating code

---

## Step 6: Verify

Run the bead's verification criteria exactly as written:
```bash
# Whatever the bead specifies — examples:
npm test -- --testPathPattern="<affected-module>"
npm run build
npm run lint
```

**If verification fails:**
1. Read the failure carefully, fix root cause, re-run (max 2 attempts)
2. If still failing after 2 attempts:
```
send_message(
  project_key="<PROJECT_KEY>",
  sender_name=AGENT_MAIL_NAME,
  to=["<COORDINATOR_AGENT_NAME>"],
  subject="[BLOCKED] <BEAD_ID> — verification failing",
  body_md="Failure: [exact error]. Attempted: [what you tried]. Need: [specific help].",
  thread_id="<EPIC_ID>",
  topic="<EPIC_TOPIC>"
)
```
Report the failure in your structured response. Do not close the bead.

---

## Step 7: Close & Report

Complete all sub-steps in order. Do not skip any.

### 7a. Close the bead
```bash
br close <BEAD_ID> --reason "Completed: <one-line summary>"
```

### 7b. Atomic git commit
```bash
git add <files-you-modified>
git commit -m "feat(<BEAD_ID>): <summary matching br close reason>"
```

One commit per bead. Do not batch multiple beads.

### 7c. Release file reservations
```
release_file_reservations(
  project_key="<PROJECT_KEY>",
  agent_name=AGENT_MAIL_NAME,
  paths=[<files-you-modified>]
)
```

Release **before** sending the completion report.

### 7d. Send completion report
```
send_message(
  project_key="<PROJECT_KEY>",
  sender_name=AGENT_MAIL_NAME,
  to=["<COORDINATOR_AGENT_NAME>"],
  subject="[DONE] <BEAD_ID>",
  body_md="Worker: <AGENT_MAIL_NAME>. Implemented: [summary]. Files: [list]. Verification: [result]. Commit: [hash].",
  thread_id="<EPIC_ID>",
  topic="<EPIC_TOPIC>"
)
```

### 7e. End with structured response

Your final output must include this block:
```
BEAD: <BEAD_ID>
STATUS: done | blocked | verification-failed
AGENT_MAIL_NAME: <your name>
COMMIT: <hash or N/A>
FILES: <list of modified files>
VERIFICATION: pass | fail (<error summary if fail>)
BLOCKER: none | <description>
```

---

## Post-Compact Recovery

**If you detect context compaction** (gaps in context, conversation was summarized):

**STOP immediately.**

Re-read in this exact order before any further action:
1. `AGENTS.md`
2. `history/<feature>/CONTEXT.md`
3. The assigned bead: `br show <BEAD_ID>`
4. Your active file reservations (query Agent Mail)

Only after re-reading all four may you continue.

---

## Red Flags

Stop and reassess if you notice:
- **Writing files outside your reserved scope** — conflict risk for other workers
- **Skipping verification** — run the actual criteria, not a substitute
- **Continuing after compaction without re-reading** — you have amnesia; fix it first
- **Implementing stubs or TODOs** — these are not implementations
- **Ignoring a locked CONTEXT.md decision** — swarming effort was spent locking it for a reason
- **Closing a bead without reporting via Agent Mail** — invisible progress breaks the swarm

---

## Quick Reference: Tool Calls

| Action | Call |
|--------|------|
| Confirm identity | Use `AGENT_MAIL_NAME` from prompt (pre-registered by orchestrator) |
| Read bead | `br show <id>` |
| Reserve files | `file_reservation_paths(project_key=..., agent_name=..., paths=[...], reason=...)` |
| Release files | `release_file_reservations(project_key=..., agent_name=..., paths=[...])` |
| Close bead | `br close <id> --reason "..."` |
| Send mail | `send_message(project_key=..., sender_name=..., to=[...], thread_id=..., topic=..., subject=..., body_md=...)` |
| Check inbox | `fetch_inbox(project_key=..., agent_name=..., topic=...)` |
| Check epic thread | `fetch_topic(project_key=..., topic_name=...)` |

---

## Inputs Received from Swarming

When spawned via the `codex()` MCP tool, your initial prompt provides:

- `coordinator_agent_name` — swarm coordinator identity (e.g., `GreenCastle`)
- `project_key` — absolute path to project root
- `epic_id` — the Agent Mail thread for this feature
- `epic_topic` — shared swarm topic tag (`epic-<EPIC_ID>`)
- `bead_id` — the specific bead you are assigned to implement
- `feature_name` — used to locate `history/<feature>/CONTEXT.md`

Your `AGENT_MAIL_NAME` is provided in your spawn prompt (pre-registered by orchestrator). Use `macro_start_session()` only as fallback if missing.
