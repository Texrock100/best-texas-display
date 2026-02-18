#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the repository root
const repoRoot = '/sessions/youthful-wonderful-feynman/best-texas-display';

// Get all tracked files from git
console.log('Reading tracked files from git...');
const trackedFilesOutput = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf-8' });
const trackedFiles = trackedFilesOutput.trim().split('\n');

console.log(`Found ${trackedFiles.length} tracked files`);

// Create the output structure
const output = {
  repo: 'Texrock100/best-texas-display',
  timestamp: new Date().toISOString(),
  fileCount: trackedFiles.length,
  files: []
};

// Process each file
let successCount = 0;
let errorCount = 0;

trackedFiles.forEach((filePath, index) => {
  const fullPath = path.join(repoRoot, filePath);

  try {
    // Read the file
    const fileContent = fs.readFileSync(fullPath, 'utf-8');

    // Base64 encode the content
    const base64Content = Buffer.from(fileContent).toString('base64');

    // Add to output
    output.files.push({
      path: filePath,
      size: fileContent.length,
      base64Content: base64Content
    });

    successCount++;
    if ((index + 1) % 10 === 0) {
      console.log(`  Processed ${index + 1}/${trackedFiles.length} files...`);
    }
  } catch (error) {
    console.error(`  Error reading file ${filePath}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\nProcessed ${successCount} files successfully, ${errorCount} errors`);

// Write the output JSON
const outputPath = '/sessions/youthful-wonderful-feynman/github-upload.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\nOutput written to: ${outputPath}`);
console.log(`JSON file size: ${fs.statSync(outputPath).size} bytes`);
