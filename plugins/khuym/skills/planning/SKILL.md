---
name: planning
description: >-
  Use when exploring has locked CONTEXT.md and the work needs research, mode
  selection, planning artifacts, or Beads before validation.
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

Planning turns locked `CONTEXT.md` decisions into the smallest believable path to execution, then prepares only approved work for validation.

If `.khuym/onboarding.json` is missing or stale, stop and invoke `khuym:using-khuym`.

## Hard Gates

- `CONTEXT.md` is source of truth; do not override locked decisions.
- Read critical patterns and relevant learnings before discovery.
- Run `node .codex/khuym_status.mjs --json` when available.
- Use gkg first for supported ready repos; document fallback.
- Start with a mode gate: `direct_task`, `spike`, `small_change`, `standard_feature`, or `high_risk_feature`.
- Use the least workflow that protects the work.
- Stop after the shape artifact until the user approves.
- Create beads only for the approved execution surface.
- Handoff only to `khuym:validating`.

## Shape

`Mode -> Shape artifact -> Current work -> optional stories -> beads`.
Mode decides structure. Phase = observable capability slice; story = ordered step; bead = worker-sized task.

Load `references/planning-reference.md` for quality rules and artifact templates.

## Flow

1. **Bootstrap:** scout, read `CONTEXT.md`, read learnings. If context is missing, ask for `khuym:exploring`.
2. **Discovery:** map repo reality, reusable patterns, constraints, and needed research. Write `discovery.md` only when useful.
3. **Mode gate:** classify the work. If one proof decides the path, choose `spike`.
4. **Synthesis:** write `approach.md` with smallest path, risks, proof needs, files, learnings, and validating questions.
5. **Shape artifact:** write a direct task note, spike question, small-change shape, or multi-phase `phase-plan.md`. Present the approval gate and stop.
6. **Prep:** after approval, write only artifacts the mode needs; create/update only approved beads with `br`.
7. **State:** update `.khuym/state.json` with mode, active beads, and `next_action: "Invoke khuym:validating."`

## Approval Gate

```text
Planning has chosen the smallest work shape. Review the shape artifact. If approved, planning will prepare only that execution surface for validating. Do not create beads before this approval.
```

## Red Flags

- skipping learnings or `CONTEXT.md`
- skipping the mode gate
- defaulting to 2-4 phases without proving the work needs phases
- prep/beads before approval
- future-phase beads
- pseudo-beads in Markdown
- vague exit states or missing dependencies
- risky assumptions without a spike or validating question
