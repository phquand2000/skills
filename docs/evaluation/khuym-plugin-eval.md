# Khuym Plugin Evaluation

This runbook evaluates the installable Khuym Codex plugin at `plugins/khuym`.
It combines static plugin health, Khuym dependency/operator-path health, and a
focused real-Codex benchmark pilot.

Use this workflow when you need evidence that Khuym is usable, not only that the
plugin metadata parses.

## Evaluation Gates

### 1. Static plugin health

Run the Plugin Eval report through the repo wrapper:

```bash
node scripts/khuym-plugin-eval.mjs analyze plugins/khuym --format json --output /tmp/khuym-plugin-eval-before.json
node scripts/khuym-plugin-eval.mjs analyze plugins/khuym --format markdown
```

Interpret this as structural evidence. A low score can be caused by
frontmatter, manifest shape, static token budget, support-file layout, or code
complexity. Do not treat a passing static score as proof that the Khuym workflow
routes correctly.

Current known baseline:

- target: `plugins/khuym`
- static concern: frontmatter parse failures and excessive estimated token
  budget can dominate the score
- observed usage: absent until a benchmark run writes usage logs

### 2. Khuym health

Run the repo scout:

```bash
node .codex/khuym_status.mjs --json
```

Required checks:

- `onboarding.status` is `complete`
- `dependency_health.summary.skills_total` equals
  `dependency_health.summary.skills_available`
- `dependency_health.summary.missing_dependencies` is `0`
- `gkg_readiness` is reported explicitly

Do not hide degraded readiness. If `gkg_readiness.server_reachable` or
`gkg_readiness.project_indexed` is false, the evaluation should say that
gkg-backed scenarios are dependency-sensitive instead of pretending gkg is
ready.

### 3. Behavioral pilot

Run the focused benchmark suite:

```bash
node scripts/khuym-plugin-eval.mjs benchmark plugins/khuym --config plugins/khuym/.plugin-eval/benchmark.json --usage-out /tmp/khuym-plugin-eval-usage.jsonl --result-out /tmp/khuym-plugin-eval-benchmark.json --format markdown
```

Then feed measured usage back into the static report:

```bash
node scripts/khuym-plugin-eval.mjs analyze plugins/khuym --observed-usage /tmp/khuym-plugin-eval-usage.jsonl --format markdown
```

The benchmark uses real `codex exec` runs in copied workspaces. Start with the
five pilot scenarios before expanding coverage:

- `bootstrap-routing`
- `xia-research-routing`
- `planning-gate`
- `operator-path-audit`
- `boundary-case`

Score each scenario against its `successChecklist`, `expectedSkillRouting`,
`expectedFilesOrCommands`, and `mustNot` fields. The key signal is whether
Khuym routes correctly and respects gates under realistic prompts.

If a run stops because of transport or account limits, treat it as incomplete
rather than as a workflow failure. Keep the result JSON and usage log, note the
failed scenario ids, and rerun the pilot after access resets.

## Fix-First Reading

Use this order when reading results:

1. Static blockers: invalid frontmatter, missing metadata, or manifest issues
2. Token budget: excessive trigger or invoke cost before observed usage exists
3. Dependency health: missing or degraded commands/MCP servers
4. Operator-path mismatches: documented normal-path commands that metadata does
   not declare
5. Behavioral failures: wrong skill route, skipped validation, unsupported CLI
   claims, or unnecessary Khuym ceremony

The critical Khuym lesson is that dependency coverage is not enough by itself.
Before calling a skill safe, compare `metadata.dependencies` with the commands
and services the skill actually tells agents to use.

## Expanding The Suite

After the pilot is useful, add scenarios one skill at a time:

- two clear positive triggers
- one negative trigger
- one ambiguous routing case
- one pressure case that stresses dependencies, state, handoff, or gate
  discipline

Prefer scenario evidence over a large scorecard. The goal is to catch failures
that would affect a real operator using the Khuym workflow.
