# Worker Details

Open this when the compact worker loop needs exact fields or commands.

## Parent Context

The orchestrator supplies: Codex nickname, agent id, epic id, feature name,
project root, assigned bead id, and optional startup hint. The nickname is the
reservation identity.

## Assigned Bead Check

Workers do not pick beads. For the one assigned bead, confirm:

- status is open and dependencies are satisfied
- required file scope is clear
- verification criteria are concrete
- referenced decision IDs from `CONTEXT.md` are understandable

Return `[NOOP]` if no safe assigned bead exists; return `[BLOCKED]` for ambiguity.

## Reservation Conflict

If reservation fails, return `[BLOCKED]` with bead id, requested paths, conflicting
holder, and the parent action needed. Do not edit through the conflict.

## Shell Guard

Prefix write-heavy Bash commands with:

```bash
KHUYM_AGENT_NAME="<codex-subagent-name>" git add src/foo.ts
```

Use this for `git add/mv/rm`, `mv`, `cp`, `rm`, `mkdir`, `touch`, in-place edits,
and redirection writes.

## Verification Failure

Fix root cause and rerun the exact failing command. After two serious attempts,
return `[BLOCKED]` with command, failure summary, attempts made, and the smallest
useful next decision.

## Atomic Commit

One commit per bead:

```bash
KHUYM_AGENT_NAME="<name>" git add <files>
git commit -m "feat(<bead-id>): <summary matching br close reason>"
```

## Result Fields

- `[DONE]`: bead closed, committed, verification passed, reservations released
- `[BLOCKED]`: cannot continue safely; include blocker and reservation state
- `[HANDOFF]`: `.khuym/HANDOFF.json` written; include resume point
- `[NOOP]`: assigned bead is unavailable or unsafe

Minimum fields: nickname, agent id, bead id, files touched/requested, reservation
outcome, verification result, and parent next action.

## Post-Compaction Recovery

Reread:

1. `AGENTS.md`
2. `history/<feature>/CONTEXT.md`
3. `br show <bead-id>`
4. `node .codex/khuym_reservations.mjs list --active-only --agent "<name>" --json`
