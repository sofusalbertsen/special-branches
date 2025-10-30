# CI Scripts

This directory contains CI/CD validation scripts for the repository.

## Workflow Checker

The workflow checker validates that GitHub Actions workflow files do not contain references to the `candidate` branch. This ensures that workflows intended for production (main branch) don't accidentally reference pre-production resources.

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

1. Scans all workflow files in `.github/workflows/` directory
2. Skips `pr-validation.yml` and `pr-validation.yaml` workflows (allowed to reference candidate)
3. Searches for `candidate` branch references in the following patterns:
   - `SDLC_BRANCH: candidate` - Environment variable assignments
   - `branches: ... candidate` - Branch trigger configurations
   - `- candidate` - YAML list items (branch arrays)
   - `uses: j708-zp9u/*@candidate` - Custom action references from the j708-zp9u owner using candidate branch
4. Reports all matches with file name and line number
5. Exits with error code 1 if any violations are found, 0 if clean

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
