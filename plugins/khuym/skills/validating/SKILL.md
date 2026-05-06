---
name: validating
description: >-
  Use when planning has an approved work shape and needs feasibility validation
  before swarming.
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

Validating is the hard gate between planning and execution. It rejects beautiful fantasy plans by requiring repo/system evidence, feasibility proof, and current-story readiness.

## Required Inputs

- `history/<feature>/CONTEXT.md`
- `history/<feature>/discovery.md`
- `history/<feature>/approach.md`
- approved shape artifact: direct note, spike question, small plan, `phase-plan.md`, or `epic-map.md`
- mode-required current-work artifacts: `current-story-pack.md`, `phase-<n>-contract.md`, or story map
- `.beads/` for the current execution surface when beads are required

If any mode-required input is missing, return to `khuym:planning`. If the shape artifact has not been approved by the user, stop immediately.

## Operating Contract

1. Orient on state, mode, approved shape, and current artifacts.
2. Run the reality gate: mode fit, current repo truth, assumptions, and smaller-path challenge.
3. Build the feasibility matrix from concrete evidence: code, inspection, commands, tests, docs/version proof, runtime probe, or `.spikes/`.
4. Require spike/probe work for unproven assumptions that can invalidate the current story/shape.
5. Check integration readiness and current-story readiness before bead review.
6. If beads are required but absent after READY, return to planning to create current-story/work beads, then resume validation.
7. Polish/review only validated current-story/work beads.
8. Ask the user to approve execution for this work only.

Load `references/validation-reference.md` for the detailed checklist, repair routing, spike handling, approval gate, and subagent prompts.

## Non-Negotiable Gates

- No source-editing execution before explicit user approval.
- Maximum 3 structural-verification iterations. Do not attempt iteration 4.
- A failed reality gate or `NO` spike result returns the workflow to `khuym:planning`.
- A plan with only plausibility language and no concrete evidence is NOT READY.
- All CRITICAL fresh-eyes findings must be fixed before approval.
- Approval is for the current work only. Future work returns to planning/validating.

## Approval Outcome

When the user approves, update `.khuym/state.json` so the next action is swarming:

```json
{
  "active_skill": "validating",
  "feature_slug": "<feature-name>",
  "phase": "validated",
  "mode": "<mode>",
  "current_work": "<story/direct/phase>",
  "summary": "Current work passed feasibility validation and is ready for swarming.",
  "next_action": "Invoke khuym:swarming for the validated work."
}
```

Then hand off: `Validation complete. Current work passes. Invoke khuym:swarming skill.`

## Reference Files

| File | When to Load |
|---|---|
| `references/validation-reference.md` | Validation phases, repairs, approval, plan-checker, bead-reviewer |
