#!/usr/bin/env bash
# install-hooks.sh — configure git to use the tracked hooks/ directory.
#
# Run once after cloning:
#   bash scripts/install-hooks.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

# Make hook executable
chmod +x "$REPO_ROOT/hooks/pre-commit"

# Point git at the tracked hooks directory
git -C "$REPO_ROOT" config core.hooksPath hooks

echo "✔ Git hooks installed (core.hooksPath = hooks)"
echo "  Pre-commit post validation is now active."
