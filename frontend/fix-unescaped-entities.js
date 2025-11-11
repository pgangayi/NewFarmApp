#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix unescaped entities in a file
function fixUnescapedEntities(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    
    // Fix single quotes in JSX text content (not in attributes)
    modified = modified.replace(/([^\\])'([^']*(?:'[^']*)*?)(?=[^a-zA-Z0-9_]|$)/g, '$1'$2');
    
    // Fix double quotes in JSX text content (not in attributes) 
    modified = modified.replace(/([^\\])"([^"]*(?:"[^"]*)*?)(?=[^a-zA-Z0-9_]|$)/g, '$1"$2');
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified);
      console.log(`Fixed unescaped entities in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Walk through all TypeScript/TSX files
function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function
function main() {
  const srcPath = path.join(__dirname, 'src');
  if (!fs.existsSync(srcPath)) {
    console.log('No src directory found');
    return;
  }
  
  const tsFiles = walkDirectory(srcPath);
  let fixedCount = 0;
  
  console.log('Fixing unescaped entities in TypeScript/TSX files...');
  
  tsFiles.forEach(file => {
    if (fixUnescapedEntities(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\nFixed unescaped entities in ${fixedCount} files`);
}

// Run the script
main();