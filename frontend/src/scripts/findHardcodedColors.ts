/**
 * Script to find hardcoded colors in components
 * 
 * Run with: npx tsx frontend/src/scripts/findHardcodedColors.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ColorMatch {
  file: string;
  line: number;
  color: string;
  context: string;
}

const hexColorRegex = /#[0-9a-fA-F]{3,6}/g;
const rgbColorRegex = /rgba?\([^)]+\)/g;

const colorMatches: ColorMatch[] = [];

// Kawaii color mappings
const COLOR_MAPPINGS: Record<string, string> = {
  '#FFB3BA': 'var(--kawaii-primary-500)',
  '#FFF8F0': 'var(--kawaii-cream)',
  '#fff5f7': 'var(--kawaii-primary-50)',
  '#ffe3e8': 'var(--kawaii-primary-100)',
  '#ffc7d1': 'var(--kawaii-primary-200)',
  '#ffaaba': 'var(--kawaii-primary-300)',
  '#ff8ea3': 'var(--kawaii-primary-400)',
  '#ff6b7f': 'var(--kawaii-primary-600)',
  '#ff4d63': 'var(--kawaii-primary-700)',
  '#ff2f47': 'var(--kawaii-primary-800)',
  '#e6002b': 'var(--kawaii-primary-900)',
  '#b30021': 'var(--kawaii-primary-950)',
  'rgb(255, 248, 240)': 'var(--kawaii-cream)',
  'rgb(255, 179, 186)': 'var(--kawaii-primary-500)',
};

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip CSS variable definitions
    if (line.includes('--kawaii-') || line.includes(':root')) {
      return;
    }

    // Find hex colors
    const hexMatches = line.match(hexColorRegex);
    if (hexMatches) {
      hexMatches.forEach((color) => {
        colorMatches.push({
          file: filePath,
          line: index + 1,
          color,
          context: line.trim(),
        });
      });
    }

    // Find RGB colors
    const rgbMatches = line.match(rgbColorRegex);
    if (rgbMatches) {
      rgbMatches.forEach((color) => {
        colorMatches.push({
          file: filePath,
          line: index + 1,
          color,
          context: line.trim(),
        });
      });
    }
  });
}

function scanDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, dist, build
      if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Scan TSX, TS, CSS files
      if (/\.(tsx?|css)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  });
}

function generateReport() {
  console.log('\n=== Hardcoded Colors Found ===\n');
  console.log(`Total matches: ${colorMatches.length}\n`);

  // Group by file
  const byFile: Record<string, ColorMatch[]> = {};
  colorMatches.forEach((match) => {
    if (!byFile[match.file]) {
      byFile[match.file] = [];
    }
    byFile[match.file].push(match);
  });

  // Sort files by number of matches
  const sortedFiles = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);

  sortedFiles.forEach(([file, matches]) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`\n📄 ${relativePath} (${matches.length} matches)`);
    console.log('─'.repeat(80));

    matches.forEach((match) => {
      const suggestion = COLOR_MAPPINGS[match.color.toLowerCase()] || 'var(--kawaii-???)';
      console.log(`  Line ${match.line}: ${match.color}`);
      console.log(`    → Suggestion: ${suggestion}`);
      console.log(`    Context: ${match.context.substring(0, 100)}...`);
      console.log('');
    });
  });

  // Summary by color
  console.log('\n=== Color Usage Summary ===\n');
  const colorCounts: Record<string, number> = {};
  colorMatches.forEach((match) => {
    const color = match.color.toLowerCase();
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });

  const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  sortedColors.forEach(([color, count]) => {
    const suggestion = COLOR_MAPPINGS[color] || 'var(--kawaii-???)';
    console.log(`  ${color}: ${count} occurrences → ${suggestion}`);
  });

  // Generate replacement script
  console.log('\n=== Suggested Replacements ===\n');
  console.log('Add these to your find-and-replace:');
  Object.entries(COLOR_MAPPINGS).forEach(([old, newVal]) => {
    console.log(`  "${old}" → "${newVal}"`);
  });
}

// Run the scan
const componentsDir = path.join(__dirname, '..', 'components');
const stylesDir = path.join(__dirname, '..', 'styles');

console.log('Scanning for hardcoded colors...');
console.log(`Components: ${componentsDir}`);
console.log(`Styles: ${stylesDir}`);

if (fs.existsSync(componentsDir)) {
  scanDirectory(componentsDir);
}
if (fs.existsSync(stylesDir)) {
  scanDirectory(stylesDir);
}

generateReport();

console.log('\n✅ Scan complete!\n');
