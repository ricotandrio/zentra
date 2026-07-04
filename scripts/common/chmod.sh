#!/usr/bin/env bash
set -e

echo "Making scripts executable..."

find ./scripts -type f -name "*.sh" -exec chmod +x {} \;

echo "Done."
