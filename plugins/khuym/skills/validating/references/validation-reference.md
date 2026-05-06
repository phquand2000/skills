# Validation Reference

Use after `khuym:validating` is selected and the work shape is approved.

## Protocol

1. Orient: read state, mode, approved shape, and current story/work.
2. Reality gate: prove fit against repo files, APIs, commands, tests, versions, runtime constraints, credentials, and service limits.
3. Feasibility matrix: list blocking assumptions, proof, evidence, and result.
4. Spike/probe: require one yes/no proof for unproven assumptions that can invalidate current work.
5. Integration readiness: proven parts can stitch together without hidden architecture work.
6. Current story readiness: entry, exit, verification, scope, and assumptions are executable.
7. Bead handoff: if beads are required but absent after READY, return to planning to create only current-story/work beads, then resume.
8. Bead review: when beads exist, run `bv --robot-suggest`, `bv --robot-insights`, `bv --robot-priority`, then fresh-eyes review.
9. Approval: ask the user to approve execution for this work only.

Repair routing: fake assumption/wrong mode -> planning; phase meaning -> contract; story order/scope -> story map; decision coverage -> story map or beads; dependency/scope/test gaps -> beads; unreachable exit -> contract, story map, or shape artifact.

## Reality Gate

```text
REALITY GATE REPORT
Mode: <mode>
Current work: <one sentence>
MODE FIT: PASS|FAIL
REPO FIT: PASS|FAIL
ASSUMPTIONS: PASS|FAIL
SMALLER PATH: PASS|FAIL
PROOF SURFACE: PASS|FAIL
Decision: proceed | revise planning | run spike first | collapse mode
Evidence: <file/command/runtime evidence>
```

Fail if the plan assumes nonexistent code, unsupported commands, stale versions, missing credentials, unreachable services, hidden architecture work, or too much ceremony.

## Feasibility Matrix

Required for `standard_feature` when assumptions remain and always for `high_risk_feature`.

```text
FEASIBILITY MATRIX
Part / Assumption | Risk | Proof Required | Evidence | Result
```

Accepted evidence: existing implementation, file/API/type inspection, command output, build/typecheck/test result, official version/doc proof, runtime/API probe, or `.spikes/<feature>/` proof.

Fail if evidence is only "this should work", "likely", "expected", or model knowledge.

Decisions:

```text
READY
READY WITH CONSTRAINTS
NOT READY - RUN SPIKE
NOT READY - RETURN TO PLANNING
```

READY is feasibility, not execution approval, until required current-story/work beads pass review.

## Spike / Probe Rules

- One spike = one yes/no question.
- Disposable proof may live under `.spikes/<feature>/`.
- Spike code must not silently become production implementation.
- `NO` returns to planning with the failed assumption and plan change.
- `YES` records constraints for planning and execution.

## Readiness Checks

Current story/work passes only when exit is testable, blocking assumptions are proven/constrained, integration is believable, verification is concrete, and beads are worker-sized/current-work scoped.

## Approval Gate

```text
VALIDATION COMPLETE - APPROVAL REQUIRED BEFORE EXECUTION
Mode: <mode>
Work: <phase/direct task/spike/small change>
Current story: <story name or none>
Reality gate: PASS
Feasibility: READY | READY WITH CONSTRAINTS
Structure: PASS after <N> iterations
Spikes: <none | passed | concerns>
Integration readiness: PASS
Bead review: <done | not needed>
Current story/work readiness: PASS
Unresolved concerns: <none | list>
Approve execution for this work? (yes/no)
```

## Plan Checker

Verify, do not redesign. PASS only when all dimensions pass: mode/shape, epic/story fit, decisions, feasibility evidence, dependencies/file scope, context budget, verification, integration/exit/risk.

## Bead Reviewer

Stress-test whether current-story/work beads can be picked up cold.

```text
BEAD REVIEW REPORT
Work: <current story / phase / direct task>
Beads reviewed: <N>
CRITICAL FLAGS: BR-<id> problem/evidence/fix
MINOR FLAGS: BR-<id> problem/evidence/suggestion
CLEAN BEADS: BR-<id>, BR-<id>
REVISIONS MADE: BR-<id> change/why
SUMMARY: <2-3 sentences>
```

CRITICAL: assumed context, vague acceptance, scope overload, missing path, unproven feasibility, or broken verification. MINOR: missing rationale, implicit file assumption, fuzzy boundary, or known tradeoff not recorded.

## Red Flags And Pressure Scenarios

- skipping reality or feasibility gates
- accepting plausibility without concrete proof
- continuing after a `NO` spike
- current story has vague proof or unobservable exit
- beads are not tied to current story/work
- small fix creates epic/phase ceremony
- tough feature lacks epic map or equivalent capability/risk shape
