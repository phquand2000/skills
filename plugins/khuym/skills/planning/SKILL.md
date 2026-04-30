---
name: planning
description: >-
  Use when khuym:exploring has locked CONTEXT.md and the feature is ready for
  research, phase/story planning, and current-phase bead preparation. Produces
  discovery.md, approach.md, phase-plan.md, the approved current phase contract
  and story map, then creates real Beads for that phase only.
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

Planning turns locked decisions into a plain-English whole-feature plan, then prepares only the approved current phase for validation and execution.

If `.khuym/onboarding.json` is missing or stale, stop and invoke `khuym:using-khuym` first.

## Non-Negotiables

- Read `history/<feature>/CONTEXT.md` first. It is the source of truth.
- Read `history/learnings/critical-patterns.md`, then search relevant learnings before discovery.
- Run `node .codex/khuym_status.mjs --json` when available and honor gkg readiness.
- Use gkg MCP discovery first for supported, ready repos; document grep/file fallback when gkg is unavailable.
- Explain phases and stories in practical, scenario-first language.
- Stop after `phase-plan.md` and wait for user approval before preparing the current phase.
- Create real beads with `br`; never leave pseudo-beads in Markdown.
- Create beads only for the approved current phase, never later phases.
- Handoff only to `khuym:validating`, never directly to swarming.

## Planning Shape

```text
Whole Feature
  -> Phase Plan
    -> Current Phase
      -> Stories
        -> Beads
```

- **Phase**: what becomes true for real people or systems after this chunk lands.
- **Story**: what has to happen first, next, and last inside the current phase.
- **Bead**: what one worker can pick up and finish without guessing.

If a phase sounds like a bucket of chores, or a story sounds like an implementation layer, rewrite it in plain language before moving on.

For the detailed process, examples, and artifact quality rules, open `references/planning-process.md`.

## Required Flow

1. **Bootstrap**
   - Run scout if available.
   - Read `CONTEXT.md`.
   - Read critical patterns and targeted learnings.
   - Stop if `CONTEXT.md` is missing; ask the user to run `khuym:exploring`.

2. **Discovery**
   - Map topology, reusable patterns, constraints, and any needed external research.
   - Write `history/<feature>/discovery.md` using `references/discovery-template.md`.
   - Include an `Institutional Learnings` section, even when there are no matches.

3. **Synthesis**
   - Read `CONTEXT.md` and `discovery.md`.
   - Write `history/<feature>/approach.md` using `references/approach-template.md`.
   - Include gap analysis, recommended approach, alternatives, risk map, file structure, and learnings applied.

4. **Whole-Feature Phase Plan**
   - Write `history/<feature>/phase-plan.md` using `references/phase-plan-template.md`.
   - Show 2-4 meaningful phases, practical demos, story outlines, and the phase to prepare first.
   - Stop for approval. Do not prepare current-phase artifacts or beads yet.

5. **Current Phase Prep**
   - After approval, select the first unprepared phase unless the user chooses another.
   - Write `history/<feature>/phase-<n>-contract.md` using `references/phase-contract-template.md`.
   - Write `history/<feature>/phase-<n>-story-map.md` using `references/story-map-template.md`.
   - For HIGH-stakes phases, run a multi-perspective check before bead creation.

6. **Bead Creation**
   - Create the epic if needed, then real current-phase task beads with `br create`.
   - Link dependencies with `br dep add`.
   - Embed phase context, story context, planning context, verification, file scope, and relevant learnings in every bead.
   - Fill the story-to-bead mapping in the story map.

7. **State And Handoff**
   - Update `.khuym/state.json` with `active_skill: "planning"`, the phase number, active beads, and `next_action: "Invoke khuym:validating for Phase <n>."`
   - If context exceeds roughly 65% at a phase boundary, write `.khuym/HANDOFF.json` and pause.
   - End with: `Phase plan approved and current phase prepared. Invoke khuym:validating skill for Phase <n>.`

## Approval Gate Wording

After `phase-plan.md`, present:

- feature summary in 2-4 sentences
- phases in order
- stories inside each phase
- which phase will be prepared next

Use this hard-gate wording:

> Planning has broken the feature into phases and stories. Review `history/<feature>/phase-plan.md`. If you approve this shape, planning will prepare Phase <n> for validating. Do not create beads before this approval.

If the user asks for revisions, update `phase-plan.md` first.

## Bead Creation Prompt

When asking a model to perform the bead-creation pass, use:

```text
OK so please take ALL of that and elaborate on it more and then create a comprehensive and granular set of beads for all this with tasks, subtasks, and dependency structure overlaid, with detailed comments so that the whole thing is totally self-contained and self-documenting (including relevant background, reasoning/justification, considerations, etc.-- anything we'd want our "future self" to know about the goals and intentions and thought process and how it serves the over-arching goals of the project.) Use the `br` tool repeatedly to create the actual beads. Use /effort max.
```

## Boundary Clarifications

- Planning reads `CONTEXT.md`; it does not override locked decisions.
- Planning defines the whole-feature phase plan before current-phase prep.
- Planning creates beads only for the current approved phase.
- Planning does the research that exploring deliberately avoided.
- Planning does not run spikes; validating owns spike execution.

## Red Flags

- Skipping learnings retrieval
- Ignoring `CONTEXT.md`
- Creating current-phase beads before user approval
- Creating later-phase beads early
- Stories with no clear unlock or contribution
- Exit states that are vague or non-observable
- Writing pseudo-beads in Markdown
- HIGH-risk items with no risk flag in `approach.md`
- Missing dependencies between beads
