---
name: swarming
description: Orchestrates parallel worker agents for phase execution. Use after the khuym:validating skill approves the current phase for execution. Initializes the overseer/orchestrator context, spawns bounded Codex subagents, monitors worker results plus local file reservations, coordinates rescues and course corrections through the parent thread, and hands off either to planning for the next phase or to reviewing after the final phase. The orchestrator TENDS — it never implements beads directly.
metadata:
  version: '1.0'
  role: orchestrator
  ecosystem: khuym
  position: 5-of-9
  upstream: validating
  downstream: reviewing
  dependencies:
    - id: beads-cli
      kind: command
      command: br
      missing_effect: degraded
      reason: Swarm tending checks bead state and closure through br.
    - id: beads-viewer
      kind: command
      command: bv
      missing_effect: unavailable
      reason: Live graph triage is required to route and supervise workers.
---

# Swarming

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

## Role Boundary — Read First

You are the **ORCHESTRATOR**. You launch workers, monitor coordination, handle escalations, and keep the swarm moving. You do NOT implement beads. If you find yourself editing source files, stop immediately — that is the `khuym:executing` skill's job.

- `swarming` = launches and tends workers
- `executing` = the bounded worker loop each spawned subagent follows

## Coordination Substrate

For normal same-session Codex swarming, Khuym now uses:

- beads + `bv` for work selection and graph state
- Codex subagents for parallel execution
- repo-local reservations in `.khuym/reservations.json`
- the parent Codex thread for worker completion, blocker, and handoff summaries

This is intentionally local-first. There is no external inbox, mail server, or thread bootstrap step for same-session swarms.

## Hard Rule — Active Swarm Keeps Tending

If workers are spawned, busy, blocked, or expected to finish soon, you are not in a waiting phase. You are in a tending phase.

While the swarm is active, keep looping through:

- the live bead graph
- worker statuses in `.khuym/state.json`
- local reservation state via `node .codex/khuym_reservations.mjs`
- spawned-agent results via `wait_agent(...)` and `close_agent(...)` when needed

Silence is work for the orchestrator, but silence alone is not failure. Keep tending the graph and reservations while workers run, and only interrupt a worker when the evidence shows a real stuck condition or the user explicitly wants it stopped.

## Why The Contract Changed

Official Codex subagent workflows already provide parent-controlled spawning, follow-up input, waiting, and thread inspection. They are a good fit for same-session parallel work.

The key tradeoff is also explicit in the Codex docs: subagents are great for read-heavy or bounded parallel work, but parallel write-heavy work needs extra coordination. Khuym's local reservation layer exists to supply that coordination without depending on Agent Mail for the normal same-session path.

## When to Use This Skill

Invoke after the `khuym:validating` skill issues: _"Validation complete. Current phase passes. Invoke khuym:swarming skill."_

Prerequisites:

- current-phase beads are in `open` status and approved for execution
- `EPIC_ID` is known from `.khuym/state.json` or the validated phase contract
- if `.codex/khuym_status.mjs` exists, run `node .codex/khuym_status.mjs --json` first
- if `history/learnings/critical-patterns.md` exists, read it before you spawn workers

---

## Phase 1: Confirm Swarm Readiness

1. Get `EPIC_ID`: prefer `.khuym/state.json`, then the validated phase artifacts.
2. Check live bead status:
   ```bash
   bv --robot-triage --graph-root <EPIC_ID>
   ```
3. Verify there is executable work:
   - open beads exist
   - dependencies are acyclic
   - no unresolved validation blockers remain
4. Sweep expired reservations before spawning:
   ```bash
   node .codex/khuym_reservations.mjs sweep --json
   ```
5. Update `.khuym/state.json` with current swarm intent and epic ID.

Do not create runtime tracks, waves, or a separate runtime plan. The bead graph remains the execution source of truth.

---

## Phase 2: Spawn Workers

Spawn a bounded worker pool with `spawn_agent(...)`. Use the worker prompt template in `references/worker-template.md`.

Codex runtime contract:

1. Call `spawn_agent(...)`.
2. Capture both:
   - `agent_id`
   - `agent_nickname`
3. Immediately send follow-up startup context with `send_input(...)`.
4. Record the worker in `.khuym/state.json`.

Required startup context:

- `codex_subagent_name`
- `agent_id`
- `project_key`
- `epic_id`
- `feature_name`
- optional `startup_hint`
- instruction to load `khuym:executing` immediately

Do not invent worker names locally. The parent runtime result is the source of truth for the Codex nickname.

### Worker Scope

Workers are expected to be bead-scoped and short-lived:

1. read the project context
2. pick one executable bead from `bv --robot-priority`
3. reserve the bead's edit surface locally
4. implement and verify
5. close the bead, release reservations, and return a structured result to the parent thread

This is the smallest reliable same-session contract with the current Codex subagent surface. It preserves parallel execution while keeping write coordination explicit and parent-controlled.

### State Recording

Mark spawned workers in `.khuym/state.json` under `active_workers` immediately after each spawn result.

---

## Phase 3: Tend The Swarm

Run a tend loop for as long as any of these are true:

- a worker is `spawned`, `busy`, or `blocked`
- `bv --robot-triage --graph-root <EPIC_ID>` still shows ready or in-progress work
- local reservations remain active for the current phase

Every loop cycle should do all of the following:

1. Re-run the live graph check when a bead closes, a blocker clears, or a worker finishes.
   ```bash
   bv --robot-triage --graph-root <EPIC_ID>
   ```
2. Sweep and inspect reservations.
   ```bash
   node .codex/khuym_reservations.mjs sweep --json
   node .codex/khuym_reservations.mjs list --active-only --json
   ```
3. Wait for any worker result only when you truly need the next finished result.
   ```text
   wait_agent(targets=[...worker ids...], timeout_ms=60000)
   ```
4. Update `.khuym/state.json` after every meaningful worker event.

Use `wait_agent(...)` sparingly. Prefer longer waits over busy polling, batch worker ids when possible, and do not stop the whole swarm just because one worker is still running.

### Worker Result Handling

Workers report back by finishing their subagent run with one of these statuses in the final message:

- `[DONE]`
- `[BLOCKED]`
- `[HANDOFF]`
- `[NOOP]`

The expected formats live in `references/message-templates.md`.

When a worker returns:

1. update the matching worker entry in `.khuym/state.json`
2. verify the reported bead state with `br show <bead-id>` or `br ready --json`
3. verify reservations were released, or release them yourself if safe
4. decide whether to respawn that worker for another bead, redirect a different worker, or escalate

### Silence Ladder

Because the parent thread is the coordination surface, silence usually means a worker has not finished yet. Do not treat a quiet worker as failed just because `wait_agent(...)` timed out.

- After one long wait timeout with no result: inspect reservation state and current graph status
- If reservations, bead ownership, and graph state still look healthy: keep waiting
- If the graph or reservation evidence looks unhealthy: keep the recovery flow parent-side first
  - confirm whether another worker is blocked behind the held reservation
  - verify whether the bead graph and reservation state still match the last known worker state
  - decide whether the worker should simply keep running, whether the blocked work should be deferred, or whether the swarm now needs a human decision
- Do not send routine `send_input(...)` messages to an in-flight worker just because it is quiet. Mid-flight status checks are disruptive and are not part of the normal silence ladder anymore
- Do not use `send_input(..., interrupt=true)` as a routine silence step. Reserve interrupts for explicit user aborts or confirmed deadlocks where the user wants the worker preempted
- If the swarm remains blocked and the reservation/graph evidence still looks unhealthy after the parent-side checks: escalate to the user with the worker name, current graph state, reservation evidence, and recovery attempts already made

### File Conflict Resolution

If two workers need overlapping files:

1. inspect the active reservations:
   ```bash
   node .codex/khuym_reservations.mjs list --active-only --json
   ```
2. decide one of:
   - current holder keeps the reservation until a safe checkpoint
   - holder releases and the waiting worker is re-spawned
   - the change is deferred into a follow-up bead
3. record the resolution in `.khuym/state.json`

Do not ask workers to edit through an active conflict just to keep them busy.

---

## Phase 4: Handoffs And Context Limits

After each significant event, estimate your own context budget.

If context usage passes roughly 65%:

1. write `.khuym/HANDOFF.json`
2. save the active worker list with `codex_name`, `agent_id`, `status`, and `bead_id`
3. save a reservation snapshot from `node .codex/khuym_reservations.mjs list --active-only --json`
4. report to the user that the orchestrator paused safely and how to resume

Do not abandon the swarm without writing `HANDOFF.json`.

---

## Phase 5: Complete The Phase

When no current-phase beads remain `in_progress` and the live graph shows no remaining executable work:

1. run a final graph check:
   ```bash
   bv --robot-triage --graph-root <EPIC_ID>
   ```
2. inspect active reservations and confirm the phase is clean:
   ```bash
   node .codex/khuym_reservations.mjs list --active-only --json
   ```
3. if orphaned or blocked beads remain:
   - report which beads remain and why
   - ask the user whether to defer, create cleanup beads, or continue later
4. if all current-phase beads are closed:
   - run the project-appropriate build/test commands
   - clear `active_workers` in `.khuym/state.json`
   - tell the user either:
     - the current phase is complete and planning should resume, or
     - the final phase is complete and `khuym:reviewing` should begin

---

## Red Flags

- spawning workers before validation approved execution
- letting workers edit code without local reservations
- using workers as long-lived silent daemons instead of bounded bead runs
- waiting passively while reservations or ready beads still exist
- resolving collisions by asking workers to "just be careful" instead of changing reservations or bead scope
- forgetting to update `.khuym/state.json` after a worker-state change
- handoff without a reservation snapshot

---

## Reference Files

| File | Use |
|---|---|
| `references/worker-template.md` | worker bootstrap prompt |
| `references/message-templates.md` | expected worker final-report formats |
| `.khuym/state.json` | worker, phase, and operator-facing runtime state |
| `.khuym/HANDOFF.json` | pause/resume artifact |

## Completion Signal

Swarming is complete when either:

- the current phase is cleanly executed and the workflow is ready to return to planning for the next phase, or
- the final phase is executed and the user can be told:

> "Swarm execution complete for the final phase. Invoke `khuym:reviewing`."
