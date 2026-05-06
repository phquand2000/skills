---
name: reviewing
description: Use when the final swarm phase completes. Run specialist review, artifact verification, UAT, review beads, finishing checks, and handoff to compounding.
metadata:
  version: '1.0'
  ecosystem: khuym
  position: 7-of-9
  upstream: swarming
  downstream: compounding
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: unavailable
      reason: Reviewing creates review beads and closes the epic through br.
    beads-viewer:
      kind: command
      command: bv
      missing_effect: degraded
      reason: Reviewing verifies the live bead graph before epic closeout.
---

# Reviewing

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

Reviewing is the final automated quality gate after execution. It verifies that the completed feature is correct, safe, wired, and acceptable to the user before compounding begins.

## Required Inputs

- `history/<feature>/CONTEXT.md`
- `history/<feature>/approach.md`
- `.khuym/state.json`
- current git diff or merged branch range
- live bead graph for the feature epic

## Operating Contract

1. Dispatch specialist review agents with isolated context.
2. Convert each real review issue into a review bead.
3. Stop on P1 findings until the user acknowledges the gate.
4. Verify every promised artifact at the EXISTS, SUBSTANTIVE, and WIRED levels.
5. Walk the user through UAT items from locked decisions.
6. Finish by checking all beads, running project quality gates, closing the epic, and preparing compounding.

Load `references/reviewing-reference.md` for the agent roster, severity rules, artifact verification, UAT flow, review bead schema, and finishing checklist.

## Hard Gates

- P1 review beads block merge. Never continue past P1 without user acknowledgment.
- Artifact verification is mandatory; task closure is not proof that the feature works.
- UAT failures are never logged as passes. Skips need a reason in `.khuym/state.json`.
- P2/P3 review beads must use non-blocking traceability, not current-epic child links.
- Agent 5, `learnings-synthesizer`, always runs after agents 1-4.

## Handoff

After finishing:

```json
{
  "active_skill": "reviewing",
  "phase": "reviewing-complete",
  "epic_id": "<id>",
  "summary": "Review complete. Ready to run compounding.",
  "next_action": "Invoke khuym:compounding.",
  "focus": "compounding",
  "blockers": []
}
```

Tell the user: `Feature complete. Epic <id> closed. Invoke khuym:compounding skill.`

## Reference Files

| File | When to Load |
|---|---|
| `references/reviewing-reference.md` | Review flow, specialist roster, review bead schema |
