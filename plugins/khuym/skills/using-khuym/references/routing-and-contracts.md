# Routing And Contracts Reference

Open this when the compact bootstrap in `SKILL.md` is not enough.

## Skill Catalog

| # | Skill | One-line description | Load when... |
|---|-------|----------------------|--------------|
| 1 | `khuym:using-khuym` | Routing, go mode, red flags. | Starting any session |
| 2 | `khuym:exploring` | Identify gray areas, lock decisions into `CONTEXT.md`. | Feature request is vague or new |
| 3 | `khuym:planning` | Research and synthesize into phase/story artifacts and current-phase beads. | Decisions are locked and ready for planning |
| 4 | `khuym:validating` | Verify the current phase contract, story map, and bead graph before execution. | Phase plan is approved |
| 5 | `khuym:swarming` | Launch and tend Codex subagents with local reservations and bv. | Beads are validated |
| 6 | `khuym:executing` | Bounded worker loop for one bead. | Spawned by swarming |
| 7 | `khuym:reviewing` | Parallel review gate with P1/P2/P3 findings. | Execution complete |
| 8 | `khuym:compounding` | Capture durable learnings. | Feature shipped |
| 9 | `khuym:writing-khuym-skills` | TDD-for-skills and persuasion psychology. | Improving or creating Khuym skills |
| 10 | `khuym:debugging` | Root-cause blocked beads and execution failures. | Agent stuck or unexpected error |
| 11 | `khuym:gkg` | Codebase intelligence via gkg MCP tools. | Need deep codebase understanding |

## First-Skill Routing

| Request type | First skill | Notes |
|---|---|---|
| Vague/new feature | `khuym:exploring` | Always start here if gray areas exist |
| Research task | `khuym:planning` | Skip exploring only if scope is fully clear |
| "Just fix this" / small change | `khuym:planning` | Route in `small_change` mode |
| Review code | `khuym:reviewing` | Load directly |
| Capture learnings | `khuym:compounding` | Load directly |
| Improve Khuym itself | `khuym:writing-khuym-skills` | Load directly |
| Agent stuck / error | `khuym:debugging` | Load directly |
| `/go` / full pipeline | Go mode | Chain all skills |
| Resume session | Resume logic | Check `HANDOFF.json` first |

## State Bootstrap

On every session start:

1. Confirm Khuym onboarding is current via `.khuym/onboarding.json`.
2. Run `node .codex/khuym_status.mjs --json` when available.
3. Check `gkg_readiness` and prepare gkg when supported but not ready.
4. Ensure `.khuym/state.json` exists.
5. If `.khuym/HANDOFF.json` exists, present it and wait.
6. Read `history/learnings/critical-patterns.md` when present.

Default `.khuym/state.json` shape:

```json
{
  "schema_version": "1.1",
  "phase": "idle",
  "approved_gates": {
    "context": false,
    "phase_plan": false,
    "execution": false,
    "review": false
  }
}
```

## Resume Logic

If `.khuym/HANDOFF.json` exists:

1. Read `HANDOFF.json` and `.khuym/state.json`.
2. Extract phase, skill, feature, context percent, next action, and beads in flight.
3. Present the pause point to the user.
4. Continue only after confirmation.

Do not auto-resume.

## Go Mode Sequence

Trigger: `/go [feature]`, "run the full pipeline", or "go mode".

```text
exploring -> [GATE 1] -> planning (whole feature) -> [GATE 2]
          -> planning (current phase prep) -> validating -> [GATE 3]
          -> swarming (+ executing xN)
          -> if more phases remain: planning next phase and repeat
          -> if final phase complete: reviewing -> [GATE 4] -> compounding -> DONE
```

Gate wording:

- Gate 1: "Decisions locked. Approve CONTEXT.md before planning?"
- Gate 2: "Phase breakdown is ready. Approve phase-plan.md before current-phase preparation?"
- Gate 3: "Current phase verified. Approve execution?"
- Gate 4: if P1 > 0, "P1 findings block merge. Fix before proceeding?"; if P1 = 0, "Review complete. Approve merge?"

## Mode Details

`small_change` path:

```text
planning (lightweight)
  -> present one-phase plan and wait for approval
  -> validating (lightweight)
  -> swarming (single worker)
  -> executing
  -> reviewing (lightweight)
  -> compounding only if a lesson was learned
```

Choose `small_change` only when:

- change touches at most 3 files
- no new API surface or data model changes
- risk is clearly low
- no gray areas about intent
- the phase can honestly be expressed as one story

`standard_feature` uses the normal chain:

```text
exploring -> planning -> validating -> swarming -> executing -> reviewing -> compounding
```

`high_risk_feature` adds deeper planning, explicit second-opinion refinement, spike discipline, and slower Gate 3 approval.

## Communication Contract

Default tone:

- practical first, abstract second
- scenario-first, not jargon-first
- explain what happens in real life before naming technical properties
- translate decision IDs, invariants, and architecture terms into plain language
- prefer "here is what the code does today" over "here is the category of bug"

For plans, findings, blockers, and handoffs, answer in this order:

1. Plain-language summary
2. Current behavior or state
3. Why it matters
4. Concrete scenario
5. Next step

Avoid terms like "violates D5" or "non-monotonic" without immediate explanation.

## File Quick Reference

```text
.khuym/
  onboarding.json
  state.json
  config.json
  HANDOFF.json
  reservations.json

.codex/
  khuym_status.mjs
  khuym_state.mjs
  khuym_reservations.mjs

history/<feature>/
  CONTEXT.md
  discovery.md
  approach.md
  phase-plan.md
  phase-<n>-contract.md
  phase-<n>-story-map.md

history/learnings/
  critical-patterns.md
  YYYYMMDD-<slug>.md

.beads/
.spikes/
.worktrees/
```

## Chaining Contract

| Skill | Reads | Writes |
|-------|-------|--------|
| exploring | user conversation | `history/<feature>/CONTEXT.md` |
| planning | `CONTEXT.md`, `critical-patterns.md` | discovery, approach, phase plan, contract/story map, beads |
| validating | phase artifacts, beads, approach, context | validated phase and spike results |
| swarming | validated beads, state, reservations | spawned worker state, handoff, state updates |
| executing | bead, reservations, context | implementation commits, `br close`, worker result |
| reviewing | diff, context, approach, beads | P1/P2/P3 findings |
| compounding | review findings, history | learning entry and critical promotions |
