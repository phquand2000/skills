# Go Mode Pipeline — Step-by-Step Reference

> Load this when executing go mode. Contains the detailed sequence, gate conditions, fallback paths, and config options.
>
> Source patterns: CE `/lfg` + `/slfg`, GSD discuss/research/plan/verify loop, khuym architecture v2.

---

## Overview

Go mode is the full khuym pipeline from raw feature request to merged, compounded learnings. It chains every skill in sequence with exactly 4 human gates. The pipeline is designed so that each gate protects the next irreversible commitment.

```text
User: "/go [feature]"
       │
       ▼
[BOOTSTRAP] Check state, read critical-patterns.md
       │
       ▼
[STEP 1] exploring
       │ Output: history/<feature>/CONTEXT.md
       │
       ▼
[GATE 1] ← HARD STOP: "Approve CONTEXT.md?"
       │
       ▼
[STEP 2] planning (work shape)
       │ Output: discovery.md, approach.md, mode-sized shape artifact
       │
       ▼
[GATE 2] ← HARD STOP: "Approve work shape?"
       │
       ▼
[STEP 3] planning (current work prep)
       │ Output: needed contracts/story maps, current-work beads when needed
       │
       ▼
[STEP 4] validating (current work)
       │ Reality gate + plan-checker (<=3x) + spikes + bead polish
       │
       ▼
[GATE 3] ← HARD STOP: "Current work verified. Approve execution?"
       │
       ▼
[STEP 5] swarming -> executing (xN workers)
       │ Current work only
       │
       ├── if later work remains -> return to STEP 3 for the next work
       │
       ▼
[STEP 6] reviewing (after final phase only)
       │ 5 parallel review agents -> P1/P2/P3 findings
       │ Artifact verification + human UAT
       │
       ▼
[GATE 4] ← HARD STOP: "Approve merge?"
       │
       ▼
[STEP 7] compounding
       │ Capture learnings -> history/learnings/
       │
       ▼
DONE
```

---

## Pre-Pipeline: Bootstrap

Before invoking `khuym:exploring`, always:

1. Run State Bootstrap from SKILL.md (check `.khuym/`, read `critical-patterns.md`).
2. Determine feature slug from the user's description (lowercase-hyphenated, e.g. `agent-email-inbox`).
3. Create `history/<feature>/` if it does not exist.
4. Update `.khuym/state.json` with:
   - `feature_slug: <feature>`
   - `phase: go-mode/exploring`
   - `mode: go`
   - `focus: <feature>`
   - `last_updated: <timestamp>`

---

## Step 1: Exploring

**Invoke:** Load `khuym:exploring` skill.

**Input:** User's feature description.

**The khuym:exploring skill will:**

- Classify domain (SEE / CALL / RUN / READ / ORGANIZE)
- Identify gray areas via Socratic Q&A
- Lock decisions with stable IDs (D1, D2, ...)
- Write `history/<feature>/CONTEXT.md`
- Self-review `CONTEXT.md`

**Update state.json:** set `phase` to `go-mode/gate-1`

---

## GATE 1: Approve CONTEXT.md

```text
HARD-GATE: Do not proceed until user explicitly approves.

Present:
  "Exploration complete for [feature].
   [N] decisions locked in history/<feature>/CONTEXT.md.
   [M] open questions noted.

   Key decisions:
   - D1: [summary]
   - D2: [summary]
   ... (max 5, then 'see CONTEXT.md for full list')

   Approve decisions and proceed to planning? (yes / revise / show full CONTEXT.md)"
```

If user says `revise`, loop back to exploring. If user says `yes`, proceed to Step 2.

---

## Step 2: Planning (Whole Feature)

**Invoke:** Load `khuym:planning` skill.

**Input:** `history/<feature>/CONTEXT.md`, `history/learnings/critical-patterns.md`.

**The first planning pass will:**

- retrieve learnings
- run discovery
- synthesize an approach
- choose the mode: `direct_task`, `spike`, `small_change`, `standard_feature`, or `high_risk_feature`
- write the smallest shape artifact that fits: direct task note, spike question, small-change work shape, or `history/<feature>/phase-plan.md`
- show the chosen shape in plain English

**Important:** this step does **not** create beads yet.

**Update state.json:** set `phase` to `go-mode/gate-2`

---

## GATE 2: Approve Work Shape

```text
HARD-GATE: Do not proceed until user explicitly approves.

Present:
  "Planning complete for [feature].
   Mode: [direct_task / spike / small_change / standard_feature / high_risk_feature]
   Proposed shape:
   - [work item / spike question / Phase 1 outcome]
   - [only list more phases when the mode needs them]

   Why this is the least workflow that protects the work: [one sentence]

   Approve this work shape before current preparation? (yes / revise / show full artifact)"
```

If user says `revise`, return to the planning pass that owns the shape artifact. If user says `yes`, proceed to Step 3.

---

## Step 3: Planning (Current Phase Prep)

**Invoke:** Load `khuym:planning` again in current-phase preparation mode.

**Input:** approved shape artifact, `approach.md`, `CONTEXT.md`.

**The second planning pass will:**

- select the current execution surface from the approved shape
- write only the contract/story-map artifacts the mode needs
- create beads only for that approved execution surface

**Rules:**

- default to the first unprepared approved work item
- never create future-work beads early
- every bead must include mode and work context; include `Phase <n>` and `Story <m>` only when those exist

**Update state.json:** set `phase` to `go-mode/validating`

---

## Step 4: Validating (Current Work)

**Invoke:** Load `khuym:validating` skill.

**Input:** current work beads when present, approved shape artifact, current work artifacts, `approach.md`, `CONTEXT.md`.

**The khuym:validating skill will:**

- Phase 0: orient on mode/current work and confirm the shape was approved
- Phase 1: reality gate against current repo/system truth
- Phase 2: plan-checker loop (<=3 iterations, mode-sized dimensions)
- Phase 3: spike execution for assumptions that can invalidate the path
- Phase 4: bead polishing when beads exist (`bv --robot-suggest`, `--robot-insights`, `--robot-priority`)
- Phase 5: current-work exit-state readiness review

**Update state.json:** set `phase` to `go-mode/gate-3`

---

## GATE 3: Approve Current-Work Execution

```text
HARD-GATE: This is the most critical gate. Do not proceed until user explicitly approves.

Present:
  "Validation complete for [feature], current work.
   Mode: [mode].
   [N] beads ready for current work execution.
   Reality gate: [passed / failed / spike required]
   Risk: [X] assumptions -> spikes: [all passed / N failed]

   Any unresolved concerns: [list or 'none']

   Current work verified. Approve execution? (yes / review beads / no - revise plan)"
```

If user says `no` or `revise`, return to planning or validating. If user says `yes`, proceed to Step 5.

---

## Step 5: Swarming + Executing (Current Work)

**Invoke:** Load `khuym:swarming` skill.

**The khuym:swarming skill will:**

- initialize local reservation state
- spawn workers for the current work bead set
- monitor current-work execution
- verify current-work beads closed

### Work loop rule

After current-work execution completes:

- if the approved shape shows later work still pending -> return to Step 3 for the next work item or phase
- if the current work was final -> proceed to Step 6

**Update state.json:** set `phase` to either:

- `phase: go-mode/planning-next-phase`, or
- `phase: go-mode/reviewing`

---

## Step 6: Reviewing

**Invoke:** Load `khuym:reviewing` skill only after the final phase swarm completes.

**The khuym:reviewing skill will:**

- dispatch 5 specialist review agents
- run 3-level artifact verification
- run human UAT
- run final finishing tasks

**Update state.json:** set `phase` to `go-mode/gate-4`

---

## GATE 4: Approve Merge

```text
HARD-GATE: Never auto-merge.

Present:
  "Review complete for [feature].
   P1 (blocks merge): [count] - [titles if any]
   P2 (should fix):   [count]
   P3 (nice to have): [count]"

IF P1 > 0:
  "P1 findings block merge. Options:
   (a) Fix P1s now
   (b) Show P1 details
   (c) Override (requires explicit user confirmation)"

IF P1 = 0:
  "No blocking findings.
   Ready to [create PR / merge to main / keep branch].
   Approve? (yes / show P2s first / no)"
```

If fix beads are created, execute them and re-run reviewing before presenting GATE 4 again.

---

## Step 7: Compounding

**Invoke:** Load `khuym:compounding` skill.

**Input:** full feature history (`CONTEXT.md`, `approach.md`, `phase-plan.md`, review findings, execution notes).

**The khuym:compounding skill will:**

- dispatch 3 analysis subagents: patterns / decisions / failures
- write `history/learnings/YYYYMMDD-<feature>.md`
- promote critical items to `history/learnings/critical-patterns.md`
- optionally index via CASS

**Final update state.json:**

- `focus: ""`
- `phase: idle`
- `feature_slug: ""`
- `summary: "Go mode complete for <feature>"`
- `last_updated: <timestamp>`

Delete `.khuym/HANDOFF.json` if it exists.

---

## Fallback Paths

### If exploring produces a CONTEXT.md the user rejects at GATE 1

```text
-> Identify which decisions need revision
-> Load khuym:exploring skill, focus on those specific gray areas
-> Update CONTEXT.md in place
-> Re-present GATE 1
```

### If the user rejects the work shape at GATE 2

```text
-> Identify whether the mode, boundaries, proof, phase names, or stories feel wrong
-> Return to the planning pass
-> Update the shape artifact
-> Re-present GATE 2
```

### If validating fails after 3 plan-checker iterations

```text
-> Present failing dimensions to user
-> Ask: "Return to planning with these specific concerns?"
-> Load planning with the failure report as context
-> Re-run validating after the current work is re-prepared
```

### If a spike fails

```text
-> STOP: do not proceed to GATE 3
-> Present: "Spike [id] failed: [reason]. Current work is blocked."
-> Options: (a) Revise approach, (b) Descope the risky part, (c) Change mode or boundaries
-> If revise: return to planning and then re-run validating
```

### If orchestrator context hits 65% mid-swarm

```text
-> Write HANDOFF.json
-> Present: "Context budget reached. Current work swarm paused.
            [X] beads complete, [Y] in flight.
            Resume in a new session with HANDOFF.json."
-> End turn gracefully
```

### If P1 findings are present at GATE 4 and the user wants to fix

```text
-> Create fix beads via br create for each P1 finding
-> Load khuym:swarming skill (fix-bead swarm only)
-> After execution: re-run reviewing (targeted - fixes diff only)
-> Re-present GATE 4
-> Repeat until P1 = 0 or user explicitly overrides
```

---

## Config Options (.khuym/config.json)

Absent = enabled. Only set to disable.

```json
{
  "go_mode": {
    "skip_exploring": false,
    "skip_compounding": false,
    "auto_approve_gates": false,
    "spike_on_medium_risk": false
  },
  "validating": {
    "plan_checker_max_iterations": 3,
    "bead_polish_rounds": 3
  },
  "reviewing": {
    "parallel_agents": true,
    "serial_threshold": 6
  }
}
```

---

## Quick Mode Pipeline (Reference)

For small fixes (<=3 files, LOW risk, no gray areas):

```text
planning (lightweight)
  -> one work shape
  -> approval gate
  -> one current-work bead when needed
  -> no multi-model refinement
  ↓
validating (lightweight)
  -> reality gate
  -> abbreviated structural verification
  -> skip spikes (LOW risk)
  -> bv check only when beads exist
  ↓
swarming -> executing (single worker)
  ↓
reviewing (optional)
  -> skip if truly trivial
  ↓
compounding (only if lesson learned)
```

---

## Design Rationale

**Why 4 gates, not 3?**

Because the work shape itself is now a first-class human decision. `CONTEXT.md` locks intent, the shape artifact locks the execution shape, validating locks reality and readiness for the current work, and reviewing locks merge-readiness.

**Why is GATE 3 the most critical?**

Execution is the only step that creates source-code side effects. A broken current work shape discovered post-execution costs far more to fix than one caught in validating.

**Why does planning now happen in two passes?**

Because "show me the whole shape" and "prepare the current execution surface" are different jobs. Combining them made explanations too abstract and pushed bead creation earlier than users wanted.

**What tone should the model use at every gate?**

Concrete and scenario-first. At every gate, the model should explain:

1. what becomes true or what is wrong
2. what the system does today
3. why that matters
4. one realistic example
5. what approval or change is needed next

Gate summaries should not rely on reviewer shorthand or planner jargon alone.
