---
name: compounding
description: >-
  Use when reviewing completes or work is intentionally abandoned. Extract
  durable patterns, decisions, and failures into history/learnings, then promote
  only critical reusable lessons to critical-patterns.md.
metadata:
  version: '1.0'
  ecosystem: khuym
  position: '8 of 9 — runs after reviewing, before next feature'
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: degraded
      reason: Compounding reads bead history to reconstruct what work actually ran.
---

# Compounding

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

Compounding captures reusable lessons from completed work and feeds them back into future Khuym planning and exploring. Run it after `khuym:reviewing` completes and the feature is merged or intentionally abandoned with lessons.

## Required Inputs

- `history/<feature>/CONTEXT.md`
- `history/<feature>/discovery.md`
- `history/<feature>/approach.md`
- `.khuym/state.json` or retained handoff artifacts
- `.beads/` or `br show` output
- review findings and debugging notes, if they exist
- feature commit history

If history files are incomplete, use the session summary and recent git diff as fallback evidence. Do not fabricate learnings.

## Operating Contract

1. Gather the feature context and reconstruct what actually ran.
2. Launch three analysis subagents in parallel: patterns, decisions, failures.
3. Synthesize findings into one dated `history/learnings/YYYYMMDD-<slug>.md` file.
4. Promote only genuinely critical, reusable lessons to `history/learnings/critical-patterns.md`.
5. Optionally integrate with CASS/CM when repo config enables it.
6. Update `.khuym/state.json` with the completed compounding run.

Load `references/compounding-reference.md` for analysis prompts, promotion criteria, state update, and the learnings template.

## Hard Gates

- Do not skip compounding for meaningful feature work just because the session feels done.
- Do not promote everything as critical; keep `critical-patterns.md` high signal.
- Do not write generic lessons. Each entry needs a concrete situation, root cause, and future rule.
- Do not let subagents write final learnings files; the orchestrator synthesizes.

## Handoff

```text
Compounding complete.
- Learnings: history/learnings/YYYYMMDD-<slug>.md
- Critical promotions: <N> findings added to critical-patterns.md
- The ecosystem now has <N total> accumulated learnings.
```

## Reference Files

| File | When to Load |
|---|---|
| `references/compounding-reference.md` | Protocol and learnings template |
