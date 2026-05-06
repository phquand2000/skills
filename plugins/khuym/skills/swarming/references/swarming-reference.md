# Swarming Reference

Use after validation approves execution.

## Protocol

1. Get `EPIC_ID` from `.khuym/state.json` or validated artifacts.
2. Check graph:
   ```bash
   bv --robot-triage --graph-root <EPIC_ID>
   ```
3. Sweep reservations:
   ```bash
   node .codex/khuym_reservations.mjs sweep --json
   ```
4. Parent selects each ready bead. Do not let workers choose.
5. Spawn bounded workers with slim explicit context. Do not fork the whole parent context for routine beads.
6. Record worker id, nickname, assigned bead, and status in `.khuym/state.json`.
7. Tend graph, reservations, and worker results until phase completion.

## Worker Spawn

```text
spawn_agent(agent_type="worker", message="<WORKER_PROMPT>", fork_context=false)
```

Worker prompt:

```text
You are a Khuym worker subagent.

Identity:
- Codex nickname: <CODEX_SUBAGENT_NAME>
- Agent ID: <AGENT_ID>
- Epic ID: <EPIC_ID>
- Assigned bead ID: <ASSIGNED_BEAD_ID>
- Feature: <FEATURE_NAME>
- Project root: <PROJECT_KEY>

Contract:
- Load `khuym:executing` immediately.
- Execute only the assigned bead.
- Use your Codex nickname for reservations.
- Return exactly one final status: [DONE], [BLOCKED], [HANDOFF], or [NOOP].

Startup:
1. Read `AGENTS.md`.
2. Run `node .codex/khuym_status.mjs --json` if present.
3. Read `.khuym/state.json`, `history/<feature>/CONTEXT.md`, and `br show <ASSIGNED_BEAD_ID>`.
4. Reserve files, implement, verify, close, release, and report.

Shell guard: `KHUYM_AGENT_NAME="<CODEX_SUBAGENT_NAME>" <write-heavy command>`
Startup hint: <STARTUP_HINT>
```

## Tend Loop

While workers are active, graph has ready/in-progress work, or reservations remain:

```bash
bv --robot-triage --graph-root <EPIC_ID>
node .codex/khuym_reservations.mjs sweep --json
node .codex/khuym_reservations.mjs list --active-only --json
```

Use `wait_agent(..., timeout_ms=60000)` only when a result is needed. Silence
alone is not failure: inspect graph and reservations first. Do not send routine
mid-flight `send_input(...)`; interrupt only for explicit aborts or confirmed deadlocks.

## Result Formats

```text
[DONE] <bead-id>: <title>
Codex nickname: <name>
Files modified: <paths>
Reservation: reserved <paths>; released <yes/no>
Verification: <command/result>
Commit: <hash>
Next action: <next>
```

```text
[BLOCKED] <bead-id> - <summary>
Requested files: <paths>
Blocker: <conflict/failing condition>
What happened: <description>
What I need next: <specific parent action>
```

```text
[HANDOFF] <bead-id or none>
Reason: <context high / safe pause>
Progress: <done>
Reservations: <active paths or none>
Resume: read .khuym/HANDOFF.json, br show <id>, reservation list
```

```text
[NOOP] No safe bead available
Reason: <why assignment is unavailable or unsafe>
Suggested next action: <triage, clear blocker, respawn later>
```

## Handoff JSON

Near 65% context, write `.khuym/HANDOFF.json` with session, epic, feature, active
work, active reservations, and resume commands:

```text
bv --robot-triage --graph-root <EPIC_ID>
node .codex/khuym_reservations.mjs list --active-only --json
```

## Completion

Before phase completion: final graph triage, no active phase reservations,
orphan/blocked beads handled, quality gates run, and `active_workers` cleared.
Then return to planning for the next phase or reviewing for the final phase.

## Red Flags

- spawning before validation
- full-context worker forks for routine beads
- worker edits without reservations
- passive waiting while graph/reservations are unhealthy
- conflict resolution by optimism
- missing state updates
