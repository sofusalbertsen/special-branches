#!/usr/bin/env bash

# Fail on unset variables and failed pipelines so we catch issues early.
set -o errexit
set -o nounset
set -o pipefail

echo "Checking workflow files that target the 'main' branch..."

WORKFLOW_DIR=".github/workflows"

if [[ ! -d "$WORKFLOW_DIR" ]]; then
  echo "No workflow directory found; skipping validation."
  exit 0
fi

FOUND_CANDIDATE=false

while IFS= read -r file; do
  # Skip workflows that are explicitly for the candidate branch or validation itself.
  if [[ "$file" == *"candidate-branch"* ]] || [[ "$file" == *"pr-validation"* ]]; then
    echo "Skipping: $file"
    continue
  fi

  echo "Checking: $file"

  has_main_reference=false

  # Detect if the workflow is meant for the main branch by looking for branch selectors
  # or explicit environment variables referencing main.
  if grep -Eq "BRANCH_NAME[[:space:]]*:[[:space:]]*main" "$file"; then
    has_main_reference=true
  elif awk '
      /branches:/ {
        for (i = 0; i < 5 && getline line; i++) {
          if (line ~ /main/) {
            exit 0
          }
        }
      }
      END { exit 1 }
    ' "$file"; then
    has_main_reference=true
  elif grep -Eq "name:[[:space:]]*(Main|main)" "$file"; then
    # Treat workflows explicitly named for main as main branch workflows.
    has_main_reference=true
  fi

  if [[ "$has_main_reference" == false ]]; then
    echo "  -> Skipping (no main branch references found)"
    continue
  fi

  echo "  -> Detected main branch workflow"

  matches=$(grep -En "(BRANCH_NAME[[:space:]]*:[[:space:]]*candidate|branches:.*candidate|-[[:space:]]*candidate)" "$file" || true)

  if [[ -n "$matches" ]]; then
    echo "ERROR: Found 'candidate' branch reference in $file (which targets the main branch)"
    echo "$matches"
    FOUND_CANDIDATE=true
  else
    echo "  -> No 'candidate' branch reference found"
  fi
done < <(find "$WORKFLOW_DIR" -type f \( -name "*.yml" -o -name "*.yaml" \))

if [[ "$FOUND_CANDIDATE" == true ]]; then
  echo
  echo "❌ VALIDATION FAILED: Workflow files targeting the 'main' branch must not contain 'candidate' branch references"
  exit 1
fi

echo "✅ VALIDATION PASSED: No 'candidate' branch references found in main branch workflow files"
