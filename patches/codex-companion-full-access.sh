#!/usr/bin/env bash
# Patch codex-companion.mjs to add --full-access flag (danger-full-access sandbox)
# Re-run after codex plugin updates: bash patches/codex-companion-full-access.sh
set -euo pipefail

TARGET="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.3/scripts/codex-companion.mjs"
if [ ! -f "$TARGET" ]; then
  echo "ERROR: codex-companion.mjs not found at $TARGET"
  echo "Check if plugin version changed and update path."
  exit 1
fi

# Check if already patched
if grep -q "full-access" "$TARGET"; then
  echo "Already patched."
  exit 0
fi

# 1. Sandbox selection (line ~488)
sed -i '' 's/sandbox: request\.write ? "workspace-write" : "read-only"/sandbox: request.fullAccess ? "danger-full-access" : request.write ? "workspace-write" : "read-only"/' "$TARGET"

# 2. Boolean options parsing
sed -i '' 's/booleanOptions: \["json", "write", "resume-last", "resume", "fresh", "background"\]/booleanOptions: ["json", "write", "full-access", "resume-last", "resume", "fresh", "background"]/' "$TARGET"

# 3. fullAccess variable
sed -i '' 's/const write = Boolean(options\.write);/const write = Boolean(options.write);\n  const fullAccess = Boolean(options["full-access"]);/' "$TARGET"

# 4. buildTaskRequest — add fullAccess field
sed -i '' 's/function buildTaskRequest({ cwd, model, effort, prompt, write, resumeLast, jobId })/function buildTaskRequest({ cwd, model, effort, prompt, write, fullAccess, resumeLast, jobId })/' "$TARGET"
sed -i '' '/function buildTaskRequest/,/^}/{
  s/    write,/    write,\n    fullAccess,/
}' "$TARGET"

# 5. Pass fullAccess in both call sites
sed -i '' '/buildTaskRequest({/{
  N;N;N;N;N
  s/      prompt,\n      write,/      prompt,\n      write,\n      fullAccess,/
}' "$TARGET"

# Verify
if grep -q "danger-full-access" "$TARGET" && grep -q "full-access" "$TARGET"; then
  echo "Patch applied successfully."
else
  echo "WARNING: Patch may be incomplete. Check $TARGET manually."
fi
