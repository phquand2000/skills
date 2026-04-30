---
name: executing
description: >-
  Use when running inside a swarming worker. Execute one parent-assigned bead:
  restore context, reserve files, implement, verify, close, release, and return
  [DONE], [BLOCKED], [HANDOFF], or [NOOP].
metadata:
  ecosystem: khuym
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: unavailable
      reason: Workers read, update, and close beads through br.
---

# Executing - Worker Loop

If `.khuym/onboarding.json` is missing or stale, stop and invoke `khuym:using-khuym`.

You are a short-lived worker subagent. Execute exactly one parent-assigned bead,
verify it, release reservations, and return a structured result.

```text
Initialize -> Accept Assigned Bead -> Reserve -> Implement -> Verify -> Close -> Release -> Return
```

Do not wait silently. Return `[BLOCKED]` or `[HANDOFF]` when you cannot safely finish.
Open `references/worker-details.md` only for expanded commands and result fields.

## Required Steps

1. **Initialize**
   - Read `AGENTS.md`.
   - Run `node .codex/khuym_status.mjs --json` if present.
   - Read `.khuym/state.json` and `history/<feature>/CONTEXT.md` when present.
   - Use the parent-provided Codex nickname as the reservation identity.

2. **Accept Assigned Bead**
   - Require exactly one `assigned_bead_id` from the parent.
   - Do not choose work with `bv`, `br ready`, or `br list`.
   - Read it with `br show <assigned-bead-id>`.
   - Return `[NOOP]` if missing or unavailable.
   - Return `[BLOCKED]` if blocked, ambiguous, or inconsistent with locked context.

3. **Reserve Files**
   - Reserve every file/glob before writing:
     ```bash
     node .codex/khuym_reservations.mjs reserve --agent "<name>" --bead "<id>" --path "src/foo.ts" --ttl 3600 --json
     ```
   - On conflict, stop and return `[BLOCKED]`.
   - Prefix write-heavy shell commands with `KHUYM_AGENT_NAME="<name>"`.

4. **Implement**
   - Read before editing.
   - Match existing patterns and locked decisions.
   - Do not ship stubs, TODO-only placeholders, dead code, or pseudo-implementations.

5. **Verify**
   - Run the bead's verification exactly.
   - Fix root causes and rerun.
   - After two serious failed attempts, return `[BLOCKED]` with command, failure summary, and diagnosis.

6. **Close And Release**
   - Close only after verification passes:
     ```bash
     br close <id> --reason "Completed: <summary>"
     ```
   - Make one commit per bead with the bead id.
   - Release reservations:
     ```bash
     node .codex/khuym_reservations.mjs release --agent "<name>" --bead "<id>" --json
     ```

7. **Return**
   - Start with exactly `[DONE]`, `[BLOCKED]`, `[HANDOFF]`, or `[NOOP]`.
   - Include nickname, bead id, files, reservation outcome, verification, and next action.

## Compaction

At roughly 65% context before a safe finish: write `.khuym/HANDOFF.json`, include
bead/files/done/remaining, release safe reservations, and return `[HANDOFF]`.

After compaction, reread `AGENTS.md`, `CONTEXT.md`, `br show <id>`, and active
reservations before continuing.

## Red Flags

- editing outside reserved scope
- selecting your own bead
- handling multiple beads in one run
- waiting silently instead of returning a status
- closing without verification
- leaving reservations active without reporting it
