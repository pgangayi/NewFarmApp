#!/usr/bin/env node
// Automated script to replace 'any' with 'unknown' in critical files

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const criticalFiles = [
  'src/lib/api/client.ts',
  'src/lib/unifiedApi.ts',
  'src/stores/offlineQueueStore.ts',
  'src/types/entities.ts',
];

const anyPattern = /\bany\b/g;

function fixAnyInFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const fixedContent = content.replace(anyPattern, 'unknown');

    if (content !== fixedContent) {
      writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('Starting automated any->unknown fixes...');
let fixedCount = 0;

criticalFiles.forEach(file => {
  if (fixAnyInFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);
