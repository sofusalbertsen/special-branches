# GitHub Workflows Documentation

This repository uses branch-specific GitHub Actions workflows to manage builds for the `main` and `candidate` branches.

## Workflow Files

### 1. Main Branch Workflow (`main-branch.yml`)
- **Triggers**: On push or pull request to the `main` branch
- **Environment Variable**: `BRANCH_NAME=main`
- **Purpose**: Executes build and deployment tasks for the main branch

### 2. Candidate Branch Workflow (`candidate-branch.yml`)
- **Triggers**: On push or pull request to the `candidate` branch
- **Environment Variable**: `BRANCH_NAME=candidate`
- **Purpose**: Executes build and deployment tasks for the candidate branch

### 3. PR Validation Workflow (`pr-validation.yml`)
- **Triggers**: On pull request to the `main` branch
- **Purpose**: Validates that workflow files targeting the main branch do not contain references to the candidate branch
- **Validation Rules**:
  - Checks all workflow files that trigger on the `main` branch
  - Fails if any such workflow contains `candidate` in:
    - `BRANCH_NAME` environment variable
    - Branch references in the `branches:` section
  - Skips validation for:
    - `candidate-branch.yml` (candidate-specific workflow)
    - `pr-validation.yml` (this validation workflow itself)

## Why This Validation?

The PR validation ensures that workflows running on the `main` branch do not accidentally reference the `candidate` branch. This helps maintain clean separation between branch-specific configurations and prevents configuration mistakes.

## Example Usage

### Valid Main Branch Workflow
```yaml
name: Main Branch Workflow
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      BRANCH_NAME: main  # ✓ Correct
```

### Invalid Main Branch Workflow (Will Fail PR Validation)
```yaml
name: Main Branch Workflow
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      BRANCH_NAME: candidate  # ✗ This will fail validation!
```

## Testing Locally

You can test the validation logic locally before creating a PR:

```bash
# Navigate to repository root
cd .github/workflows

# Run the validation check
bash -c '
  WORKFLOW_FILES=$(find . -type f \( -name "*.yml" -o -name "*.yaml" \))
  for file in $WORKFLOW_FILES; do
    if [[ "$file" != *"candidate-branch"* ]] && [[ "$file" != *"pr-validation"* ]]; then
      if grep -q "branches:" "$file" && grep -A5 "branches:" "$file" | grep -q "main"; then
        if grep -E "(BRANCH_NAME.*candidate|branches:.*candidate|- candidate)" "$file"; then
          echo "ERROR: Found candidate reference in $file"
          exit 1
        fi
      fi
    fi
  done
  echo "✓ Validation passed"
'
```
