#!/usr/bin/env bash
set -euo pipefail

# List available Google Generative AI models (ListModels)
# Usage: GEMINI_API_KEY=your_key ./scripts/list-gemini-models.sh

if [ -n "${GEMINI_API_KEY:-}" ]; then
  echo "Using GEMINI_API_KEY (length: $(echo -n "$GEMINI_API_KEY" | wc -c))"
  curl -sS "https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}" -H "Accept: application/json" \
    | (command -v jq >/dev/null 2>&1 && jq '.models[] | {name,displayName,description,capabilities}' || cat)
  exit 0
fi

if command -v gcloud >/dev/null 2>&1; then
  echo "Using gcloud auth token"
  TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null || gcloud auth print-access-token 2>/dev/null)
  if [ -z "$TOKEN" ]; then
    echo "Failed to get gcloud token; please run 'gcloud auth login' or set GEMINI_API_KEY"
    exit 2
  fi
  curl -sS "https://generativelanguage.googleapis.com/v1beta/models" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
    | (command -v jq >/dev/null 2>&1 && jq '.models[] | {name,displayName,description,capabilities}' || cat)
  exit 0
fi

echo "No GEMINI_API_KEY found and gcloud not installed. Set GEMINI_API_KEY or install gcloud."
exit 1
