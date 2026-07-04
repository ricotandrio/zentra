#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./scripts/github/run-workflow.sh <workflow-name> <ref>"
  exit 1
fi

WORKFLOW=$1
REF=${2:-main}

gh workflow run "$WORKFLOW" --ref "$REF"
