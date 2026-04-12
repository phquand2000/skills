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

## Codex Agent Mail HTTP MCP Setup (Required for Workers)

Workers spawned via codex-companion need access to Agent Mail tools. Use HTTP transport (NOT stdio) to avoid mailbox lock conflicts with the running server:

```bash
# Add agent-mail HTTP MCP to Codex global config (~/.codex/config.toml)
codex mcp add agent-mail --url http://127.0.0.1:8765/api

# Verify
codex mcp list
```

After this, workers have ~38 `mcp__agent_mail__*` tools natively (register_agent, send_message, file_reservation_paths, macro_contact_handshake, etc.).

**Why HTTP instead of stdio:** When the Agent Mail server is running (port 8765), it holds an exclusive lock on the mailbox. Stdio MCP clients (e.g., `am serve-stdio`) cannot start because they need the same lock. HTTP MCP routes through the server's existing connection pool.

## Workers MUST Use MCP, NOT `am` CLI

The `am file_reservations` and other write commands attempt direct mailbox file access, conflicting with the running server. Workers should use `mcp__agent_mail__*` tools natively for all coordination. The `am` CLI is fine for read-only orchestrator-side debugging but NOT for workers.

## Contact Handshake Required Before First Message

Agent Mail enforces contact policy: workers must `macro_contact_handshake(auto_accept=true)` with the coordinator before first `send_message`. Skill files (`worker-template.md`, `executing/SKILL.md`) include this step.

## Swarming Adaptation

Swarming and executing skills are adapted for Claude Code orchestrator + Codex CLI workers (turn-based model). Key decisions documented in the handoff at `.claude/handoff/`.

## Hard Test Validated (2026-04-12)

End-to-end pipeline validated:
- 2 parallel workers, 87s, 0 failures
- Workers use `mcp__agent_mail__*` tools natively
- Pre-register sequential, spawn parallel
- Khuym skills loaded via `sync-skills.sh --target claude`
