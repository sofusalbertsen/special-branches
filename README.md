# special-branches

This repository demonstrates branch-specific GitHub Actions workflows with automated validation.

## Features

- **Branch-Specific Workflows**: Separate workflows for `main` and `candidate` branches
- **Environment Variables**: Each branch workflow sets `BRANCH_NAME` to identify the branch
- **PR Validation**: Automated checks to prevent `candidate` branch references in `main` branch workflows

## Documentation

See [WORKFLOWS.md](WORKFLOWS.md) for detailed documentation about the GitHub Actions workflows.

## Branches

- `main` - Production branch
- `candidate` - Pre-production/staging branch