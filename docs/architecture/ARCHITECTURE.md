# Khuym Architecture

Canonical architecture and vocabulary contract for the Khuym plugin shipped from this repo.

If a skill doc and this file disagree, update the skill doc to match this file.

## Canonical Layout

- The live canonical skill tree is [`plugins/khuym/skills/`](../../plugins/khuym/skills).
- Codex consumes the packaged plugin from [`plugins/khuym/.codex-plugin/plugin.json`](../../plugins/khuym/.codex-plugin/plugin.json).
- The repo marketplace is [`.agents/plugins/marketplace.json`](../../.agents/plugins/marketplace.json).
- Optional raw skill mirrors are generated directly from the canonical skill tree via [`scripts/sync-skills.sh`](../../scripts/sync-skills.sh).

Author and maintain skills in `plugins/khuym/skills/*`; packaging and raw mirrors should resolve back to that tree.

## Core Principles

Khuym keeps these invariants:

- `CONTEXT.md` is the source of truth for locked decisions.
- `validating` is a real execution gate, not an optional review step.
- beads + `bv` + Codex subagents + local reservations are the coordination substrate.
- `swarming` is the orchestrator role and `executing` is the worker role.
- `reviewing` and `compounding` are first-class phases, not cleanup afterthoughts.

## Working Modes

Khuym presents three user-facing modes over the same core workflow:

- `small_change` — bounded, low-risk work with lightweight planning and validating
- `standard_feature` — the default full Khuym workflow; may use phases or epics
- `high_risk_feature` — defaults to epic maps, feasibility proof, and stronger spike discipline

Modes change the amount of ceremony, not the core contract. `validating` still gates execution in every mode.

## Main Chain

```text
using-khuym
  -> exploring
  -> planning
  -> validating
  -> swarming
  -> executing
  -> reviewing
  -> compounding
```

Behavioral summary:

- `using-khuym` bootstraps, routes, explains modes, and handles resume/startup logic
- `exploring` extracts decisions and writes `history/<feature>/CONTEXT.md`
- `planning` turns those decisions into discovery, approach, a mode gate, work-shape artifacts, and approved current story/work prep
- `validating` proves the chosen shape fits repo reality, feasibility evidence exists, and the current story/work is ready before execution starts
- `swarming` launches and tends workers through Codex subagents, the parent thread, and the live bead graph
- `executing` is the per-worker loop: claim, reserve locally, implement, verify, close, report
- `reviewing` performs specialist review, artifact verification, and the merge gate
- `compounding` records durable learnings in `history/learnings/`

## Runtime Artifacts

Khuym keeps runtime state local and file-based:

```text
.khuym/
  onboarding.json   -> onboarding state for the plugin
  state.json        -> single runtime state file for routing, focus, blockers, and summaries
  HANDOFF.json      -> pause/resume artifact
  reservations.json -> local file reservations for same-session Codex swarms

.codex/
  khuym_status.mjs -> read-only scout command
  khuym_state.mjs -> shared scout/state helpers
  khuym_reservations.mjs -> local reservation helper used by swarming, executing, and hooks
```

Rules:

- `state.json` is the single runtime state file for tools, agents, and operator-facing summaries
- neither `state.json` nor `HANDOFF.json` replaces `CONTEXT.md`, beads, feasibility evidence, or planning artifacts
- workflow transitions should update `state.json` directly instead of maintaining a second narrative file

## Session Scout

On onboarded repos, Khuym installs a read-only scout command:

```bash
node .codex/khuym_status.mjs --json
```

This is the preferred quick orientation step for both humans and agents. It summarizes:

- onboarding status
- `.khuym/state.json`
- `.khuym/HANDOFF.json`
- recommended next reads/actions

The scout command is a shortcut for orientation. It does not replace deeper reads of `CONTEXT.md`, planning artifacts, feasibility evidence, beads, or review outputs.

## Startup Contract

On normal Khuym sessions:

1. Read `AGENTS.md`
2. If present, run `node .codex/khuym_status.mjs --json`
3. Read `.khuym/HANDOFF.json` if resuming
4. Read `.khuym/state.json`
5. Re-open the active feature `CONTEXT.md`
6. Read `history/learnings/critical-patterns.md` before planning or execution when it exists

## Verification Expectations

Public-doc changes in this repo should pass:

```bash
bash scripts/check-markdown-links.sh
bash scripts/sync-skills.sh --dry-run
bash scripts/sync-skills.sh --target all --dry-run
```
