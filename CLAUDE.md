# Skills Fork — Local Adaptations

## Codex Companion Patch

The codex plugin (`~/.claude/plugins/cache/openai-codex/`) ships `codex-companion.mjs` with hardcoded `workspace-write` sandbox. On macOS, this blocks network and writes outside the workspace (seatbelt, Issue #10390). The `--full-access` patch adds `danger-full-access` sandbox support.

**Re-apply after plugin updates:**
```bash
bash patches/codex-companion-full-access.sh
```

**Usage:**
```bash
node codex-companion.mjs task --write --full-access "prompt"
```

If the plugin version changes (currently `1.0.3`), update the path in the patch script.

## Swarming Adaptation

Swarming and executing skills are adapted for Claude Code orchestrator + Codex CLI workers (turn-based model). Key decisions documented in the handoff at `.claude/handoff/`.
