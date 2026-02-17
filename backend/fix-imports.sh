#!/bin/bash

echo "🔧 Fixing ES module imports by adding .js extensions..."
echo ""

# Find all .ts files in src/ and add .js to relative imports
find src -name "*.ts" -type f | while read file; do
    # Skip test files
    if [[ $file == *".test.ts" ]] || [[ $file == *"__tests__"* ]]; then
        continue
    fi
    
    # Add .js to imports that don't have it
    # Match: from './something' or from '../something' or from '@/something'
    # Don't match: from 'express' or from '@types/...'
    sed -i '' -E "s/from '(\\.\\.\\/|\\.\\/)([^']+)'/from '\\1\\2.js'/g" "$file"
    sed -i '' -E "s/from \"(\\.\\.\\/|\\.\\/)([^\"]+)\"/from \"\\1\\2.js\"/g" "$file"
    
    # Fix double .js.js if it was already added
    sed -i '' -E "s/\\.js\\.js/.js/g" "$file"
    
    echo "✓ Fixed: $file"
done

echo ""
echo "✅ Import fixes complete!"
echo ""
echo "Now rebuilding..."
npm run build
