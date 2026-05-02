# Planning Reference

Use this when `khuym:planning` needs quality checks or artifact schemas.

## Quality Rules

- Use the least workflow that can honestly protect the work.
- Choose one mode before shaping artifacts: `direct_task`, `spike`, `small_change`, `standard_feature`, or `high_risk_feature`.
- Explain phases by what becomes true for users or systems.
- Use phases only when separate observable milestones reduce risk or clarify approval. Standard features usually have 2-4 phases; smaller modes usually do not.
- Stories are ordered steps inside current work, not architecture layers. Skip stories when the work is one clear unit.
- Beads are worker-sized: one concern, clear file scope, dependencies, verification.
- Risk: LOW = direct existing pattern; MEDIUM = variation; HIGH = novel, external/security/data risk or >5-file blast radius. HIGH needs a spike.

Trace must hold at the chosen scale:

```text
mode -> shape -> work -> story? -> bead?
```

## Mode Gate

| Mode | Use When | Shape |
|---|---|---|
| `direct_task` | obvious local change, no ambiguity | short approach + one bead or direct handoff |
| `spike` | one assumption decides the path | yes/no question, proof, outcome |
| `small_change` | <=3 files, LOW risk, no API/data model change | one work shape, usually one bead |
| `standard_feature` | user-visible capability needs ordered slices | phase plan, current phase contract/story map, beads |
| `high_risk_feature` | hard-to-reverse, external/security/data, or broad blast radius | standard feature plus spikes and stricter validation |

Above `small_change`, record why smaller modes are insufficient.

## Discovery

```markdown
# Discovery Report: <Feature>

**Date:** <YYYY-MM-DD>
**Feature:** <slug>
**CONTEXT.md:** `history/<feature>/CONTEXT.md`

## Architecture Snapshot
| Area | Purpose | Key Files |
|---|---|---|
| <module> | <purpose> | `<path>` |

Entry points: <paths>

## Constraints
- Runtime/framework: <versions>
- Dependencies: <existing and new, with risk>
- Quality gates: `<command>`, `<command>`

## Summary For Synthesis
Have: <1-2 sentences>
Need: <1-2 sentences>
Constraints/warnings: <bullets>
```

## Approach

```markdown
# Approach: <Feature>

## Recommended Approach
<3-5 sentences with strategy and why it fits locked decisions.>

Alternatives considered: <option -> why rejected>

## Risk Map
| Component | Risk | Reason | Validation |
|---|---|---|---|
| <component> | LOW/MEDIUM/HIGH | <why> | proceed/sketch/spike |

Spikes: <assumption -> yes/no question, or none>

Files/order/learnings/questions: `<path>`; Layer 1 -> Layer 2; `history/learnings/<file>`; [ ] <validating question>
```

## Phase Plan

```markdown
# Phase Plan: <Feature>

Mode: `standard_feature` | `high_risk_feature`

## Feature Summary
<2-4 sentences>

## Phase Overview
| Phase | What Changes | Why Now | Demo | Unlocks |
|---|---|---|---|---|
| Phase 1: <name> | <outcome> | <why first> | <proof> | <next> |
| Phase 2: <name> | <outcome> | <why next> | <proof> | <next> |

## Order Check
- [ ] Phase 1 is obviously first.
- [ ] Later phases depend on or benefit from earlier phases.
- [ ] No phase is merely a technical bucket.

## Approval Summary
- Current phase to prepare next: Phase <n> - <name>
- Picture after that phase: <one sentence>
- Deferred until later: <one sentence>
```

For `direct_task`, `spike`, or `small_change`, replace the phase table with:

```markdown
# Work Shape: <Feature>

Mode: `<mode>`
Why this mode: <why smaller/bigger workflow is unnecessary>
Current work: <one practical outcome or yes/no spike question>
Proof: `<command>` or observable check
Out of scope: <what this will not solve>
Approval: approve this work shape before prep/beads.
```

## Phase Contract

```markdown
# Phase Contract: Phase <N> - <Name>

## Entry State
- <observable truth>

## Exit State
- <testable truth>

## Demo Walkthrough
<short proof> with checklist steps.

## Story Sequence
| Story | What Happens | Unlocks | Done |
|---|---|---|---|
| Story 1 | <outcome> | <next> | <proof> |

## Out Of Scope / Success / Pivot Signals
- Out: <not solved>
- Success: <review/UAT proof>
- Pivot: <signal to revise>
```

## Story Map

```markdown
# Story Map: Phase <N> - <Name>

## Dependency Diagram
`Entry -> Story 1 -> Story 2 -> Exit` (replace with Mermaid when helpful)

## Story Table
| Story | What Happens | Contributes To | Creates | Done |
|---|---|---|---|---|
| Story 1 | <outcome> | <exit item> | <artifact> | <proof> |

## Order Check
- [ ] Story 1 is obviously first.
- [ ] Later stories build on or de-risk earlier stories.
- [ ] If all stories finish, the phase exit state holds.

## Story-To-Bead Mapping
| Story | Beads | Notes |
|---|---|---|
| Story 1 | <br-id> | <scope/dependency note> |
```
