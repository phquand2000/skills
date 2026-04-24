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
  const skillPath = args["skill-path"]?.trim();

  const toml = buildToml({
    name,
    description: args.description.trim(),
    model,
    reasoning,
    sandbox,
    nicknames,
    instructions: normalizeMultiline(args.instructions),
    skillPath,
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

    parsed[key] = value;
    index += 1;
  }

  return parsed;
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

  if (config.skillPath) {
    lines.push("", "[[skills.config]]", `path = ${tomlString(config.skillPath)}`, "enabled = true");
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
    [--dry-run] [--force]
`);
}
