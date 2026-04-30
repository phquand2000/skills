---
name: agent-creator
description: Use when the user asks to create a persistent repo-local Codex agent, scaffold `.codex/agents/*.toml`, define a reusable specialist role, or match an agent to existing local skills and MCP servers.
metadata:
  dependencies: []
---

# Agent Creator

Use this skill when the user wants a new reusable agent added to the current repository, not just a one-off spawned subagent for the current turn.

## Goal

Create repo-local agent definitions under `.codex/agents` that match the patterns already used in the target codebase.

## HARD-GATE

Before you write or patch an agent definition, you MUST check the current repo for:

- the closest existing agent under `.codex/agents`
- the current skill inventory that could match the requested role
- the current MCP servers that could be a true dependency for that role

Do not invent a skill path or MCP server name from memory when the repo can prove what exists.
If no existing skill or MCP server is a strong fit, leave that block out.

## Local conventions

- Agent files live at `.codex/agents/<slug>.toml`.
- Keep filenames lowercase and hyphen-safe. Use a user-facing `name` inside the file.
- Required fields: `name`, `description`, `model`, `model_reasoning_effort`, `sandbox_mode`, and `developer_instructions`.
- Add `nickname_candidates` when the role is collaborative or likely to be spawned often.
- Use `[[skills.config]]` only when the agent has a repeatable workflow that should load a repo-local skill automatically.
- Add `[mcp_servers.*]` blocks only when the role truly depends on an MCP server.

## Recommended defaults

- Use `gpt-5.4-mini` with `medium` reasoning for focused specialists.
- Use `gpt-5.4` when judgment quality matters more than speed, such as reviews or research-heavy roles.
- Use `read-only` for QA, exploration, docs, and review agents.
- Use `workspace-write` only for builder or repair agents that are expected to edit files.
- Keep `developer_instructions` short, imperative, and role-specific.
- Reuse existing repo-local skills before asking for a new one.
- Add MCP blocks only for hard dependencies, not for "might be useful someday" tools.

## Match The Repo First

Check these surfaces in order:

1. `.codex/agents/*.toml`
   Copy the style of the nearest existing agent, especially naming, reasoning level, sandbox choice, and whether the repo prefers nickname candidates.
2. Repo-local skills
   Check `.codex/skills/*/SKILL.md` first in app repos.
   In plugin repos, check the canonical skill source tree for the repo.
   Add `[[skills.config]]` only when the skill is already present and is the clearest repeatable fit for the user's request.
3. MCP configuration
   Check repo-local `.codex/config.toml`, repo plugin manifests such as `.mcp.json`, and any existing agent TOML files that already use MCP blocks.
   Add `[mcp_servers.*]` only when the requested agent truly depends on that server for its normal path.

Map user intent to concrete repo assets:

- Browser QA request -> attach the repo's browser QA skill if it exists.
- Docs or version-verification request -> attach the docs MCP server only if the repo already exposes it and the role depends on it.
- Codebase exploration request -> prefer the repo's graph/search MCP server only when that server is actually configured and used locally.

## Workflow

1. Inspect the closest existing agent in `.codex/agents` and copy its style.
2. Lock the minimum spec from the request: role name, description, sandbox mode, model/reasoning, edit permissions, and whether the role needs a local skill or MCP server.
3. Check the current skill inventory and choose only the best-fit existing skill paths.
4. Check the current MCP inventory and choose only the MCP servers that are true dependencies for the role.
5. If a detail is missing, infer it from the nearest existing agent and state that assumption after the work is done.
6. Scaffold the base TOML with `scripts/init_agent.mjs`.
7. Patch the generated file for any repo-specific details that the scaffold did not cover.
8. If the new role needs a repeatable workflow and no fitting skill exists yet, create a matching skill in the repo in the same turn.
9. Read the finished file back and sanity-check that it matches the repo's existing agent style.

## Correct Block Formats

Use the real TOML block shapes that existing agents use:

```toml
[[skills.config]]
path = ".codex/skills/qa-browser-verify"
enabled = true

[mcp_servers.gkg]
url = "http://localhost:27495/mcp"

[mcp_servers.MCP_DOCKER]
command = "docker"
args = ["mcp", "gateway", "run"]
```

Rules:

- Use one `[[skills.config]]` block per skill.
- Use `[mcp_servers.<name>]` blocks, not a nested array or inline JSON.
- For HTTP MCP servers, use `url = "..."`
- For stdio MCP servers, use `command = "..."` plus `args = [...]`
- Preserve the server name exactly as configured locally, including case such as `MCP_DOCKER`.
- Do not add speculative `env` or tool filters unless the repo already proves they belong.

## Scaffold command

Run this from the skill directory:

```bash
node scripts/init_agent.mjs \
  --repo-root /path/to/repo \
  --slug qa-helper \
  --name "QA Helper" \
  --description "Browser-first QA assistant for lightweight smoke tests." \
  --model gpt-5.4-mini \
  --reasoning medium \
  --sandbox read-only \
  --nicknames "QA,Helper" \
  --skill-path .codex/skills/qa-browser-verify \
  --mcp-server-url gkg=http://localhost:27495/mcp \
  --mcp-server-command 'MCP_DOCKER=docker|mcp|gateway|run' \
  --instructions "Act as a lightweight QA helper.\nCheck key routes, capture evidence, and avoid code edits unless asked."
```

## Script behavior

- By default the script writes `.codex/agents/<slug>.toml` under the current working directory.
- Pass `--repo-root /path/to/repo` when running the script from outside the target repo, such as from this installed skill directory.
- Pass `--skill-path .codex/skills/<skill-name>` once per matched skill to add enabled `[[skills.config]]` blocks.
- Pass `--mcp-server-url name=http://host/mcp` for HTTP MCP servers.
- Pass `--mcp-server-command 'NAME=command|arg1|arg2'` for stdio MCP servers.
- Pass `--dry-run` to print the TOML without writing files.
- If the target file already exists, the script stops unless `--force` is passed.

## Deliverable

Return the new agent file path, the matched skills and MCP servers you chose, the main behavior choices you encoded, and any assumptions you made while filling in missing details.
