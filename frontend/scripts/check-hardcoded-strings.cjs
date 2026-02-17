/**
 * Check for Hardcoded Strings Script
 * 
 * This script scans component files for hardcoded user-facing strings
 * that should be using the i18n translation system.
 * 
 * Validates Requirement 15.4: No hardcoded strings in components
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const PAGES_DIR = path.join(__dirname, '../src/pages');

// Patterns that indicate hardcoded strings (excluding technical strings)
const HARDCODED_PATTERNS = [
  // Text in JSX elements that looks like user-facing content
  />[A-Z][a-z]+(?:\s+[a-z]+){1,}/g,  // "Loading data" or "Click here"
  
  // Common UI strings
  /["'](?:Loading|Saving|Error|Success|Cancel|Save|Delete|Edit|Add|Remove|Close|Confirm|Back|Next)['"]/g,
  
  // Placeholder text
  /placeholder=["'][A-Z][a-z]+/g,
  
  // Title and label attributes
  /(?:title|label|aria-label)=["'][A-Z][a-z]+/g,
];

// Files/patterns to exclude from checking
const EXCLUDE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /\.stories\./,
  /node_modules/,
];

// Strings that are OK to be hardcoded (technical, not user-facing)
const ALLOWED_STRINGS = [
  'className',
  'onClick',
  'onChange',
  'onSubmit',
  'useState',
  'useEffect',
  'React',
  'TypeScript',
  'JavaScript',
  'API',
  'URL',
  'HTTP',
  'HTTPS',
  'JSON',
  'CSS',
  'HTML',
  'SVG',
  'PNG',
  'JPG',
  'PDF',
  'ID',
  'UUID',
  'ISO',
];

/**
 * Check if a file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Check if a string is allowed to be hardcoded
 */
function isAllowedString(str) {
  return ALLOWED_STRINGS.some(allowed => str.includes(allowed));
}

/**
 * Recursively get all TypeScript/TSX files in a directory
 */
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (/\.(tsx?|jsx?)$/.test(file) && !shouldExclude(filePath)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Check a file for hardcoded strings
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Check if file uses i18n
  const usesI18n = /useTranslation|i18n\.t\(|t\(/.test(content);
  
  // Look for potential hardcoded strings
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    // Skip import statements
    if (line.includes('import ') || line.includes('from ')) {
      return;
    }
    
    // Check for common hardcoded UI strings
    const commonStrings = [
      'Loading', 'Saving', 'Error', 'Success', 'Failed',
      'Cancel', 'Save', 'Delete', 'Edit', 'Add', 'Remove',
      'Close', 'Confirm', 'Back', 'Next', 'Submit',
      'Please', 'Click', 'Enter', 'Select', 'Choose',
    ];
    
    for (const str of commonStrings) {
      // Look for the string in quotes or as JSX text
      const quotedPattern = new RegExp(`["'\`]${str}[^"'\`]*["'\`]`, 'i');
      const jsxPattern = new RegExp(`>[^<]*${str}[^<]*<`, 'i');
      
      if ((quotedPattern.test(line) || jsxPattern.test(line)) && !line.includes('t(')) {
        // Check if it's in a translation call
        if (!line.includes(`t('`) && !line.includes('t("') && !line.includes('i18n.t(')) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            string: str,
          });
        }
      }
    }
  });
  
  return {
    filePath,
    usesI18n,
    issues,
  };
}

/**
 * Main function
 */
function checkHardcodedStrings() {
  console.log('🔍 Checking for hardcoded strings...\n');
  
  // Get all component and page files
  const componentFiles = getFiles(COMPONENTS_DIR);
  const pageFiles = getFiles(PAGES_DIR);
  const allFiles = [...componentFiles, ...pageFiles];
  
  console.log(`Found ${allFiles.length} files to check\n`);
  
  const filesWithIssues = [];
  let totalIssues = 0;
  
  for (const file of allFiles) {
    const result = checkFile(file);
    
    if (result.issues.length > 0) {
      filesWithIssues.push(result);
      totalIssues += result.issues.length;
    }
  }
  
  if (filesWithIssues.length === 0) {
    console.log('✅ No hardcoded strings found!\n');
    return 0;
  }
  
  console.log(`❌ Found ${totalIssues} potential hardcoded strings in ${filesWithIssues.length} files:\n`);
  
  for (const file of filesWithIssues) {
    const relativePath = path.relative(path.join(__dirname, '..'), file.filePath);
    console.log(`\n📄 ${relativePath}`);
    console.log(`   Uses i18n: ${file.usesI18n ? '✅' : '❌'}`);
    
    for (const issue of file.issues) {
      console.log(`   Line ${issue.line}: "${issue.string}" in: ${issue.content.substring(0, 80)}...`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${totalIssues} potential issues in ${filesWithIssues.length} files`);
  console.log('='.repeat(60) + '\n');
  
  console.log('⚠️  Note: This is a heuristic check. Some findings may be false positives.');
  console.log('   Please review each case manually.\n');
  
  return totalIssues;
}

// Run the check
const issues = checkHardcodedStrings();
process.exit(issues > 0 ? 1 : 0);
