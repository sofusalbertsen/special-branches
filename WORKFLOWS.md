# GitHub Workflows Documentation

This repository uses branch-specific GitHub Actions workflows to manage builds for the `main` and `candidate` branches.

## Workflow Files

### 1. Main Branch Workflow (`main-branch.yml`)

- **Triggers**: On workflow_dispatch (manual trigger)
- **Environment Variables**:
  - Global: `BRANCH_NAME=candidate`
  - Job-level: `BRANCH_NAME=main` (overrides global)
- **Purpose**: Executes build and deployment tasks for the main branch

### 2. PR Validation Workflow (`pr-validation.yml`)

- **Triggers**: On pull request to the `main` branch
- **Purpose**: Validates that workflow files do not contain references to the `candidate` branch
- **Implementation**: TypeScript-based validation script (`ci/workflow-checker.ts`)
- **Validation Rules**:
  - Checks all workflow files in `.github/workflows/`
  - Fails if any workflow contains `candidate` in:
    - `BRANCH_NAME` environment variable
    - Branch references in the `branches:` section
    - Branch list items (`- candidate`)
  - Skips validation for:
    - `pr-validation.yml` (this validation workflow itself)

## Why This Validation?

The PR validation ensures that workflows running on the `main` branch do not accidentally reference the `candidate` branch. This helps maintain clean separation between branch-specific configurations and prevents configuration mistakes.

## Example Usage

### Valid Main Branch Workflow

```yaml
name: Main Branch Workflow
on:
  workflow_dispatch:
env:
  BRANCH_NAME: main  # ✓ Correct
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
```

### Invalid Main Branch Workflow (Will Fail PR Validation)

```yaml
name: Main Branch Workflow
on:
  workflow_dispatch:
env:
  BRANCH_NAME: candidate  # ✗ This will fail validation!
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
```

## Testing Locally

You can test the validation logic locally before creating a PR:

### Using TypeScript (Recommended)

```bash
# Navigate to repository root
cd /path/to/your/repository

# Install dependencies (first time only)
cd ci
npm install
cd ..

# Run the TypeScript validation
npx ts-node ci/workflow-checker.ts
```

### Using Bash

```bash
# Navigate to repository root
cd /path/to/your/repository

# Run the bash validation script
bash ci/workflow-checker.sh
```

## Validation Scripts

The repository includes two validation script implementations in the `ci/` directory:

1. **`workflow-checker.ts`** (TypeScript) - Primary implementation used in CI/CD
   - Type-safe with modern Node.js features
   - Better error messages and maintainability
   - Requires Node.js and npm

2. **`workflow-checker.sh`** (Bash) - Legacy implementation
   - Works in environments without Node.js
   - Uses standard Unix tools (grep, awk, find)

See `ci/README.md` for detailed documentation on both implementations.
