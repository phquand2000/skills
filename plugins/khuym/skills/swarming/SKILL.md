---
name: swarming
description: Orchestrates parallel worker agents for phase execution. Use after the khuym:validating skill approves the current phase for execution. Initializes the overseer/orchestrator context, spawns bounded worker subagents, monitors Agent Mail for completions/blockers/file conflicts, coordinates rescues and course corrections, and hands off either to planning for the next phase or to reviewing after the final phase. The orchestrator TENDS — it never implements beads directly.
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
    - id: agent-mail
      kind: mcp_server
      server_names: [mcp_agent_mail]
      config_sources: [repo_mcp_config, global_mcp_config]
      missing_effect: unavailable
      reason: Worker orchestration and coordination run through Agent Mail.
---

# Swarming

If `.khuym/onboarding.json` is missing or stale for the current repo, stop and invoke `khuym:using-khuym` before continuing.

## Role Boundary — Read First

You are the **ORCHESTRATOR**. You launch workers, monitor coordination, handle escalations, and keep the swarm moving. You do NOT implement beads. If you find yourself editing source files, stop immediately — that is the khuym:executing skill's job.

- **swarming** = launches and tends workers (this skill)
- **executing** = each worker's self-routing implementation loop

## Hard Rule — Active Swarm Never Idles

If workers are spawned, online, busy, blocked, or expected to report, you are not in a waiting phase. You are in a tending phase.

While the swarm is active, you must keep looping through Agent Mail and the live bead graph. Do not stop and wait for user direction just because the thread is quiet. Silence is work for the orchestrator:
- poll inboxes
- inspect the epic timeline
- send reminders
- resolve conflicts
- escalate only when the next move truly requires human judgment

User escalation is for real product decisions, unresolved blockers, or persistent worker silence after you have already tried to recover the swarm through Agent Mail.

## Communication Standard

Blocker reports, conflict reports, and handoffs should be written so a busy teammate can understand them in one read.

Prefer:

- what is blocked
- what is happening right now
- one concrete example of the collision or failure
- what needs to happen next

Do not hide the real issue behind labels like `reservation conflict`, `startup drift`, or `runtime blocker` without explaining the practical effect.

In Flywheel terms, this skill is the Khuym adaptation of the `ntm spawn` + human-overseer phase. The orchestrator (Claude Code) launches Codex CLI workers via the `codex` MCP tool, then tends the swarm. Workers decide what to do next by using `bv --robot-priority` against the live bead graph.

## When to Use This Skill

Invoke after the `khuym:validating` skill issues: _"Validation complete. Current phase passes. Invoke khuym:swarming skill."_

Prerequisites:
- Current-phase beads are in `open` status and approved for execution
- EPIC_ID is known (from STATE.md or user input)
- Agent Mail server is reachable
- If `.codex/khuym_status.mjs` exists, run `node .codex/khuym_status.mjs --json` first to confirm onboarding, current phase, and any saved handoff before launching the swarm

---

## Phase 1: Confirm Swarm Readiness

1. Get `EPIC_ID`: prefer `.khuym/state.json`, then `.khuym/STATE.md`, then ask the user.
2. Check live bead status:
   ```bash
   bv --robot-triage --graph-root <EPIC_ID>
   ```
3. Verify there is executable work:
   - open beads exist
   - dependencies are acyclic
   - no unresolved validation blockers remain
4. Update `.khuym/state.json` and `.khuym/STATE.md` with current swarm intent and epic ID.

**Do not** compute runtime tracks, runtime waves, or any separate runtime planning artifact. In the corrected model, the bead graph itself is the execution source of truth.

---

## Phase 2: Initialize Agent Mail

```
ensure_project(human_key="<project-root-path>")
register_agent(
  project_key="<project-root-path>",
  name="<COORDINATOR_AGENT_NAME>",  # auto-generated via macro_start_session()
  program="claude-code",
  model="claude-opus-4-6",
  task_description="swarm-coordinator"
)
```

Define an epic topic tag:

```
EPIC_TOPIC="epic-<EPIC_ID>"
```

Bootstrap the epic coordination thread by sending the first message (this is the thread-creation moment in Agent Mail):

```
send_message(
  project_key="<project-root-path>",
  sender_name="<COORDINATOR_AGENT_NAME>",
  to=["<COORDINATOR_AGENT_NAME>"],
  subject="[SWARM START] <feature-name>",
  body_md="Swarm initialized for epic <EPIC_ID> ...",
  thread_id="<EPIC_ID>",
  topic="<EPIC_TOPIC>"
)
```

Template: see `references/message-templates.md` → **Spawn Notification**.

The epic thread is the coordination surface for:
- worker startup acknowledgments
- completion reports
- blocker alerts
- file conflict requests
- context handoffs
- overseer broadcasts

---

## Phase 3: Spawn Workers (Turn-Based)

The orchestrator spawns Codex workers via the **codex-companion plugin runtime**. Each call is **synchronous** — it blocks until the worker completes its turn. The swarm operates in a **turn-based cycle**: spawn batch → wait → process results → spawn next batch.

### 3a. Identify Ready Beads

```bash
bv --robot-triage --graph-root <EPIC_ID>
```

From the graph, identify beads that are:
- `open` status with all dependencies closed
- Not file-conflicting with each other (no overlapping file scope)

Group these into a **batch** of independent beads that can run in parallel.

### 3b. Pre-Register Workers (Sequential)

**Before spawning any worker**, the orchestrator registers all worker identities sequentially. This follows the `ntm spawn` pattern and avoids SQLite init lock contention.

```bash
# Register each worker sequentially via JSON-RPC (server-routed):
WORKER1=$(.codex/am-rpc.sh register "<PROJECT_KEY>" codex-cli gpt-5.4 "worker bead-A" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
WORKER2=$(.codex/am-rpc.sh register "<PROJECT_KEY>" codex-cli gpt-5.4 "worker bead-B" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
```

### 3c. Spawn Workers With Pre-Assigned Identity

Spawn Codex workers via the codex-companion plugin runtime. Each worker receives its identity in the prompt — no self-registration needed.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" task --write --full-access \
  "AGENT_MAIL_NAME=$WORKER1. Implement bead <BEAD_ID>. <worker procedure>"
```

The `--full-access` flag enables `danger-full-access` sandbox, required on macOS for network access (Agent Mail). This is a local patch — see `patches/codex-companion-full-access.sh`.

**Parallelism:** Multiple workers run in parallel via background Bash calls:

```bash
node codex-companion.mjs task --write --full-access "AGENT_MAIL_NAME=$WORKER1. ..." &
node codex-companion.mjs task --write --full-access "AGENT_MAIL_NAME=$WORKER2. ..." &
wait
```

Each worker prompt must include (see `references/worker-template.md` for full template):
- `AGENT_MAIL_NAME` — the pre-registered identity
- The specific bead ID and description to implement
- Project key, epic ID, feature name, coordinator name, epic topic
- The **full worker procedure** inline (read context → post ONLINE → reserve files → implement → verify → close → report)
- **Do not** say "load the khuym:executing skill" — embed the procedure directly

**Do NOT use `mcp__codex__codex` raw MCP tool** — it hangs.

### 3d. Process Worker Responses

Each worker call returns stdout containing the worker's execution report. Parse each response for:

1. **Agent Mail name** — confirms the pre-registered identity was used
2. **Bead status** — did the worker close the bead successfully?
3. **Verification results** — tests pass? build clean?
4. **Commit hash** — the atomic git commit for this bead
5. **Blockers** — did the worker hit a problem it couldn't resolve?

For follow-up turns (fix verification, provide context), spawn a new worker call for the same bead with additional instructions. Course corrections can also be routed through Agent Mail.

### 3e. Update State

After processing all responses in the batch:

1. Update `.khuym/STATE.md` under `## Active Workers`:

   For completed workers:
   `- Worker: <agent-mail-name> | Status: done | Bead: <bead-id>`

   For blocked workers:
   `- Worker: <agent-mail-name> | Status: blocked | Bead: <bead-id>`

2. Check Agent Mail inbox for any messages posted during the batch:
   ```
   fetch_inbox(
     project_key="<project-root-path>",
     agent_name="<COORDINATOR_AGENT_NAME>",
     topic="<EPIC_TOPIC>"
   )
   ```

3. Re-check the graph for newly unblocked work:
   ```bash
   bv --robot-triage --graph-root <EPIC_ID>
   ```

---

## Phase 4: Tend Between Turns

Tending happens **between spawn batches**, not during worker execution (the orchestrator is blocked while workers run). This is the coordination phase.

### Turn Cycle

Repeat until no executable work remains:

```
1. PROCESS: Parse all worker responses from the last batch
2. VERIFY:  Confirm bead closures (br status <bead-id>)
3. INBOX:   Fetch Agent Mail (fetch_inbox + fetch_topic)
4. GRAPH:   Re-check live bead graph (bv --robot-triage)
5. HANDLE:  Resolve blockers, file conflicts, course corrections
6. PLAN:    Identify next batch of independent ready beads
7. SPAWN:   Start next batch (back to Phase 3b)
```

### Handling Blockers

When a worker's response reports a blocker:
1. Assess severity:
   - **Resolvable with existing context:** spawn a new worker call for the same bead with the missing context included
   - **Needs another worker's output:** wait for that worker, then spawn a follow-up
   - **Needs human judgment:** escalate to user immediately
2. Record blocker in `.khuym/STATE.md`
3. Do not re-spawn the worker until the blocker is resolved

### Handling Failed Verification

When a worker reports verification failure:
1. Read the failure output from the worker's response
2. Spawn a follow-up worker call for the same bead with the error context: "Verification failed: <error>. Fix and re-verify."
3. **Maximum 2 fix turns.** After 2 failed follow-up attempts, escalate to user.

### Handling File Conflicts

When a batch has potential file overlaps:
1. Do not include conflicting beads in the same batch
2. If conflict is discovered mid-execution (worker reports), use `codex-reply` to instruct the blocked worker to defer
3. Sequence conflicting beads across separate batches

### Course Corrections

Use **follow-up worker calls** or **Agent Mail messages** for:
- Providing missing context a worker needs
- Fixing verification failures
- Redirecting a worker that drifted from the bead spec
- Relaying a locked decision update from CONTEXT.md

### Agent Mail Coordination

Between batches, always:
1. `fetch_inbox(project_key, agent_name=<COORDINATOR>, topic=<EPIC_TOPIC>)` — read worker messages
2. `fetch_topic(project_key, topic_name=<EPIC_TOPIC>)` — check full thread state
3. Acknowledge important messages: `acknowledge_message(project_key, agent_name, message_id)`
4. Post status updates to the epic thread when significant state changes occur

### Context Checkpoint

After each batch completes, estimate your context budget.

**If context >65% used:**
1. Write `.khuym/HANDOFF.json` with complete swarm state (see `references/message-templates.md` → **Handoff JSON template**)
2. Post a pause notification on the epic thread via `send_message`
3. Report to user that the orchestrator paused safely and how to resume
4. Do NOT abandon the swarm without writing `HANDOFF.json`

---

## Phase 5: Swarm Complete

When no current-phase beads remain `in_progress` and the graph shows no remaining executable work for the current phase:

1. Run final bead verification:
   ```bash
   bv --robot-triage --graph-root <EPIC_ID>
   ```
2. If orphaned or blocked beads remain:
   - report which beads remain and why
   - ask the user whether to defer, create cleanup beads, or continue later
3. If all current-phase beads are closed:
   - run final build/test commands appropriate to the project
   - clear `## Active Workers` from `.khuym/STATE.md`
   - inspect `history/<feature>/phase-plan.md` and `.khuym/STATE.md`
   - if more phases remain:
     ```
     Active skill: swarming -> COMPLETE
     Swarm: <EPIC_ID> - current phase complete
     Next: planning for Phase <n+1>
     ```
   - if this was the final phase:
     ```
     Active skill: swarming -> COMPLETE
     Swarm: <EPIC_ID> - final phase complete
     Next: reviewing
     ```

4. Handoff message:
   - if more phases remain:
     > "Swarm execution complete for the current phase. Return to khuym:planning to prepare the next phase."
   - if this was the final phase:
     > "Swarm execution complete for the final phase. Invoke khuym:reviewing skill."

---

## Red Flags

Stop and diagnose before continuing if you see:

- **Worker implements multiple beads at once** — self-routing does not mean parallelizing within one worker
- **Orchestrator edits source files** — role violation
- **Workers are idle but ready beads exist** — fetch inbox, inspect the thread, and recover the swarm instead of waiting for the user
- **No Agent Mail activity after multiple turn batches while work remains** — workers may be stuck or context-exhausted; check worker responses for blockers, use `codex-reply` for recovery
- **The same file conflict repeats** — bead decomposition may be too coarse; escalate
- **Workers stop using `bv --robot-priority` and start freelancing** — re-broadcast the execution contract
- **Build/test failures accumulate without intervention** — create fix beads or stop and escalate

---

## Reference Files

Load when needed:

| File | Load When |
|---|---|
| `references/worker-template.md` | Spawning any worker (Phase 3) |
| `references/message-templates.md` | Posting or parsing Agent Mail messages |
| `references/pressure-scenarios.md` | Re-running RED/GREEN pressure tests for swarm coordination behavior |
