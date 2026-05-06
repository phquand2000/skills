---
name: swarming
description: Use when validating approves execution. Orchestrates bounded Codex workers, local reservations, worker results, rescues, and phase handoff. Tends the swarm but never implements beads directly.
metadata:
  version: '1.0'
  role: orchestrator
  ecosystem: khuym
  position: 5-of-9
  upstream: validating
  downstream: reviewing
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: degraded
      reason: Swarm tending checks bead state and closure through br.
    beads-viewer:
      kind: command
      command: bv
      missing_effect: unavailable
      reason: Live graph triage is required to route and supervise workers.
---

# Swarming

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

You are the orchestrator. Launch workers, monitor coordination, handle escalations, and keep the swarm moving. Do not implement beads directly; spawned workers use `khuym:executing`.

## Coordination Substrate

Same-session swarming uses:

- beads and `bv` for work selection and graph state
- Codex subagents for bounded parallel execution
- `.khuym/reservations.json` for local file ownership
- the parent Codex thread for `[DONE]`, `[BLOCKED]`, `[HANDOFF]`, and `[NOOP]` results

No external mail server is required for the default path.

## When to Use

Invoke after `khuym:validating` says: `Validation complete. Current phase passes. Invoke khuym:swarming skill.`

Prerequisites:

- current-phase beads are approved and open
- `EPIC_ID` is known
- `node .codex/khuym_status.mjs --json` has been run when available
- `history/learnings/critical-patterns.md` has been read when present

## Operating Contract

1. Confirm readiness with `bv --robot-triage --graph-root <EPIC_ID>`.
2. Sweep expired reservations.
3. Choose each ready bead parent-side, then spawn bounded worker subagents with `references/swarming-reference.md`.
4. Record `agent_id`, `agent_nickname`, bead, and status in `.khuym/state.json`.
5. Tend the live graph, reservations, and worker results until the phase is clean.
6. Write `.khuym/HANDOFF.json` before pausing near context limits.
7. Run final graph, reservation, and quality checks before handing off.

Load `references/swarming-reference.md` for spawn context, tend-loop rules, result templates, handoff content, and red flags.

## Hard Rules

- Never spawn workers before validation approves execution.
- Never let workers pick beads themselves; pass one explicit `assigned_bead_id` from the orchestrator.
- Never let workers edit without local reservations.
- Do not resolve file conflicts by asking workers to be careful; adjust reservations or bead scope.
- Silence alone is not failure. Do not send routine mid-flight `send_input(...)` check-ins.
- Reserve interrupts for explicit user aborts or confirmed deadlocks where the user wants preemption.
- If context usage passes roughly 65%, write `.khuym/HANDOFF.json` and pause safely.

## Completion Signal

Swarming is complete when either:

- the current phase is executed and the workflow returns to planning for the next phase, or
- the final phase is executed and the user can be told: `Swarm execution complete for the final phase. Invoke khuym:reviewing.`

## Reference Files

| File | When to Load |
|---|---|
| `references/swarming-reference.md` | Orchestration flow, worker prompt, result formats |
| `.khuym/state.json` | Runtime worker and phase state |
| `.khuym/HANDOFF.json` | Pause/resume artifact |
