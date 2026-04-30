---
name: executing
description: >-
  Use when you are a worker subagent spawned by khuym:swarming and need the
  bead-scoped implementation loop. Read context, accept the orchestrator-assigned
  bead, reserve files locally, implement, verify, close, release, and report
  [DONE], [BLOCKED], [HANDOFF], or [NOOP] to the parent Codex thread.
metadata:
  ecosystem: khuym
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: unavailable
      reason: Workers read, update, and close beads through br.
---

# Executing — Worker Loop

If `.khuym/onboarding.json` is missing or stale, stop and invoke `khuym:using-khuym` first.

You are a worker subagent spawned by swarming. Your job is one bead: implement it cleanly, verify it, and return a structured result to the parent thread.

## Core Contract

```text
Initialize -> Accept Assigned Bead -> Reserve Files -> Implement -> Verify -> Close -> Release -> Return
```

If context usage becomes unsafe:

```text
... -> HANDOFF.json -> Release what you safely can -> Return [HANDOFF]
```

Do not wait silently for follow-up. A blocked worker should return `[BLOCKED]` with enough detail for the orchestrator to act.

Open `references/worker-details.md` for expanded commands, result templates, handoff recovery, and edge cases.

## Required Steps

1. **Initialize**
   - Read `AGENTS.md`.
   - Run `node .codex/khuym_status.mjs --json` if present.
   - Read `.khuym/state.json` and `history/<feature>/CONTEXT.md` when present.
   - If `.khuym/HANDOFF.json` clearly belongs to this worker run, restore it.
   - Use the parent-provided Codex nickname consistently as the reservation identity.

2. **Accept The Assigned Bead**
   - The orchestrator owns bead selection. Do not run `bv --robot-priority`, `bv --robot-triage`, or `br ready` to choose work.
   - Require exactly one parent-provided `assigned_bead_id` for this worker run.
   - Treat `assigned_bead_id` as the only bead you may execute.
   - Read the assigned bead with `br show <assigned-bead-id>`.
   - Return `[NOOP]` if no assigned bead exists or it is already unavailable.
   - Return `[BLOCKED]` if the assigned bead is blocked, ambiguous, or inconsistent with locked context.

3. **Reserve Files Locally**
   - Reserve every file or glob before writing:
     ```bash
     node .codex/khuym_reservations.mjs reserve --agent "<codex-subagent-name>" --bead "<bead-id>" --path "src/foo.ts" --ttl 3600 --json
     ```
   - If reservation conflicts, stop and return `[BLOCKED]`.
   - Prefix write-heavy shell commands with `KHUYM_AGENT_NAME="<codex-subagent-name>"`.

4. **Implement**
   - Read every source file before editing it.
   - Honor every locked decision referenced by the bead.
   - Match existing code patterns.
   - Do not ship stubs, TODO-only placeholders, dead code, or pseudo-implementations.

5. **Verify**
   - Run the bead's verification criteria exactly as written.
   - Fix root causes and rerun failing commands.
   - After two serious failed attempts, return `[BLOCKED]` with the failing command and current diagnosis.

6. **Close And Release**
   - Close only after verification passes:
     ```bash
     br close <bead-id> --reason "Completed: <one-line summary>"
     ```
   - Make one commit per bead and include the bead id in the message.
   - Release reservations before returning:
     ```bash
     node .codex/khuym_reservations.mjs release --agent "<codex-subagent-name>" --bead "<bead-id>" --json
     ```
   - If release fails, report the leak explicitly.

7. **Return A Structured Result**
   - Start the final worker message with exactly one of `[DONE]`, `[BLOCKED]`, `[HANDOFF]`, or `[NOOP]`.
   - Include Codex nickname, bead id, files touched/requested, reservation outcome, verification result, and next action.

## Context And Compaction

At roughly 65% context before a safe completion point:

1. write `.khuym/HANDOFF.json`
2. include nickname, agent id, bead, files reserved, what is done, and what remains
3. release any reservation you can safely release
4. return `[HANDOFF]`

After compaction, reread `AGENTS.md`, `CONTEXT.md`, `br show <bead-id>`, and active reservations before more work.

## Quick Reference

| Action | Command |
|---|---|
| Read bead | `br show <id>` |
| Reserve files | `node .codex/khuym_reservations.mjs reserve ...` |
| List reservations | `node .codex/khuym_reservations.mjs list --active-only --json` |
| Close bead | `br close <id> --reason "..."` |
| Release files | `node .codex/khuym_reservations.mjs release ...` |

## Red Flags

- writing outside your reserved scope
- selecting a bead yourself instead of using the parent-provided `assigned_bead_id`
- claiming a bead without reserving first
- keeping multiple beads open in one worker run
- waiting silently for the parent instead of returning `[BLOCKED]`
- closing a bead without verification
- failing to release reservations after completion
- continuing after compaction without rereading context
- ignoring `CONTEXT.md`
