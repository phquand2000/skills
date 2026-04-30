# Planning Reference

Use this when `khuym:planning` needs quality checks or artifact schemas.

## Quality Rules

- Explain phases by what becomes true for users or systems.
- Keep 2-4 phases; each phase needs an observable demo.
- Stories are ordered steps inside the current phase, not architecture layers.
- Beads are worker-sized: one concern, clear file scope, dependencies, verification.
- Risk: LOW = direct existing pattern; MEDIUM = variation; HIGH = novel, external/security/data risk or >5-file blast radius. HIGH needs a spike.

Trace must hold:

```text
feature -> phase -> story -> bead
```

## Discovery Template

```markdown
# Discovery Report: <Feature>

**Date:** <YYYY-MM-DD>
**Feature:** <slug>
**CONTEXT.md:** `history/<feature>/CONTEXT.md`

## Institutional Learnings
- Critical patterns: <relevant entries or none>
- Domain learnings: <file -> insight, or none>

## Architecture Snapshot
| Area | Purpose | Key Files |
|---|---|---|
| <module> | <owner/purpose> | `<path>` |

Entry points: <API/UI/job/service paths>
Model after: `<path>` - <pattern>

## Constraints
- Runtime/framework: <versions>
- Dependencies: <existing and new, with risk>
- Quality gates: `<command>`, `<command>`

## External Research
Only for new libraries/integrations: <source, version/date, actionable gotcha>.

## Summary For Synthesis
Have: <1-2 sentences>
Need: <1-2 sentences>
Constraints/warnings: <bullets>
```

## Approach Template

```markdown
# Approach: <Feature>

## Recommended Approach
<3-5 sentences with concrete strategy and why it fits locked decisions.>

Key decisions:
| Decision | Choice | Rationale |
|---|---|---|
| <topic> | <choice> | <why> |

Alternatives considered: <option -> why rejected>

## Risk Map
| Component | Risk | Reason | Validation |
|---|---|---|---|
| <component> | LOW/MEDIUM/HIGH | <why> | proceed/sketch/spike |

HIGH-risk spikes: <component -> yes/no question, or none>

Files/order/learnings/open questions: `<path>` - <purpose>; Layer 1 -> Layer 2; `history/learnings/<file>` - <effect>; [ ] <validating question>
```

## Phase Plan Template

```markdown
# Phase Plan: <Feature>

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

## Phase Contract Template

```markdown
# Phase Contract: Phase <N> - <Name>

## What This Phase Changes
<2-4 practical sentences>

## Why Now
- <ordering reason>
- <risk if skipped>

## Entry State
- <observable truth>

## Exit State
- <testable truth>

## Demo Walkthrough
<short proof> with checklist steps.

## Story Sequence
| Story | What Happens | Why Now | Unlocks | Done Looks Like |
|---|---|---|---|---|
| Story 1 | <outcome> | <why first> | <next> | <proof> |

## Out Of Scope / Success / Pivot Signals
- Out: <not solved>
- Success: <review/UAT proof>
- Pivot: <signal to revise>
```

## Story Map Template

```markdown
# Story Map: Phase <N> - <Name>

## Dependency Diagram
`Entry -> Story 1 -> Story 2 -> Exit` (replace with Mermaid when helpful)

## Story Table
| Story | What Happens | Why Now | Contributes To | Creates | Unlocks | Done Looks Like |
|---|---|---|---|---|---|---|
| Story 1 | <outcome> | <why first> | <exit item> | <artifact> | <next> | <proof> |

## Order Check
- [ ] Story 1 is obviously first.
- [ ] Later stories build on or de-risk earlier stories.
- [ ] If all stories finish, the phase exit state holds.

## Story-To-Bead Mapping
| Story | Beads | Notes |
|---|---|---|
| Story 1 | <br-id> | <scope/dependency note> |
```
