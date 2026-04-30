---
name: planning
description: >-
  Use when exploring has locked CONTEXT.md and the feature needs research,
  phase/story planning, current-phase artifacts, and real Beads for the approved
  phase only.
metadata:
  ecosystem: khuym
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: unavailable
      reason: Planning creates and links real bead graphs with br.
    beads-viewer:
      kind: command
      command: bv
      missing_effect: degraded
      reason: Planning relies on graph-aware triage and validation checks.
    cass-cli:
      kind: command
      command: cass
      missing_effect: degraded
      reason: Planning searches prior sessions to avoid re-solving problems.
    cass-memory:
      kind: command
      command: cm
      missing_effect: degraded
      reason: Planning retrieves reusable playbook context before deep work.
    gkg:
      kind: mcp_server
      server_names: [gkg]
      config_sources: [repo_codex_config, global_codex_config, plugin_mcp_manifest]
      missing_effect: degraded
      reason: Discovery architecture snapshots rely on gkg-backed analysis.
---

# Planning Skill

Planning turns locked `CONTEXT.md` decisions into a whole-feature phase plan, then prepares only the approved current phase for validation.

If `.khuym/onboarding.json` is missing or stale, stop and invoke `khuym:using-khuym`.

## Hard Gates

- `CONTEXT.md` is source of truth; do not override locked decisions.
- Read critical patterns and relevant learnings before discovery.
- Run `node .codex/khuym_status.mjs --json` when available.
- Use gkg first for supported ready repos; document fallback.
- Stop after `phase-plan.md` until the user approves.
- Create beads only for the approved current phase.
- Handoff only to `khuym:validating`.

## Shape

```text
Whole Feature -> Phase Plan -> Current Phase -> Stories -> Beads
```

Phase = observable capability slice. Story = ordered current-phase step. Bead = one worker-sized task.

Load `references/planning-reference.md` for quality rules and artifact templates.

## Flow

1. **Bootstrap:** scout, read `CONTEXT.md`, read learnings. If context is missing, ask for `khuym:exploring`.
2. **Discovery:** map topology, reusable patterns, constraints, and needed external research. Write `history/<feature>/discovery.md`.
3. **Synthesis:** write `history/<feature>/approach.md` with gaps, recommendation, alternatives, risks, files, learnings, and validating questions.
4. **Phase plan:** write `history/<feature>/phase-plan.md`; show 2-4 phases, demos, stories, and the phase to prepare first. Present the approval gate and stop.
5. **Current phase prep:** after approval, write `phase-<n>-contract.md` and `phase-<n>-story-map.md`; multi-perspective check HIGH-risk phases.
6. **Beads:** create/update epic, create current-phase beads with `br`, link dependencies, map stories to beads. Each bead gets only relevant decisions, story context, file scope, verification, and learnings.
7. **State:** update `.khuym/state.json` with phase number, active beads, and `next_action: "Invoke khuym:validating for Phase <n>."`

## Approval Gate

```text
Planning has broken the feature into phases and stories. Review `history/<feature>/phase-plan.md`. If approved, planning will prepare Phase <n> for validating. Do not create beads before this approval.
```

## Red Flags

- skipping learnings or `CONTEXT.md`
- prep/beads before approval
- later-phase beads
- pseudo-beads in Markdown
- vague exit states or missing dependencies
- HIGH-risk work without a validating spike flag
