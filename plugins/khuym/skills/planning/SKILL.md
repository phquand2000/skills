---
name: planning
description: >-
  Use when exploring has locked CONTEXT.md and the work needs planning before
  validation.
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

Planning turns locked `CONTEXT.md` decisions into the smallest believable path to execution. Tough work uses capability/risk epics and a current story for feasibility validation.

If `.khuym/onboarding.json` is missing or stale, stop and invoke `khuym:using-khuym`.

## Hard Gates

- `CONTEXT.md` is source of truth.
- Read critical patterns before discovery.
- Run `node .codex/khuym_status.mjs --json` when available.
- Use gkg first for supported ready repos; document fallback.
- Start with a mode gate.
- Use the least workflow that protects the work.
- For tough plans, prefer `Epic Map -> Current Story Pack` over forced 2-4 phases.
- Stop after the work shape/epic map until approval.
- Create beads only after validation accepts feasibility, except already-proven direct/small work.
- Handoff only to `khuym:validating`.

## Shape

`Mode -> Shape -> Epic Map? -> Current Story Pack -> Beads`.
Phase = optional milestone; epic = capability/risk area; story = end-to-end outcome; bead = worker task for validated work.

Load `references/planning-reference.md` for quality rules and artifact templates.

## Flow

1. **Bootstrap:** scout, read `CONTEXT.md`, read learnings.
2. **Discovery:** map repo reality, patterns, constraints, and research.
3. **Mode gate:** choose direct, spike, small, standard, or high-risk mode.
4. **Synthesis:** write `approach.md` with path, risks, proof needs, files, and validating questions.
5. **Shape:** write direct/spike/small shape, phase plan, or epic map; present approval and stop.
6. **Prep:** after approval, write only current story/work artifacts; beads wait for feasibility unless already proven.
7. **State:** set next action to `khuym:validating`.

## Approval Gate

```text
Planning has chosen the smallest work shape. Approve it before current story/work prep. Tough work uses an epic map; beads wait until feasibility passes.
```

## Red Flags

- skipping learnings or `CONTEXT.md`
- skipping the mode gate
- defaulting to 2-4 phases without proving the work needs phases
- using phases when epics better express capability/risk areas
- prep/beads before approval
- future-story or future-epic beads
- pseudo-beads in Markdown
- vague exit states or missing dependencies
- risky assumptions without a spike or validating question
