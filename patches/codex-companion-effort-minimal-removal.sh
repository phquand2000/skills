#!/usr/bin/env bash
# Remove "minimal" from codex-companion.mjs valid reasoning efforts
# because server rejects it with:
#   level "minimal" not supported, valid levels: low, medium, high, xhigh
# Re-run after codex plugin updates: bash patches/codex-companion-effort-minimal-removal.sh
set -euo pipefail

TARGET="$HOME/.claude/plugins/cache/openai-codex/codex/1.0.3/scripts/codex-companion.mjs"
if [ ! -f "$TARGET" ]; then
  echo "ERROR: codex-companion.mjs not found at $TARGET"
  echo "Check if plugin version changed and update path."
  exit 1
fi

# Check if already patched (no "minimal" in VALID set)
if ! grep -q '"none", "minimal", "low"' "$TARGET"; then
  echo "Already patched (no 'minimal' in VALID_REASONING_EFFORTS)."
  exit 0
fi

# 1. VALID set
sed -i '' 's/"none", "minimal", "low", "medium", "high", "xhigh"/"none", "low", "medium", "high", "xhigh"/' "$TARGET"

# 2. Usage help string
sed -i '' 's/--effort <none|minimal|low|medium|high|xhigh>/--effort <none|low|medium|high|xhigh>/' "$TARGET"

# 3. Error message
sed -i '' 's/Use one of: none, minimal, low, medium, high, xhigh\./Use one of: none, low, medium, high, xhigh./' "$TARGET"

# Verify
if ! grep -q '"none", "minimal", "low"' "$TARGET" \
  && ! grep -q 'none|minimal|low' "$TARGET" \
  && ! grep -q 'none, minimal, low' "$TARGET"; then
  echo "Patch applied successfully (minimal removed from 3 sites)."
else
  echo "WARNING: Patch may be incomplete. Check $TARGET manually."
  exit 1
fi
