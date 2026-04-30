---
name: debugging
description: Use when blocked workers, test failures, build errors, runtime crashes, or integration issues need systematic root-cause debugging. Reads history/learnings/critical-patterns.md to avoid re-solving known issues. Writes debug notes that compounding can later capture.
metadata:
  ecosystem: khuym
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: degraded
      reason: Debugging checks bead context and creates fix beads with br when needed.
    beads-viewer:
      kind: command
      command: bv
      missing_effect: degraded
      reason: Debugging inspects blocker and cycle state with bv during stuck-worker triage.
---

# Debugging

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

Resolve blockers and failures systematically. Do not guess. Triage first, reproduce second, diagnose third, fix fourth.

## When To Use This Skill

- a build fails
- a test fails
- a runtime crash or exception occurs
- an integration breaks
- a worker is blocked by dependencies or reservations
- reviewing or executing hands off with a failure that needs root-cause analysis

---

## Step 1: Triage

Classify the issue before you investigate it.

| Type | Signals |
|---|---|
| Build failure | compiler error, type error, missing module, bundler failure |
| Test failure | assertion mismatch, timeout, snapshot diff, flake |
| Runtime error | crash, uncaught exception, undefined behavior |
| Integration failure | HTTP 4xx/5xx, auth failure, env mismatch, schema mismatch |
| Worker blocker | circular bead dependency, conflicting reservations, no safe execution path |

Output a one-line classification:

`[TYPE] in [component]: [symptom]`

---

## Step 2: Reproduce

Check `history/learnings/critical-patterns.md` first. If a matching pattern already exists, start from that fix path.

If not, rerun the exact failing command and capture the exact output.

Examples:

```bash
npm run build 2>&1 | tee /tmp/debug-output.txt
pytest tests/specific_test.py -v 2>&1 | tee /tmp/debug-output.txt
```

Run it twice. If it is intermittent, treat it as a flaky failure rather than a deterministic one.

---

## Step 3: Diagnose

Work through these checks in order.

### 3a. Read the relevant files

Use the failing output to identify the smallest relevant slice. Do not read the entire repo.

### 3b. Check recent changes

```bash
git log --oneline -20
git blame <file> -L <line>,<line>
git diff HEAD~3 -- <file>
```

### 3c. Check bead intent

```bash
br show <bead-id>
```

Ask whether the code drifted from the bead, or the bead itself is wrong.

### 3d. Check locked decisions

Read the relevant `CONTEXT.md` entries and confirm the implementation did not violate a locked decision.

### 3e. Check local reservation state

```bash
node .codex/khuym_reservations.mjs list --active-only --json
```

Look for:

- overlapping reservations
- leaked reservations from a finished worker
- a worker that still holds files after a blocker or timeout

Also inspect `.khuym/state.json` for the active worker list.

### 3f. Check recent worker results in the parent thread

If this debugging pass was spawned from swarming, use the parent-thread context and the saved worker status in `.khuym/state.json` as the coordination surface. Do not assume an external inbox exists.

### 3g. Write the root cause sentence

Do not proceed until you can write:

> Root cause: `<file>:<line>` — `<what is wrong and why>`

If you cannot write that sentence, you do not have the root cause yet.

---

## Step 4: Fix And Verify

### Small fix

If the fix is obvious and low risk:

- implement directly
- run the exact failing command again
- run the next-wider verification that protects against regressions

### Larger fix

If the fix is cross-cutting or changes the intended behavior:

```bash
br create "Fix: <root cause summary>" -t task --blocks <original-bead-id>
```

Then implement against that new bead.

### Decision violation

If a locked decision was violated:

- do not silently "fix" it by changing behavior on your own
- return or report a blocker summary to the parent thread or user
- propose the conservative fix that honors `CONTEXT.md`

### Reservation-related fixes

If the failure is caused by leaked or stale reservations:

1. inspect the holder
2. release the reservation only if the holder is clearly done or abandoned
3. note the release explicitly in your final report

Use:

```bash
node .codex/khuym_reservations.mjs release --agent "<codex-name>" --bead "<bead-id>" --json
node .codex/khuym_reservations.mjs sweep --json
```

### Verify

The original failing command must pass cleanly. If it still fails, return to diagnosis.

---

## Step 5: Report

If you are inside a swarm, return the debugging result to the parent thread using a clear status heading:

- `[DONE]` if the fix is complete and verified
- `[BLOCKED]` if the problem needs a decision, another worker release, or a broader redesign

At minimum include:

- root cause sentence
- fix summary
- verification result
- reservation impact, if any
- next action needed

If you are working directly for the user, give the same information in the final response.

---

## Step 6: Learn

If this exposed a new reusable failure pattern, write a debug note for compounding so the lesson can be promoted later.

If the failure matched an existing pattern from `critical-patterns.md`, verify whether that guidance still works. If not, flag it for compounding.

---

## Blocker-Specific Protocol

When a worker is stuck rather than code-broken:

1. inspect cycles and dependencies:
   ```bash
   bv --robot-insights 2>/dev/null | jq '.Cycles'
   ```
2. inspect local reservations:
   ```bash
   node .codex/khuym_reservations.mjs list --active-only --json
   ```
3. determine whether the worker is:
   - waiting on another bead
   - blocked by an overlapping reservation
   - blocked by a real product decision

If it is only waiting, return `[BLOCKED]` with the dependency or reservation holder and stop.

If it is a real dead-end, return `[BLOCKED]` with concrete options for the parent or user.

Do not spin.

---

## Red Flags

- fixing symptoms instead of root cause
- skipping reproduction
- ignoring `critical-patterns.md`
- patching around a locked decision violation
- reporting success without rerunning the original failing command
- forgetting to account for local reservations during swarm debugging

---

## Quick Reference

| Situation | First action |
|---|---|
| Build fails | rerun the exact build command |
| Test fails | rerun the exact test and capture assertion output |
| Runtime crash | read the stack trace and find the first line in your code |
| Integration error | check env/config, then the real response body |
| Worker stuck | inspect `bv` plus local reservations |
| Recurring issue | check `history/learnings/critical-patterns.md` first |
