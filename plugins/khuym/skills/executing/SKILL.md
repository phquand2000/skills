---
name: executing
description: >-
  Per-agent worker loop for the khuym ecosystem. Load when you are a worker subagent
  spawned by the khuym:swarming skill. Implements the bead-scoped worker loop
  (read context, pick one bead, reserve files locally, implement, verify, close,
  release, report). Handles context monitoring, atomic commits, post-compaction
  recovery, and graceful handoff back to the parent Codex thread.
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
---

# Executing — Worker Loop

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

You are a **worker subagent** spawned by swarming. Your job is one thing: implement one executable bead cleanly, then return a structured result to the parent thread.

## Worker Shape

The normal same-session Codex contract is bead-scoped and short-lived:

1. restore project context
2. pick one executable bead from the live graph
3. reserve the edit surface locally
4. implement and verify
5. close the bead, release reservations, and return `[DONE]`

If you hit a real blocker, return `[BLOCKED]` with enough detail for the orchestrator to act. Do not wait silently for follow-up messages that may never arrive.

A routine status check from the parent is observational, not permission to abandon healthy in-flight work. Keep working your current bead unless you are already done, truly blocked, or the parent explicitly asks for a safe stop or handoff.

## Loop Overview

```text
Initialize -> Pick One Bead -> Reserve Files -> Implement -> Verify -> Close -> Release -> Return
```

If context usage becomes unsafe before completion:

```text
... -> HANDOFF.json -> Release what you safely can -> Return [HANDOFF]
```

---

## Step 1: Initialize

Run once at session start.

### 1a. Read project context in this order

1. `AGENTS.md`
2. if present, `node .codex/khuym_status.mjs --json`
3. `.khuym/state.json`
4. `history/<feature>/CONTEXT.md`

If any file is absent, note the absence and continue. Do not fabricate content.

### 1b. Restore a worker handoff if it belongs to you

If `.khuym/HANDOFF.json` exists and clearly belongs to your current worker run:

1. read it
2. restore the active bead, progress markers, and open questions
3. continue from that safe checkpoint

### 1c. Respect the worker context the parent gave you

Swarming should provide:

- `codex_subagent_name`
- `agent_id`
- `project_key`
- `epic_id`
- `feature_name`
- optional `startup_hint`

The Codex nickname is your reservation identity. Use it consistently when reserving and releasing files.

---

## Step 2: Pick One Executable Bead

Default path:

```bash
bv --robot-priority
```

Choose the top-ranked open bead that:

- has no unresolved dependencies
- is consistent with `CONTEXT.md`
- looks implementable within one bounded worker run

If the parent provided a startup hint, treat it as a priority candidate, not as a blind assignment. Re-check the live graph before claiming it.

Read the bead in full:

```bash
br show <bead-id>
```

Before implementing, confirm you understand:

- what must be built
- which dependencies must already be closed
- the verification criteria
- the file scope
- any referenced decision IDs from `CONTEXT.md`

If you do not have a clear executable bead, return `[NOOP]` with the exact reason.

---

## Step 3: Reserve Files Locally

Reserve every file or glob you expect to modify before writing anything:

```bash
node .codex/khuym_reservations.mjs reserve \
  --agent "<codex-subagent-name>" \
  --bead "<bead-id>" \
  --path "src/foo.ts" \
  --path "src/bar.ts" \
  --ttl 3600 \
  --json
```

### If reservation conflicts

Stop the run and return `[BLOCKED]` with:

- bead id
- requested files or globs
- the conflicting holder
- what you need next

Do not edit through the conflict.

### If reservation succeeds

Proceed to implementation immediately.

### Shell-guard requirement

For write-heavy Bash commands during implementation, prefix the command with your reservation identity so the repo hook can do ownership-aware checks:

```bash
KHUYM_AGENT_NAME="<codex-subagent-name>" git add src/foo.ts
```

This is especially important for:

- `git add`
- `git mv`
- `git rm`
- `mv`, `cp`, `rm`, `mkdir`, `touch`
- `sed -i`, `perl -i`, redirection-based file writes

---

## Step 4: Implement

### Read before writing

Read every source file you will touch. Do not write from memory.

### Honor locked decisions

Before writing, scan the bead for decision IDs such as `D1`, `D2`, and so on. For every referenced decision:

1. read the corresponding entry in `history/<feature>/CONTEXT.md`
2. implement exactly as locked

### Follow existing patterns

Match the local naming, imports, error handling, and test structure already used in the codebase.

### No pseudo-implementations

Every artifact must be real, wired, and tested. No stubs, TODO-only placeholders, or dead code.

---

## Step 5: Verify

Run the bead's verification criteria exactly as written. Do not substitute easier checks.

Examples:

```bash
npm test -- --testPathPattern="<affected-module>"
npm run build
npm run lint
```

If verification fails:

1. fix the root cause
2. rerun the exact failing command
3. if it still fails after two serious attempts, stop and return `[BLOCKED]`

A blocked worker is more useful than a silent worker.

---

## Step 6: Close The Bead

Close the bead only after verification passes:

```bash
br close <bead-id> --reason "Completed: <one-line summary>"
```

### Atomic git commit

One commit per bead:

```bash
KHUYM_AGENT_NAME="<codex-subagent-name>" git add <files-you-modified>
git commit -m "feat(<bead-id>): <summary matching br close reason>"
```

Do not batch multiple beads into one commit.

---

## Step 7: Release Reservations

Always release your reservation before returning success:

```bash
node .codex/khuym_reservations.mjs release \
  --agent "<codex-subagent-name>" \
  --bead "<bead-id>" \
  --json
```

If release fails, say so explicitly in your final report. Do not hide reservation leaks.

---

## Step 8: Return A Structured Result To The Parent Thread

Your final response is the coordination surface. Use one of the exact headings below at the start of your response:

- `[DONE]`
- `[BLOCKED]`
- `[HANDOFF]`
- `[NOOP]`

Follow the expected structure in `../swarming/references/message-templates.md`.

At minimum include:

- Codex nickname
- agent id if known
- bead id
- files touched or requested
- reservation outcome
- verification result
- next action the parent should take

### `[DONE]`

Use when the bead is closed, committed, and reservations were released.

### `[BLOCKED]`

Use when you cannot safely continue. Include the concrete blocker, current reservation state, and exactly what the parent should decide.

### `[HANDOFF]`

Use when context is high or you had to stop at a safe checkpoint. Write `.khuym/HANDOFF.json` first.

### `[NOOP]`

Use when there is no safe bead for you to execute right now.

---

## Step 9: Context Budget And Handoff

If context usage approaches 65% before a safe completion point:

1. write `.khuym/HANDOFF.json`
2. include:
   - `codex_nickname`
   - `agent_id`
   - current bead
   - files reserved
   - what is done
   - what remains
3. release any reservation you can safely release
4. return `[HANDOFF]`

Do not disappear with an active reservation and no handoff artifact.

---

## Step 10: Post-Compaction Recovery

If you detect context compaction, stop immediately and reread in this order:

1. `AGENTS.md`
2. `history/<feature>/CONTEXT.md`
3. the current bead via `br show <bead-id>`
4. your active reservations via:
   ```bash
   node .codex/khuym_reservations.mjs list --active-only --agent "<codex-subagent-name>" --json
   ```

Only continue once those four are restored.

---

## Red Flags

- writing outside your reserved scope
- claiming a bead without reserving first
- keeping multiple beads open in one worker run
- waiting silently for the parent instead of returning `[BLOCKED]`
- closing a bead without verification
- failing to release reservations after completion
- continuing after compaction without rereading context
- ignoring `CONTEXT.md`

---

## Quick Reference

| Action | Command |
|---|---|
| Get priority bead | `bv --robot-priority` |
| Read bead | `br show <id>` |
| Reserve files | `node .codex/khuym_reservations.mjs reserve ...` |
| List active reservations | `node .codex/khuym_reservations.mjs list --active-only --json` |
| Release files | `node .codex/khuym_reservations.mjs release ...` |
| Close bead | `br close <id> --reason "..."` |
| Handoff artifact | write `.khuym/HANDOFF.json` |

## Completion Signal

This skill is complete when you have either:

- returned `[DONE]` for one verified bead with reservations released, or
- returned `[BLOCKED]`, `[HANDOFF]`, or `[NOOP]` with enough detail for the orchestrator to act without guessing.
