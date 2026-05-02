# Validation Reference

Use after `khuym:validating` is selected and work shape is approved.

## Protocol

1. **Orient:** read state, mode, and approved shape. Present mode, work, and one practical goal. Stop if approval is missing.
2. **Reality gate:** prove mode/plan fit repo files, APIs, commands, tests, versions, runtime constraints, and missing surfaces. Challenge smaller modes.
3. **Structural verification:** max 3 plan-checker iterations over mode-required artifacts.
4. **Spikes:** require yes/no proof for assumptions that can invalidate the path. YES embeds constraints; NO returns to planning.
5. **Bead polishing/review:** when beads exist, run `bv --robot-suggest`, `bv --robot-insights`, `bv --robot-priority`, then fresh-eyes bead review. Fix CRITICAL flags.
6. **Exit-state readiness:** confirm the current work makes its exit true, proof is credible, and future work is not smuggled in.
7. **Approval:** ask the user to approve execution for this work only.

Repair routing: wrong mode/fake assumption -> planning; phase meaning -> contract;
story order/scope -> story map; decision coverage -> story map or beads;
dependency/scope/test gaps -> beads; unreachable exit -> contract, story map, or shape artifact.

## Reality Gate

Output:

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

Fail if the plan assumes nonexistent code, unsupported commands, stale versions,
missing credentials, unreachable services, hidden architecture work, or too much
ceremony. Validating may collapse mode, require a spike, or return to planning before bead review.

## Approval Gate

```text
VALIDATION COMPLETE - APPROVAL REQUIRED BEFORE EXECUTION

Mode: <mode>
Work: <Phase <n> - <name> | direct task | spike | small change>
Stories: <N or none>
Beads: <N or none>
Demo: <one-line walkthrough>
Reality gate: PASS
Structure: PASS after <N> iterations
Spikes: <none | passed | concerns>
Polishing/review: <done | not needed>
Exit-state readiness: PASS
Unresolved concerns: <none | list>

Approve execution for this work? (yes/no)
```

## Plan-Checker Prompt

You are the Khuym plan-checker. Find structural problems that would make the
current work fail. Do not redesign the plan; verify it.

Output:

```text
PLAN VERIFICATION REPORT
Feature: <feature>
Mode: <mode>
Work: <phase/direct task/spike/small change>
Stories reviewed: <N or none>
Beads reviewed: <N or none>
Date: <today>

D1 Mode/Shape: PASS|FAIL
D2 Stories: PASS|FAIL
D3 Decisions: PASS|FAIL
D4 Dependencies: PASS|FAIL
D5 File Scope: PASS|FAIL
D6 Context Budget: PASS|FAIL
D7 Verification: PASS|FAIL
D8 Exit/Risk: PASS|FAIL

OVERALL: PASS|FAIL
PRIORITY FIXES:
1. <only if FAIL>
```

Give brief evidence. PASS overall only when all dimensions pass.

Dimension meanings:

- mode/shape: least workflow that protects the work; entry, exit, demo, scope, pivot signals as needed
- stories: clear jobs, ordering, exit coverage; PASS as not needed for direct tasks/spikes
- decisions: relevant `D#` decisions map to stories and beads
- dependencies: no cycles, missing references, or hidden story/bead dependencies
- scope: parallel-ready beads do not write the same files unless ordered
- context: each bead fits one bounded worker run
- verification: story/bead done criteria are concrete and runnable
- exit/risk: all beads make the exit true and HIGH risks have spikes

## Bead-Reviewer Prompt

You are the Khuym bead-reviewer. You see only current-phase beads, like a fresh
executor. Stress-test whether each bead can be picked up cold and completed.
Do not redesign the plan.

Output:

```text
BEAD REVIEW REPORT
Phase: Phase <n> - <infer if needed>
Beads reviewed: <N>
Date: <today>

CRITICAL FLAGS (<N>): BR-<id> problem/evidence/fix
MINOR FLAGS (<N>): BR-<id> problem/evidence/suggestion
CLEAN BEADS (<N>): BR-<id>, BR-<id>
REVISIONS MADE (<N>): BR-<id> change/why

SUMMARY
<2-3 sentences>
```

CRITICAL: assumed context, vague acceptance, scope overload, missing path, or
broken verification. MINOR: missing rationale, implicit file assumption, fuzzy
boundary, or known tradeoff not recorded.

Do not flag brief valid beads, architecture preferences, valid bead ID references,
missing out-of-scope features, or style-only issues.

## Red Flags

- executing before approval
- validating without approved shape artifact
- skipping the reality gate
- approving a well-written plan that does not match current repo truth
- fourth structural iteration
- continuing after a NO spike
- unobservable exit state
- bead done criteria not tied to a story
