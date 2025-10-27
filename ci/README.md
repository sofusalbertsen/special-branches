# CI Scripts

This directory contains CI/CD validation scripts for the repository.

## Workflow Checker

The workflow checker validates that GitHub Actions workflow files targeting the `main` branch do not contain references to the `candidate` branch.

### Available Versions

#### TypeScript Version (`workflow-checker.ts`)
The primary implementation written in TypeScript with proper type safety and modern Node.js features.

**Usage:**
```bash
# From repository root
npx ts-node ci/workflow-checker.ts

# Or install dependencies first
cd ci
npm install
cd ..
npx ts-node ci/workflow-checker.ts
```

**Features:**
- Type-safe implementation
- Better error messages
- Maintainable and testable code
- Modern JavaScript features

#### Bash Version (`workflow-checker.sh`)
Legacy shell script version for environments without Node.js.

**Usage:**
```bash
# From repository root
bash ci/workflow-checker.sh
```

### How It Works

The checker:
1. Scans all workflow files in `.github/workflows/`
2. Identifies workflows that target the `main` branch by checking for:
   - `BRANCH_NAME: main` environment variables
   - `branches:` sections containing `main`
   - Workflow names containing "Main" or "main"
3. Skips `candidate-branch.*` and `pr-validation.*` workflows
4. Searches for any references to `candidate` in main branch workflows
5. Exits with error code 1 if violations are found

### Development

**Install dependencies:**
```bash
cd ci
npm install
```

**Build TypeScript:**
```bash
npm run build
```

**Run checker:**
```bash
npm run check
```

### Integration

The TypeScript version is used in the `.github/workflows/pr-validation.yml` workflow to automatically validate pull requests to the `main` branch.
