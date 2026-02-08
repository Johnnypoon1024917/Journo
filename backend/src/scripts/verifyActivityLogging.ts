/**
 * Manual verification script for activity logging middleware
 * 
 * This script verifies that activity logging middleware is properly applied to all routes.
 * It checks the route files to ensure the middleware is imported and used correctly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RouteCheck {
  file: string;
  hasImport: boolean;
  hasMiddleware: boolean;
  routes: string[];
}

const routeFiles = [
  'places.ts',
  'days.ts',
  'packingRoutes.ts',
  'collaborators.ts',
  'stories.ts'
];

const expectedMiddleware: Record<string, string[]> = {
  'places.ts': ['placeAdded', 'placeUpdated', 'placeDeleted', 'placeReordered'],
  'days.ts': ['dayAdded', 'dayUpdated', 'dayDeleted'],
  'packingRoutes.ts': ['packingItemAdded', 'packingItemUpdated', 'packingItemDeleted'],
  'collaborators.ts': ['collaboratorAdded', 'collaboratorRoleChanged', 'collaboratorRemoved'],
  'stories.ts': ['storyAdded', 'storyDeleted']
};

function checkRouteFile(filename: string): RouteCheck {
  const filePath = path.join(__dirname, '..', 'routes', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const hasImport = content.includes('createActivityLogMiddleware');
  const routes: string[] = [];
  
  // Check for each expected middleware usage
  const expected = expectedMiddleware[filename] || [];
  expected.forEach((middleware: string) => {
    if (content.includes(`createActivityLogMiddleware.${middleware}()`)) {
      routes.push(middleware);
    }
  });
  
  return {
    file: filename,
    hasImport,
    hasMiddleware: routes.length > 0,
    routes
  };
}

function main() {
  console.log('🔍 Verifying Activity Logging Middleware Implementation\n');
  console.log('=' .repeat(70));
  
  let allPassed = true;
  const results: RouteCheck[] = [];
  
  routeFiles.forEach(file => {
    const result = checkRouteFile(file);
    results.push(result);
    
    const expected = expectedMiddleware[file] || [];
    const allMiddlewarePresent = expected.every((m: string) => result.routes.includes(m));
    
    console.log(`\n📄 ${file}`);
    console.log(`   Import: ${result.hasImport ? '✅' : '❌'}`);
    console.log(`   Middleware Applied: ${result.hasMiddleware ? '✅' : '❌'}`);
    
    if (result.routes.length > 0) {
      console.log(`   Routes with logging:`);
      result.routes.forEach(route => {
        console.log(`     - ${route}`);
      });
    }
    
    if (!result.hasImport || !allMiddlewarePresent) {
      allPassed = false;
      console.log(`   ⚠️  Missing middleware: ${expected.filter((m: string) => !result.routes.includes(m)).join(', ')}`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  
  if (allPassed) {
    console.log('\n✅ All route files have activity logging middleware properly applied!');
    console.log('\nSummary:');
    console.log(`  - Place routes: ${expectedMiddleware['places.ts'].length} operations logged`);
    console.log(`  - Day routes: ${expectedMiddleware['days.ts'].length} operations logged`);
    console.log(`  - Packing routes: ${expectedMiddleware['packingRoutes.ts'].length} operations logged`);
    console.log(`  - Collaborator routes: ${expectedMiddleware['collaborators.ts'].length} operations logged`);
    console.log(`  - Story routes: ${expectedMiddleware['stories.ts'].length} operations logged`);
    console.log(`\n  Total: ${Object.values(expectedMiddleware).flat().length} operations with activity logging`);
  } else {
    console.log('\n❌ Some route files are missing activity logging middleware');
    process.exit(1);
  }
  
  console.log('\n📝 Note: Shopping routes do not exist yet, so shopping item logging is not applied.');
  console.log('   The middleware helpers are ready for when shopping routes are implemented.\n');
}

main();
