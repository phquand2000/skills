# Validation Reference

Use after `khuym:validating` is selected and the current phase is approved.

## Protocol

1. **Orient:** read state and phase artifacts. Present phase name, stories, and one practical goal. Stop if phase plan lacks user approval.
2. **Structural verification:** max 3 plan-checker iterations over beads plus `CONTEXT.md`, `discovery.md`, `approach.md`, `phase-plan.md`, contract, and story map.
3. **Spikes:** for every HIGH-risk current-phase item, create a 30-minute spike bead with a yes/no question. YES embeds constraints; NO returns to planning.
4. **Bead polishing:** run `bv --robot-suggest`, `bv --robot-insights`, and `bv --robot-priority`; fix duplicates, orphaned beads, story mismatch, priority mismatch, and scope problems.
5. **Fresh-eyes bead review:** run the bead-reviewer prompt below. Fix all CRITICAL flags.
6. **Exit-state readiness:** confirm stories and beads make the phase exit state true, the demo is credible, and the phase still fits the whole plan.
7. **Approval:** ask the user to approve execution for this phase only.

Repair routing: phase meaning -> contract; story order/scope -> story map;
decision coverage -> story map or beads; dependency/scope/test gaps -> beads;
unreachable exit state -> contract, story map, or phase plan.

## Approval Gate

```text
VALIDATION COMPLETE - APPROVAL REQUIRED BEFORE EXECUTION

Phase: Phase <n> - <name>
Stories: <N>
Beads: <N>
Demo: <one-line walkthrough>
Structural verification: PASS after <N> iterations
Spike results: <none | all passed | concerns>
Polishing: <graph fixes, priority changes, duplicates removed>
Fresh-eyes CRITICAL flags fixed: <N>
Exit-state readiness: PASS
Unresolved concerns: <none | list>

Approve execution for Phase <n>? (yes/no)
```

## Plan-Checker Prompt

You are the Khuym plan-checker. Find structural problems that would make the
current phase fail. Do not improve the plan; verify it.

Output:

```text
PLAN VERIFICATION REPORT
Feature: <feature>
Current phase: Phase <n> - <name>
Stories reviewed: <N>
Beads reviewed: <N>
Date: <today>

DIMENSION 1 - Phase Contract Clarity: PASS|FAIL
DIMENSION 2 - Story Coverage And Ordering: PASS|FAIL
DIMENSION 3 - Decision Coverage: PASS|FAIL
DIMENSION 4 - Dependency Correctness: PASS|FAIL
DIMENSION 5 - File Scope Isolation: PASS|FAIL
DIMENSION 6 - Context Budget: PASS|FAIL
DIMENSION 7 - Verification Completeness: PASS|FAIL
DIMENSION 8 - Exit-State Completeness And Risk Alignment: PASS|FAIL

OVERALL: PASS|FAIL
PRIORITY FIXES:
1. <only if FAIL>
```

For each dimension, give brief evidence and quote the failing text when failing.
PASS overall only when all dimensions pass.

Dimension meanings:

- contract: practical change, why now, entry, exit, demo, unlocks, out-of-scope, pivot signals
- stories: clear jobs, ordering, and coverage of the phase exit state
- decisions: relevant `D#` decisions map to stories and beads
- dependencies: no cycles, missing references, or hidden story/bead dependencies
- scope: parallel-ready beads do not write the same files unless ordered
- context: each bead fits one bounded worker run
- verification: story/bead done criteria are concrete and runnable
- exit/risk: all beads make the exit true and HIGH risks have spikes

## Bead-Reviewer Prompt

You are the Khuym bead-reviewer. You see only current-phase beads, like a fresh
executor. Stress-test whether each bead can be picked up cold and completed.
Do not redesign the plan; revise only clear local fixes.

Output:

```text
BEAD REVIEW REPORT
Phase: Phase <n> - <infer if needed>
Beads reviewed: <N>
Date: <today>

CRITICAL FLAGS (<N>)
[CRITICAL] BR-<id>: <title>
Problem: <one sentence>
Evidence: "<direct quote>"
Fix required: <specific action>

MINOR FLAGS (<N>)
[MINOR] BR-<id>: <title>
Problem: <one sentence>
Evidence: "<direct quote>"
Suggestion: <specific improvement>

CLEAN BEADS (<N>)
BR-<id>, BR-<id>

REVISIONS MADE (<N>)
[UPDATED] BR-<id>: <title>
Change: <what changed>
Why: <why safer or clearer>

SUMMARY
<2-3 sentences>
```

CRITICAL: assumed context, vague acceptance, scope overload, missing implementation
path, or broken verification. MINOR: missing rationale, implicit file assumption,
fuzzy boundary, or known tradeoff not recorded.

Do not flag brief valid beads, architecture preferences, valid bead ID references,
missing out-of-scope features, or style-only issues.

## Red Flags

- executing before approval
- validating without approved phase plan
- fourth structural iteration
- continuing after a NO spike
- unobservable exit state
- bead done criteria not tied to a story
