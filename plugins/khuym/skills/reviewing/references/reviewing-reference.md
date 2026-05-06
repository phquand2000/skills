# Reviewing Reference

Use after final swarm execution completes.

## Automated Review

Dispatch specialists with only diff/range, `CONTEXT.md`, and `approach.md`.
Agents 1-4 may run in parallel; Agent 5 runs after they finish.

| Agent | Focus |
|---|---|
| `code-quality` | correctness, readability, type safety; cite file/line evidence |
| `architecture` | boundaries, coupling, API design, maintainability |
| `security` | auth, secrets, injection, permissions, data exposure |
| `test-coverage` | missing edge cases, regression paths, weak assertions |
| `learnings-synthesizer` | known patterns, prior failures, compounding candidates |

Specialist prompt shape:

```text
You are the <agent> reviewer. Review only your focus area. Lead with findings.
For each finding include severity P1/P2/P3, file/line evidence, failure scenario,
and smallest credible fix. Do not rewrite code unless explicitly asked.
```

Severity:

- P1: security breach, data loss, breaking change, production blocker
- P2: real performance, architecture, reliability, or important test gap
- P3: cleanup, docs, or future debt

When uncertain, choose P2. P1 blocks merge until user acknowledgment.

## Review Beads

Each distinct issue becomes a bead.

| Severity | Priority | Linkage |
|---|---|---|
| P1 | 1 | current review/epic-close path |
| P2 | 2 | `external_ref=<epic-id>` + review labels |
| P3 | 3 | `external_ref=<epic-id>` + review labels |

Labels: `review`, `review-p<N>`, source label (`security`, `architecture`,
`code-quality`, `test-coverage`), and optional `known-pattern`.

Title: `Resolve Review P<N>: <problem title>`

Body:

```markdown
## Plain-Language Summary
<1-3 sentences>

## What The Code Does Today
- <current behavior and source>

## Why This Is A Problem
- <requirement, decision, or invariant broken>

## Concrete Failure Scenario
- <realistic steps and incorrect outcome>

## Evidence
File: `path`
Line(s): <line>
Snippet: <small relevant snippet>
Why this proves the issue: <one sentence>

## Proposed Fix
Recommended: <smallest credible fix>
Tradeoff: <if any>

## Acceptance Criteria
- [ ] <specific testable condition>
```

P2/P3 follow-ups must not use `--parent <epic-id>`.

## Synthesis

Deduplicate overlaps, close redundant duplicates as `Duplicate of <bead-id>`,
attach known-pattern notes, present counts and bead IDs by severity, then stop on P1.

## Artifact Verification

For promised artifacts in `CONTEXT.md` and `approach.md`, verify:

- `EXISTS`: artifact exists
- `SUBSTANTIVE`: not stub, placeholder, TODO-only, fake static path, or empty handler
- `WIRED`: imported and used by the integration path

All three pass = OK. EXISTS + SUBSTANTIVE only = P2. Missing or EXISTS only = P1.

## Human UAT

For SEE/CALL/RUN decisions in `CONTEXT.md`:

```text
UAT Item <i>/<n> - Decision <D-id>:
"<deliverable>"
Can you confirm this works? [Pass / Fail / Skip]
```

Failure creates a P1 fix bead and rerun. Skip requires a reason in `.khuym/state.json`.

## Finishing

- verify graph closure with `bv --robot-triage --graph-root <epic-id>`
- run project build/test/lint gates
- create review beads for blockers
- present merge options
- close epic with `br close <epic-id> --reason "Feature complete: <summary>"`
- archive `history/<feature>/state-final.json`
- reset active fields in `.khuym/state.json`

## Red Flags

- P1 without user acknowledgment
- UAT failure marked pass
- artifact verification skipped
- epic closed with open beads
- Agent 5 before agents 1-4
- P2/P3 attached as current-epic children
