#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  file: string;
  matches: string[];
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
    return 1;
  }
  
  console.log("✅ VALIDATION PASSED: No 'candidate' branch references found in main branch workflow files");
  return 0;
}

// Run the validation
const exitCode = validateWorkflows();
process.exit(exitCode);
