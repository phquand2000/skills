---
name: using-khuym
description: >-
  Use when starting or resuming any Khuym project session, choosing the next
  Khuym skill, running go mode, checking onboarding/scout state, or enforcing
  workflow gates. Bootstrap meta-skill for routing across the Khuym agentic
  development ecosystem.
metadata:
  version: '2.2'
  ecosystem: khuym
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: unavailable
      reason: The bootstrap scripts run in Node.js.
    beads-cli:
      kind: command
      command: br
      missing_effect: degraded
      reason: Bead planning and execution flows rely on br.
    beads-viewer:
      kind: command
      command: bv
      missing_effect: degraded
      reason: Triage and readiness checks rely on bv robot commands.
    cass-cli:
      kind: command
      command: cass
      missing_effect: degraded
      reason: Session-history lookups are part of the default workflow.
    cass-memory:
      kind: command
      command: cm
      missing_effect: degraded
      reason: Memory context retrieval is part of the default workflow.
    bash-shell:
      kind: command
      command: bash
      missing_effect: degraded
      reason: Dependency-contract verification runs bash helper scripts.
    gkg-cli:
      kind: command
      command: gkg
      missing_effect: unavailable
      reason: Supported-repo planning may require gkg index and gkg server start during session readiness.
    gkg-mcp:
      kind: mcp_server
      server_names: [gkg]
      config_sources: [repo_codex_config, global_codex_config, plugin_mcp_manifest]
      missing_effect: unavailable
      reason: Supported-repo planning and exploration depend on gkg-backed architecture intelligence.
---

# using-khuym

Bootstrap meta-skill. Load this first in Khuym repos. It checks onboarding, reads runtime state, selects the next skill, and protects the human approval gates.

For full routing tables, go-mode detail, communication standards, and file maps, open `references/routing-and-contracts.md`.

## Plugin Onboarding

Before normal bootstrap, verify Node.js and repo onboarding.

1. Run `node --version`.
   - If missing or too old, stop and tell the user Khuym requires Node.js 18+.
2. From this skill directory, run:
   ```bash
   node scripts/onboard_khuym.mjs --repo-root <repo-root>
   ```
3. Inspect the JSON result.
   - `status = "up_to_date"`: continue.
   - `status = "warning"` in `details.dependency_warning`: continue in degraded mode, but report affected skills and this exact split:
     - `Missing commands: ...`
     - `Missing MCP server configuration: ...`
   - missing/stale onboarding: summarize changes, ask before applying, then run with `--apply` after approval.
   - `requires_confirmation = true`: explain that existing `compact_prompt` will be preserved unless the user explicitly approves replacement.
   - Only pass `--allow-compact-prompt-replace` after explicit approval.

Onboarding manages root `AGENTS.md`, repo-local `.codex/` guardrails, `.khuym/onboarding.json`, `.khuym/state.json`, and the local reservation helper. If onboarding is not complete, do not continue into the rest of the Khuym workflow.

## Session Scout

After onboarding succeeds, run the read-only scout whenever available:

```bash
node .codex/khuym_status.mjs --json
```

Use it to orient on onboarding health, gkg readiness, `.khuym/state.json`, `.khuym/HANDOFF.json`, and recommended next reads.

For active worker coordination, inspect reservations:

```bash
node .codex/khuym_reservations.mjs list --active-only --json
```

If `.khuym/HANDOFF.json` exists, surface it to the user and wait for confirmation before resuming.

## gkg Readiness

Treat `gkg` as a first-class discovery dependency for supported repos.

- Unsupported repo: document the fallback and use grep/file inspection.
- Supported repo + server not reachable: run `gkg index <repo-root>` and `gkg server start` before planning.
- Supported repo + project not indexed: reindex, then start the server.
- Supported repo + ready: downstream skills should use gkg MCP tools as the default architecture-discovery path.

Use the scout's `supported_languages` and `primary_supported_language` fields instead of guessing.

## Dependency Declaration Contract

Every packaged Khuym skill must declare one of three dependency states:

1. Command-backed: declare each required CLI under `metadata.dependencies.<dependency-id>` with `kind: command`, `command`, truthful `missing_effect`, and `reason`.
2. MCP-backed: declare each required MCP server under `metadata.dependencies.<dependency-id>` with `kind: mcp_server`, `server_names`, `config_sources`, truthful `missing_effect`, and `reason`.
3. Dependency-free: declare `metadata.dependencies: []`.

Use dependency IDs as mapping keys instead of YAML arrays of objects:

```yaml
metadata:
  dependencies:
    beads-cli:
      kind: command
      command: br
      missing_effect: unavailable
      reason: The skill reads and updates beads.
```

If the normal operator path uses both a CLI and MCP server for the same product, declare both separately. For example, `using-khuym` depends on `gkg` CLI readiness commands and the `gkg` MCP server for architecture discovery.

Do not leave a packaged skill with an undeclared dependency posture.

When changing packaged Khuym skills, keep docs and live dependency reporting aligned by running:

```bash
node plugins/khuym/skills/using-khuym/scripts/test_onboard_khuym.mjs
bash scripts/check-markdown-links.sh plugins/khuym/skills/using-khuym/SKILL.md
bash scripts/sync-skills.sh --dry-run
```

## Skill Chain

```text
khuym:using-khuym
  -> khuym:exploring
  -> khuym:planning
  -> khuym:validating
  -> khuym:swarming
  -> khuym:executing
  -> khuym:reviewing
  -> khuym:compounding
```

Supporting skills:

- `khuym:writing-khuym-skills`: improve or create Khuym skills.
- `khuym:debugging`: root-cause blocked beads and execution failures.
- `khuym:gkg`: codebase intelligence after gkg readiness is green.

## Routing Summary

- Vague/new feature: `khuym:exploring`
- Research task with clear scope: `khuym:planning`
- Small clear fix: `khuym:planning` in `small_change` mode
- Review request: `khuym:reviewing`
- Capture learnings: `khuym:compounding`
- Improve Khuym itself: `khuym:writing-khuym-skills`
- Agent stuck/error: `khuym:debugging`
- `/go` or full pipeline: go mode
- Resume: read `.khuym/HANDOFF.json`, present state, wait for user confirmation

When in doubt, invoke `khuym:exploring` first.

## Modes

- `small_change`: at most 3 files, no API/data model change, low risk, no gray areas. Still run planning and validating.
- `standard_feature`: normal default Khuym chain; use a phase plan or epic map, whichever explains the work honestly.
- `high_risk_feature`: cross-cutting or hard-to-reverse work; default to epic map, feasibility proof, explicit spikes, and slower approval.

## Go Mode Gates

Go mode chains all skills but still has exactly four human gates:

1. After exploring: approve `CONTEXT.md` before planning.
2. After whole-feature planning: approve the work shape, phase plan, or epic map before current-story/work prep.
3. After validating: approve feasibility-validated current work before swarming.
4. After reviewing: P1 findings block merge; if no P1s, approve merge.

Never skip these gates. Load `references/go-mode-pipeline.md` for the full sequence.

## Priority Rules

1. P1 review findings always block.
2. Context budget always applies; around 65%, write `.khuym/HANDOFF.json` and pause.
3. `CONTEXT.md` is the source of truth.
4. Gate 3 is the critical execution approval gate.
5. Spike failures halt the pipeline and return to planning.
6. Never skip validating.
7. `history/learnings/critical-patterns.md` is mandatory context before planning or executing.

## Runtime Files

- `.khuym/onboarding.json`: onboarding status and managed versions
- `.khuym/state.json`: runtime state for agents, tools, and humans
- `.khuym/HANDOFF.json`: pause/resume data
- `.khuym/reservations.json`: local file reservations
- `.codex/khuym_status.mjs`: read-only scout
- `.codex/khuym_reservations.mjs`: reservation helper
- `history/<feature>/CONTEXT.md`: locked decisions and source of truth
- `.beads/`: Beads task graph

## Handoff Contract

Each skill reads upstream artifacts and writes for downstream:

- exploring writes `CONTEXT.md`
- planning writes discovery, approach, work shape, epic map or phase plan, and current-story/work artifacts
- validating verifies repo reality, feasibility evidence, spike results, and current story/work readiness
- swarming launches and supervises workers
- executing closes one verified bead
- reviewing returns P1/P2/P3 findings
- compounding captures learnings

Every skill ends with an explicit handoff: `[Outcome]. Invoke [next-skill] skill.`

## Red Flags

- jumping from exploring to swarming
- writing code before `CONTEXT.md` exists
- skipping validating
- ignoring locked decisions
- reservation leaks
- closing beads without acceptance verification
- commits without bead ids
- continuing while P1 findings are open
- stale `state.json` after phase transitions
- resuming without reading and surfacing `HANDOFF.json`
