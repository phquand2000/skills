---
name: compounding
description: >-
  Use when completed feature work needs durable learnings captured for future runs.
  Invoke after reviewing completes and the feature is merged. Runs three parallel
  analysis subagents (patterns/decisions/failures), synthesizes into
  history/learnings dated markdown entries, promotes critical items to
  critical-patterns.md. Trigger phrases: what did we learn, capture learnings,
  compound, lessons learned, document what we found, khuym:compounding skill.
  Key output: critical-patterns.md is read by every planning and exploring
  Phase 0 — this is the flywheel that makes the ecosystem smarter over time.
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

Load `references/compounding-protocol.md` for the detailed subagent prompts, triage rules, promotion criteria, optional CASS/CM steps, state update, and red flags. Use `references/learnings-template.md` when writing the learnings file.

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
| `references/compounding-protocol.md` | Detailed compounding phases and prompts |
| `references/learnings-template.md` | Learnings file template with YAML frontmatter |
