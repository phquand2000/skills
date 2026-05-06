#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function commandOnPath(command) {
  const result = spawnSync("sh", ["-c", `command -v ${command}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  if (result.status !== 0) {
    return "";
  }

  return result.stdout.trim().split("\n")[0] || "";
}

function resolveCachedScript() {
  const pluginRoot = path.join(
    os.homedir(),
    ".codex",
    "plugins",
    "cache",
    "openai-curated",
    "plugin-eval",
  );

  if (!fs.existsSync(pluginRoot)) {
    return "";
  }

  const candidates = fs
    .readdirSync(pluginRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const scriptPath = path.join(pluginRoot, entry.name, "scripts", "plugin-eval.js");
      if (!fs.existsSync(scriptPath)) {
        return null;
      }
      return {
        scriptPath,
        mtimeMs: fs.statSync(scriptPath).mtimeMs,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates[0]?.scriptPath || "";
}

function printUsage() {
  console.log(`Usage: node scripts/khuym-plugin-eval.mjs <plugin-eval args...>

Examples:
  node scripts/khuym-plugin-eval.mjs analyze plugins/khuym --format markdown
  node scripts/khuym-plugin-eval.mjs analyze plugins/khuym --format json --output /tmp/khuym-plugin-eval-before.json
  node scripts/khuym-plugin-eval.mjs benchmark plugins/khuym --config plugins/khuym/.plugin-eval/benchmark.json --format markdown

Resolution order:
  1. PLUGIN_EVAL_BIN, when set
  2. plugin-eval on PATH
  3. ~/.codex/plugins/cache/openai-curated/plugin-eval/*/scripts/plugin-eval.js
`);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

const explicitBin = process.env.PLUGIN_EVAL_BIN || "";
const pathBin = explicitBin || commandOnPath("plugin-eval");
const cachedScript = resolveCachedScript();

let command = "";
let commandArgs = [];

if (pathBin) {
  command = pathBin.endsWith(".js") ? process.execPath : pathBin;
  commandArgs = pathBin.endsWith(".js") ? [pathBin, ...args] : args;
} else if (cachedScript) {
  command = process.execPath;
  commandArgs = [cachedScript, ...args];
} else {
  console.error("Could not find plugin-eval. Install/enable the Plugin Eval plugin or set PLUGIN_EVAL_BIN.");
  process.exit(127);
}

const result = spawnSync(command, commandArgs, {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
