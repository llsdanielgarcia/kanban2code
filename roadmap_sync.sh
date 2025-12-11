#!/bin/bash
# roadmap_sync.sh - Deterministic sync seal for Kanban2Code roadmap context
# This script checksums critical files and compares against golden hash

set -euo pipefail

echo "🔍 Kanban2Code Roadmap Sync Seal"
echo "================================="

# Calculate checksum of critical files that define the roadmap state
echo "📊 Calculating current repository state..."

# Define critical files that must match roadmap context
CRITICAL_FILES=(
  "src/types/task.ts"
  "src/types/copy.ts"
  "src/types/context.ts"
  "src/core/constants.ts"
  "src/core/rules.ts"
  "src/services/context.ts"
  "src/services/prompt-builder.ts"
  "src/services/copy.ts"
  "src/services/frontmatter.ts"
  "src/services/scanner.ts"
  "src/services/stage-manager.ts"
  "src/services/archive.ts"
  "src/services/task-watcher.ts"
  "src/webview/messaging.ts"
  "src/workspace/validation.ts"
  "src/workspace/state.ts"
  "package.json"
  "tsconfig.json"
  "eslint.config.mjs"
  "build.ts"
)

# Check if critical files exist
for file in "${CRITICAL_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Critical file missing: $file"
    exit 1
  fi
done

# Calculate checksum of all critical files
CHECKSUM_FILE=".current_roadmap_state"
find "${CRITICAL_FILES[@]}" -type f -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1 > "$CHECKSUM_FILE"

# Golden hash - UPDATE THIS when roadmap_context.md changes
# This should be updated whenever the authoritative roadmap_context.md is modified
GOLDEN_HASH="9f069c5fbdc889d0b8a44cb92ff1d68e6882f575cba4dafb92c674706f60018c"  # Current repository state hash

if [ -f "$CHECKSUM_FILE" ]; then
    CURRENT_HASH=$(cat "$CHECKSUM_FILE")
    echo "📋 Current state hash: $CURRENT_HASH"
    echo "🎯 Expected hash:      $GOLDEN_HASH"
    
    if [ "$CURRENT_HASH" = "$GOLDEN_HASH" ]; then
        echo "✅ Repository state matches roadmap context exactly"
        rm "$CHECKSUM_FILE"
        echo "🚀 Build can proceed safely"
        exit 0
    else
        echo "❌ REPOSITORY STATE DRIFT DETECTED!"
        echo ""
        echo "⚠️  The current codebase has diverged from the authoritative roadmap context."
        echo "📝 This could indicate:"
        echo "   - Unauthorized modifications to core interfaces"
        echo "   - Missing or incomplete phase implementations"
        echo "   - Type system changes that break cross-phase compatibility"
        echo ""
        echo "🔧 Action required:"
        echo "   1. Review changes against roadmap_context.md"
        echo "   2. Update roadmap_context.md if changes are intentional"
        echo "   3. Recalculate golden hash and update this script"
        echo "   4. Ensure all phases remain compatible"
        rm "$CHECKSUM_FILE"
        exit 1
    fi
fi

echo "❌ Sync seal failed - could not calculate state"
exit 1