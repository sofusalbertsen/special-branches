#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync, appendFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  file: string;
  matches: string[];
}

/**
 * Checks if running in GitHub Actions environment
 */
function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}

/**
 * Writes content to GitHub Actions summary
 */
function writeToGitHubSummary(content: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    appendFileSync(summaryFile, content + '\n');
  }
}

/**
 * Recursively finds all workflow files in a directory
 */
function findWorkflowFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findWorkflowFiles(fullPath));
    } else if (stat.isFile() && (entry.endsWith('.yml') || entry.endsWith('.yaml'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Finds all occurrences of 'candidate' in branch-related contexts
 */
function findCandidateReferences(content: string): string[] {
  const matches: string[] = [];
  const lines = content.split('\n');
  const pattern = /SDLC_BRANCH\s*:\s*candidate|branches:.*candidate|-\s*candidate|uses:\s*j708-zp9u\/\S+@candidate/;
  
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      matches.push(`${i + 1}:${lines[i]}`);
    }
  }
  
  return matches;
}

/**
 * Main validation function
 */
function validateWorkflows(): number {
  console.log("Checking workflow files that target the 'main' branch...\n");
  
  const workflowDir = '.github/workflows';
  
  if (!existsSync(workflowDir)) {
    console.log('No workflow directory found; skipping validation.');
    return 0;
  }
  
  const workflowFiles = findWorkflowFiles(workflowDir);
  const validationResults: ValidationResult[] = [];
  
  for (const file of workflowFiles) {
    // Skip candidate-branch and pr-validation workflows by exact basename match
    const basename = require('path').basename(file);
    if ( basename === 'pr-validation.yml' || basename === 'pr-validation.yaml') {
      console.log(`Skipping: ${file}`);
      continue;
    }
    
    console.log(`Checking: ${file}`);
    
    const content = readFileSync(file, 'utf-8');

    const matches = findCandidateReferences(content);
    
    if (matches.length > 0) {
      console.log(`ERROR: Found 'candidate' reference in ${file} (which targets the main branch)`);
      matches.forEach(match => console.log(match));
      validationResults.push({ file, matches });
    } else {
      console.log("  -> No 'candidate' reference found");
    }
  }
  
  console.log();
  
  if (validationResults.length > 0) {
    console.log("❌ VALIDATION FAILED: Workflow files targeting the 'main' branch must not contain 'candidate' branch references");
    
    // Write to GitHub Actions summary if running in CI
    if (isGitHubActions()) {
      writeToGitHubSummary('## ❌ Workflow Validation Failed\n');
      writeToGitHubSummary('Workflow files must not contain `candidate` branch references.\n');
      writeToGitHubSummary('### Violations Found\n');
      
      for (const result of validationResults) {
        writeToGitHubSummary(`#### \`${result.file}\`\n`);
        writeToGitHubSummary('```yaml');
        for (const match of result.matches) {
          const [lineNum, lineContent] = match.split(':', 2);
          writeToGitHubSummary(`Line ${lineNum}: ${lineContent.trim()}`);
        }
        writeToGitHubSummary('```\n');
      }
      
      writeToGitHubSummary('### Checked Patterns\n');
      writeToGitHubSummary('The following patterns are not allowed:\n');
      writeToGitHubSummary('- `SDLC_BRANCH: candidate` - Environment variable assignments');
      writeToGitHubSummary('- `branches: ... candidate` - Branch trigger configurations');
      writeToGitHubSummary('- `- candidate` - YAML list items (branch arrays)');
      writeToGitHubSummary('- `uses: j708-zp9u/*@candidate` - Custom action references using candidate branch');
    }
    
    return 1;
  }
  
  console.log("✅ VALIDATION PASSED: No 'candidate' branch references found in main branch workflow files");
  
  // Write success to GitHub Actions summary if running in CI
  if (isGitHubActions()) {
    writeToGitHubSummary('## ✅ Workflow Validation Passed\n');
    writeToGitHubSummary(`All ${workflowFiles.length} workflow files are clean. No \`candidate\` branch references found.`);
  }
  
  return 0;
}

// Run the validation
const exitCode = validateWorkflows();
process.exit(exitCode);
