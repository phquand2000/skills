#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

try {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const required = ["slug", "description", "instructions"];
  for (const key of required) {
    if (!args[key]) {
      console.error(`Missing required flag: --${key}`);
      printHelp();
      process.exit(1);
    }
  }

  const slug = args.slug.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    console.error("`--slug` must be lowercase kebab-case, for example `qa-helper`.");
    process.exit(1);
  }

  const repoRoot = args["repo-root"]?.trim()
    ? path.resolve(args["repo-root"].trim())
    : process.cwd();
  const outputPath = path.resolve(repoRoot, ".codex/agents", `${slug}.toml`);
  const name = args.name?.trim() || toTitleCase(slug);
  const model = args.model?.trim() || "gpt-5.4-mini";
  const reasoning = args.reasoning?.trim() || "medium";
  const sandbox = args.sandbox?.trim() || "read-only";
  const nicknames = parseCsv(args.nicknames);
  const skillPaths = parseMultiValue(args["skill-path"]);
  const mcpServers = [
    ...parseMcpUrlEntries(args["mcp-server-url"]),
    ...parseMcpCommandEntries(args["mcp-server-command"]),
  ];

  const toml = buildToml({
    name,
    description: args.description.trim(),
    model,
    reasoning,
    sandbox,
    nicknames,
    instructions: normalizeMultiline(args.instructions),
    skillPaths,
    mcpServers,
  });

  if (args["dry-run"]) {
    process.stdout.write(toml);
    process.exit(0);
  }

  if (fs.existsSync(outputPath) && !args.force) {
    console.error(`Refusing to overwrite existing file: ${outputPath}`);
    console.error("Pass --force if you really want to replace it.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, toml, "utf8");
  console.log(outputPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};
  const repeatable = new Set(["skill-path", "mcp-server-url", "mcp-server-command"]);

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    if (["dry-run", "force", "help"].includes(key)) {
      parsed[key] = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    if (repeatable.has(key)) {
      if (!Array.isArray(parsed[key])) {
        parsed[key] = [];
      }
      parsed[key].push(value);
    } else {
      parsed[key] = value;
    }
    index += 1;
  }

  return parsed;
}

function parseMultiValue(value) {
  if (!value) {
    return [];
  }

  return (Array.isArray(value) ? value : [value])
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseCsv(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeMultiline(value) {
  return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd();
}

function parseMcpUrlEntries(value) {
  return parseMultiValue(value).map((entry) => {
    const separator = entry.indexOf("=");
    if (separator <= 0) {
      throw new Error(
        `Invalid --mcp-server-url entry: ${entry}. Use NAME=http://host/mcp.`,
      );
    }

    const name = entry.slice(0, separator).trim();
    const url = entry.slice(separator + 1).trim();
    if (!name || !url) {
      throw new Error(
        `Invalid --mcp-server-url entry: ${entry}. Use NAME=http://host/mcp.`,
      );
    }

    return { name, type: "url", url };
  });
}

function parseMcpCommandEntries(value) {
  return parseMultiValue(value).map((entry) => {
    const separator = entry.indexOf("=");
    if (separator <= 0) {
      throw new Error(
        `Invalid --mcp-server-command entry: ${entry}. Use NAME=command|arg1|arg2.`,
      );
    }

    const name = entry.slice(0, separator).trim();
    const commandParts = entry
      .slice(separator + 1)
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    if (!name || commandParts.length === 0) {
      throw new Error(
        `Invalid --mcp-server-command entry: ${entry}. Use NAME=command|arg1|arg2.`,
      );
    }

    const [command, ...args] = commandParts;
    return { name, type: "command", command, args };
  });
}

function buildToml(config) {
  const lines = [
    `name = ${tomlString(config.name)}`,
    `description = ${tomlString(config.description)}`,
    `model = ${tomlString(config.model)}`,
    `model_reasoning_effort = ${tomlString(config.reasoning)}`,
    `sandbox_mode = ${tomlString(config.sandbox)}`,
  ];

  if (config.nicknames.length > 0) {
    lines.push(
      `nickname_candidates = [${config.nicknames.map((value) => tomlString(value)).join(", ")}]`,
    );
  }

  lines.push(`developer_instructions = """\n${config.instructions}\n"""`);

  for (const skillPath of config.skillPaths) {
    lines.push("", "[[skills.config]]", `path = ${tomlString(skillPath)}`, "enabled = true");
  }

  for (const server of config.mcpServers) {
    lines.push("", `[mcp_servers.${server.name}]`);
    if (server.type === "url") {
      lines.push(`url = ${tomlString(server.url)}`);
      continue;
    }

    lines.push(`command = ${tomlString(server.command)}`);
    if (server.args.length > 0) {
      lines.push(`args = [${server.args.map((value) => tomlString(value)).join(", ")}]`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function tomlString(value) {
  return JSON.stringify(value);
}

function toTitleCase(slugValue) {
  return slugValue
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function printHelp() {
  console.log(`Usage:
  node scripts/init_agent.mjs \\
    --slug qa-helper \\
    --description "Browser-first QA assistant." \\
    --instructions "Act as a QA helper." \\
    [--repo-root /path/to/repo] \\
    [--name "QA Helper"] \\
    [--model gpt-5.4-mini] \\
    [--reasoning medium] \\
    [--sandbox read-only] \\
    [--nicknames "QA,Helper"] \\
    [--skill-path .codex/skills/qa-browser-verify] \\
    [--skill-path .codex/skills/another-skill] \\
    [--mcp-server-url gkg=http://localhost:27495/mcp] \\
    [--mcp-server-command 'MCP_DOCKER=docker|mcp|gateway|run'] \\
    [--dry-run] [--force]
`);
}
