---
name: validating
description: >-
  Use when planning has an approved work shape. Validate mode fit, repo reality,
  risk assumptions, artifacts, and execution readiness before user approval for
  swarming.
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

Validating is the hard gate between planning and execution. It first asks whether the chosen work shape is real for the current repo, then approves only the current execution surface after artifacts, risks, beads, and exit readiness are credible.

## Required Inputs

- `history/<feature>/CONTEXT.md`
- `history/<feature>/discovery.md`
- `history/<feature>/approach.md`
- approved shape artifact: direct task note, spike question, small-change plan, or `phase-plan.md`
- current-work artifacts required by the mode, such as `phase-<n>-contract.md` and `phase-<n>-story-map.md`
- `.beads/` for the current execution surface when beads are required

If any mode-required input is missing, return to `khuym:planning`. If the shape artifact has not been approved by the user, stop immediately.

## Operating Contract

1. Orient on `.khuym/state.json`, mode, approved shape artifact, and current artifacts.
2. Run the reality gate in `references/validation-reference.md`: mode fit, current repo truth, assumptions, and smaller-path challenge.
3. Run structural verification only for artifacts the mode actually requires.
4. Execute or require spikes for any assumption whose answer can invalidate the path, not only HIGH-risk phase items.
5. Polish the bead graph with `bv --robot-suggest`, `bv --robot-insights`, and `bv --robot-priority` when beads exist.
6. Run fresh-eyes bead review when beads exist, then perform exit-state readiness review.
7. Ask the user to approve execution for this work only.

Load `references/validation-reference.md` for the detailed checklist, repair routing, spike handling, approval gate, and subagent prompts.

## Non-Negotiable Gates

- No source-editing execution before explicit user approval.
- Maximum 3 structural-verification iterations. Do not attempt iteration 4.
- A failed reality gate or `NO` spike result returns the workflow to `khuym:planning`.
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
  "phase_number": <n>,
  "summary": "Current work passed validation and is ready for swarming.",
  "next_action": "Invoke khuym:swarming for the validated work."
}
```

Then hand off: `Validation complete. Current work passes. Invoke khuym:swarming skill.`

## Reference Files

| File | When to Load |
|---|---|
| `references/validation-reference.md` | Validation phases, repairs, approval, plan-checker, bead-reviewer |
