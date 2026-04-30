---
name: xia
description: Research-first feature discovery for unfamiliar, ambiguous, or high-risk implementation work. Use when Codex should map the real repo stack, find reusable local code, check upstream patterns, and verify current official docs before planning or implementing a feature.
metadata:
  dependencies:
    exa:
      kind: mcp_server
      server_names: [exa]
      config_sources: [global_codex_config, plugin_mcp_manifest]
      missing_effect: degraded
      reason: Xia uses Exa to research current official documentation and recent implementation guidance.
    deepwiki:
      kind: mcp_server
      server_names: [deepwiki]
      config_sources: [global_codex_config, plugin_mcp_manifest]
      missing_effect: degraded
      reason: Xia uses DeepWiki as a best-effort upstream pattern and repository-structure research path.
---

# Xia

Xia is the anti-reinvention scout. Use it before unfamiliar, ambiguous, version-sensitive, or high-risk implementation work when a research brief should come before planning or code.

## Hard Gate

Do not write code or edit files until the research brief is complete, unless the user explicitly waives research or directly asks for immediate implementation.

If two viable paths differ materially in behavior, risk, or migration cost, finish the brief and ask one targeted question instead of guessing.

## Depth

- `Quick`: low-risk questions with an obvious local seam.
- `Standard`: default; map repo, search local reuse, check upstream patterns, check current official docs.
- `Deep`: cross-cutting, version-sensitive, or architecture-heavy work.

If unsure, use `Standard`.

## Required Flow

1. Confirm whether research was waived.
2. Read repo contracts and map the stack from real artifacts.
3. Search locally for existing functionality and extension points.
4. Check upstream patterns only after local evidence is clear.
5. Check current official docs with version awareness.
6. Return a concise research brief using `references/research-brief-template.md`.

Load `references/xia-protocol.md` for stack-ledger guidance, local reuse targets, DeepWiki/Exa roles, recommendation rules, follow-up question criteria, and red flags.

## Evidence Labels

Every non-trivial claim in the brief must be labeled:

- `Local` for findings from this repository
- `Upstream` for public GitHub repository patterns
- `Docs` for official documentation
- `Inference` for conclusions drawn from evidence

Do not blur these categories.

## Recommendation Rule

Choose the lightest credible path:

1. Reuse existing local functionality.
2. Use built-in framework or library capabilities that fit the repo version.
3. Adapt an upstream pattern that fits the repo.
4. Build from scratch only when the other options are insufficient.

Explain why the chosen path beats the next-best alternative.

## Reference Files

| File | When to Load |
|---|---|
| `references/xia-protocol.md` | Detailed research flow, tool roles, guardrails |
| `references/research-brief-template.md` | Required brief structure |
| `references/pressure-scenarios.md` | RED/GREEN validation scenarios |
