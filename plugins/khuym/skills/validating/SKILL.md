---
name: validating
description: |
  Use when planning has written phase-plan.md, the user has approved the phase plan, and the current phase has been decomposed into stories and beads. Verifies the current phase contract, story map, and bead graph across 8 structural dimensions, executes time-boxed spikes for HIGH-risk items, polishes current-phase beads, and requires explicit user approval before any code is written.
metadata:
  version: '1.2'
  position: 3
  chain: exploring -> planning -> validating -> swarming
  ecosystem: khuym
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: unavailable
      reason: Validation creates and closes spike beads during gating.
    beads-viewer:
      kind: command
      command: bv
      missing_effect: unavailable
      reason: Validation depends on bv graph checks for polishing and risk review.
---

# Validating

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

Validating is the hard gate between planning and execution. It approves only the current phase, and only after the phase contract, story map, bead graph, risk spikes, and exit-state readiness are credible.

## Required Inputs

- `history/<feature>/CONTEXT.md`
- `history/<feature>/discovery.md`
- `history/<feature>/approach.md`
- `history/<feature>/phase-plan.md`
- `history/<feature>/phase-<n>-contract.md`
- `history/<feature>/phase-<n>-story-map.md`
- `.beads/` for the current phase

If any are missing, return to `khuym:planning`. If `phase-plan.md` has not been approved by the user, stop immediately.

## Operating Contract

1. Orient on `.khuym/state.json`, the approved phase plan, and current phase artifacts.
2. Run structural verification with `references/plan-checker-prompt.md`.
3. Execute 30-minute spikes for each HIGH-risk item that affects the current phase.
4. Polish the bead graph with `bv --robot-suggest`, `bv --robot-insights`, and `bv --robot-priority`.
5. Run fresh-eyes bead review with `references/bead-reviewer-prompt.md`.
6. Perform an exit-state readiness review.
7. Ask the user to approve execution for this phase.

Load `references/validation-protocol.md` for the detailed phase-by-phase checklist, repair routing, spike handling, approval template, lightweight mode, and red flags.

## Non-Negotiable Gates

- No bead execution before explicit user approval.
- Maximum 3 structural-verification iterations. Do not attempt iteration 4.
- A `NO` spike result returns the workflow to `khuym:planning`.
- All CRITICAL fresh-eyes findings must be fixed before approval.
- Approval is for the current phase only. Later phases return to planning/validating.

## Approval Outcome

When the user approves, update `.khuym/state.json` so the next action is swarming:

```json
{
  "active_skill": "validating",
  "feature_slug": "<feature-name>",
  "phase": "validated",
  "phase_number": <n>,
  "summary": "Phase <n> passed validation and is ready for swarming.",
  "next_action": "Invoke khuym:swarming for Phase <n>."
}
```

Then hand off: `Validation complete. Current phase passes. Invoke khuym:swarming skill.`

## Reference Files

| File | When to Load |
|---|---|
| `references/validation-protocol.md` | Detailed validation phases, repairs, approval, red flags |
| `references/plan-checker-prompt.md` | Structural verification subagent |
| `references/bead-reviewer-prompt.md` | Phase 3 fresh-eyes bead review |
