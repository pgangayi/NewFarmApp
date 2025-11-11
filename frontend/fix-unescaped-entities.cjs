const fs = require('fs');
const path = require('path');

// Mapping of common apostrophe contexts to proper HTML entities
const apostropheMappings = [
  // Pattern, replacement
  [/\bcan't\b/g, `can't`],
  [/\bwon't\b/g, `won't`],
  [/\bI'm\b/g, `I'm`],
  [/\bI've\b/g, `I've`],
  [/\bI'll\b/g, `I'll`],
  [/\bwe're\b/g, `we're`],
  [/\bwe've\b/g, `we've`],
  [/\bwe'll\b/g, `we'll`],
  [/\bthey're\b/g, `they're`],
  [/\bthey've\b/g, `they've`],
  [/\bthey'll\b/g, `they'll`],
  [/\bthat's\b/g, `that's`],
  [/\bthere's\b/g, `there's`],
  [/\bwhat's\b/g, `what's`],
  [/\bwho's\b/g, `who's`],
  [/\bwhere's\b/g, `where's`],
  [/\bwhen's\b/g, `when's`],
  [/\bhow's\b/g, `how's`],
  [/\bit's\b/g, `it's`],
  [/\bhe's\b/g, `he's`],
  [/\bshe's\b/g, `she's`],
  [/\blet's\b/g, `let's`],
  [/\byou're\b/g, `you're`],
  [/\byou've\b/g, `you've`],
  [/\byou'll\b/g, `you'll`],
  [/\bdon't\b/g, `don't`],
  [/\bdoesn't\b/g, `doesn't`],
  [/\bdidn't\b/g, `didn't`],
  [/\bwasn't\b/g, `wasn't`],
  [/\bweren't\b/g, `weren't`],
  [/\bshouldn't\b/g, `shouldn't`],
  [/\bwouldn't\b/g, `wouldn't`],
  [/\bcouldn't\b/g, `couldn't`],
  [/\bhasn't\b/g, `hasn't`],
  [/\bhaven't\b/g, `haven't`],
  [/\bhadn't\b/g, `hadn't`],
  [/\bmustn't\b/g, `mustn't`],
  [/\bit's\b/g, `it's`],
  [/\b's\b/g, `'s`], // Handle possessives like farmer's
];

function fixUnescapedEntities(content) {
  let fixedContent = content;

  // Apply all apostrophe mappings
  for (const [pattern, replacement] of apostropheMappings) {
    fixedContent = fixedContent.replace(pattern, replacement);
  }

  return fixedContent;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other directories
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file)) {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      console.log(`Processing ${filePath}...`);
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = fixUnescapedEntities(content);

      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Fixed unescaped entities in ${filePath}`);
      } else {
        console.log(`No changes needed in ${filePath}`);
      }
    }
  }
}

// Start processing from the src directory
const srcDir = path.join(__dirname, 'src');
processDirectory(srcDir);

console.log('Completed fixing unescaped entities');
