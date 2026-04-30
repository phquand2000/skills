# Compounding Reference

Use after `khuym:compounding` is selected.

## Protocol

1. **Gather evidence:** read feature history files, state/handoff, beads, review
findings, debugging notes, and local commit history. If artifacts are missing,
use session summary and recent git diff. Do not fabricate.
2. **Analyze:** launch three temp-finding subagents:
   - pattern extractor: reusable code/process/integration patterns
   - decision analyst: important choices, tradeoffs, surprises
   - failure analyst: blockers, wrong assumptions, regressions, missing checks
3. **Synthesize:** tag each useful finding with category, severity, tags, and
applicable-when. Write one learnings file.
4. **Promote criticals:** append only reusable lessons that would save future
agents meaningful time.
5. **Optional CASS/CM:** use only when `.khuym/config.json` enables it. Files stay primary.
6. **Update state:** record completed compounding run in `.khuym/state.json`.

## Learnings File

Path: `history/learnings/YYYYMMDD-<slug>.md`

```markdown
---
date: YYYY-MM-DD
feature: <feature-name>
categories: [pattern, decision, failure]
severity: critical | standard
tags: [tag1, tag2]
---

# Learning: <Concise Title>

**Category:** pattern | decision | failure
**Severity:** critical | standard
**Tags:** [tag1, tag2]
**Applicable-when:** <when future agents should use this>

## What Happened

<2-4 concrete sentences. Name files, commands, tools, or flows.>

## Root Cause / Key Insight

<Why it happened or why the pattern worked.>

## Recommendation for Future Work

<Imperative rule: "When X, do Y..." Specific enough to act on.>
```

Slug: `YYYYMMDD-<primary-topic>-<secondary-topic>`, lowercase hyphens only.

## Critical Promotion

Promote only when it affects more than one future feature, would prevent
meaningful waste, and is generalizable.

```markdown
## [YYYYMMDD] <Learning Title>
**Category:** pattern | decision | failure
**Feature:** <feature-name>
**Tags:** [tag1, tag2]

<2-4 sentence summary: what happened, root cause, and future rule.>

**Full entry:** history/learnings/YYYYMMDD-<slug>.md
```

## State Update

```json
{
  "active_skill": "compounding",
  "phase": "compounding-complete",
  "summary": "Compounding complete. Learnings captured for the next feature.",
  "next_action": "Start the next feature or reopen deferred follow-up work.",
  "last_compounding_run": {
    "feature": "<feature-name>",
    "date": "YYYY-MM-DD",
    "learnings_file": "history/learnings/YYYYMMDD-<slug>.md",
    "critical_promotions": <N>
  }
}
```

## Red Flags

- skipping compounding for meaningful work
- promoting everything as critical
- writing vague advice such as "test more carefully"
- inventing findings
- letting analysis agents write final durable files directly
