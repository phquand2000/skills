# Swarm Thread Templates

Standard result formats for same-session Codex swarming. Workers return these summaries to the parent thread when their subagent run ends.

---

## 1. Worker Completion

```text
[DONE] <bead-id>: <bead-title>

Codex nickname: <CODEX_NICKNAME>
Agent ID: <AGENT_ID>
Epic: <EPIC_ID>

Files modified:
- <path/to/file1>
- <path/to/file2>

Reservation:
- reserved: <paths>
- released: yes

Verification:
- <command/result>

Commit:
- <git-commit-hash>

Next action:
- Ready for another bead
```

---

## 2. Worker Blocker

```text
[BLOCKED] <bead-id> — <one-line summary>

Codex nickname: <CODEX_NICKNAME>
Agent ID: <AGENT_ID>
Epic: <EPIC_ID>

Requested files:
- <path or glob>

Reservation conflict or blocker:
- <holder or failing condition>

What happened:
<clear description>

What I need next:
<specific decision, release, or context>
```

---

## 3. Worker Handoff

```text
[HANDOFF] <bead-id or none>

Codex nickname: <CODEX_NICKNAME>
Agent ID: <AGENT_ID>
Epic: <EPIC_ID>

Reason:
- context high

Progress so far:
- <what is already done>

Reservations:
- still active: <paths or none>

Resume point:
- Read `.khuym/HANDOFF.json`
- Re-check `bv --robot-priority`
- Reclaim or release reservations as needed
```

---

## 4. Worker No-Op

```text
[NOOP] No safe bead available

Codex nickname: <CODEX_NICKNAME>
Agent ID: <AGENT_ID>
Epic: <EPIC_ID>

Reason:
- <dependency not met, no ready bead, or conflicting reservation surface>

Suggested next action:
- <rerun triage, clear blocker, or respawn later>
```

---

## 5. Quiet Worker Note

There is no routine mid-flight status-request template anymore.

If a worker is quiet, the orchestrator should keep the recovery flow parent-side:
- inspect reservations
- re-check the live bead graph
- wait for the worker result
- escalate to the user if the graph and reservation evidence stays unhealthy

Do not send `send_input(...)` to a healthy in-flight worker just to ask whether it is still working.

---

## 6. Handoff JSON Template

Write to `.khuym/HANDOFF.json` when either the orchestrator or a worker must pause cleanly:

```json
{
  "schema_version": "1.0",
  "format": "khuym-swarm-handoff",
  "session": {
    "id": "khuym-swarm-<YYYYMMDD-HHMMSS>",
    "paused_at": "<ISO-8601 timestamp>",
    "reason_for_pause": "context_critical",
    "codex_name": "<CODEX_NICKNAME>",
    "agent_id": "<AGENT_ID>"
  },
  "swarm": {
    "epic_id": "<EPIC_ID>",
    "feature_name": "<feature-name>",
    "project_key": "<project-root-path>"
  },
  "active_work": {
    "current_bead": "<bead-id or null>",
    "status": "<spawned|busy|blocked|handoff>"
  },
  "reservations": {
    "active": [
      {
        "id": "<reservation-id>",
        "paths": ["<glob>"]
      }
    ]
  },
  "resume_instructions": {
    "read_first": [".khuym/state.json", ".khuym/HANDOFF.json"],
    "bead_check": "bv --robot-triage --graph-root <EPIC_ID>",
    "reservation_check": "node .codex/khuym_reservations.mjs list --active-only --json"
  }
}
```
