#!/bin/bash

# Script to rename Kawaii to BubbleQuest throughout the codebase
# This script will:
# 1. Rename directories
# 2. Rename files
# 3. Update content in files

set -e

echo "🔄 Starting Kawaii → BubbleQuest rename process..."

# Step 1: Rename the main kawaii directory to bubblequest
echo "📁 Renaming directories..."
if [ -d "frontend/src/components/kawaii" ]; then
  git mv frontend/src/components/kawaii frontend/src/components/bubblequest
  echo "✅ Renamed frontend/src/components/kawaii → bubblequest"
fi

# Step 2: Rename kawaii theme store
if [ -f "frontend/src/stores/kawaiiThemeStore.ts" ]; then
  git mv frontend/src/stores/kawaiiThemeStore.ts frontend/src/stores/bubbleQuestThemeStore.ts
  echo "✅ Renamed kawaiiThemeStore.ts → bubbleQuestThemeStore.ts"
fi

# Step 3: Rename test files
if [ -f "frontend/src/stores/__tests__/kawaiiThemeStore.property.test.ts" ]; then
  git mv frontend/src/stores/__tests__/kawaiiThemeStore.property.test.ts frontend/src/stores/__tests__/bubbleQuestThemeStore.property.test.ts
  echo "✅ Renamed kawaiiThemeStore.property.test.ts"
fi

if [ -f "frontend/src/stores/__tests__/kawaiiThemeStore.darkMode.property.test.ts" ]; then
  git mv frontend/src/stores/__tests__/kawaiiThemeStore.darkMode.property.test.ts frontend/src/stores/__tests__/bubbleQuestThemeStore.darkMode.property.test.ts
  echo "✅ Renamed kawaiiThemeStore.darkMode.property.test.ts"
fi

# Step 4: Rename page files
echo "📄 Renaming page files..."
for file in frontend/src/pages/Kawaii*.tsx; do
  if [ -f "$file" ]; then
    newname=$(echo "$file" | sed 's/Kawaii/BubbleQuest/g')
    git mv "$file" "$newname"
    echo "✅ Renamed $(basename $file) → $(basename $newname)"
  fi
done

# Step 5: Rename locale files
echo "🌐 Renaming locale files..."
for lang in en ja zh-CN zh-TW; do
  if [ -f "frontend/src/locales/$lang/kawaii.json" ]; then
    git mv "frontend/src/locales/$lang/kawaii.json" "frontend/src/locales/$lang/bubbleQuest.json"
    echo "✅ Renamed $lang/kawaii.json → bubbleQuest.json"
  fi
done

# Step 6: Rename CSS files
if [ -f "frontend/src/design-system/centralizedKawaiiTheme.css" ]; then
  git mv frontend/src/design-system/centralizedKawaiiTheme.css frontend/src/design-system/centralizedBubbleQuestTheme.css
  echo "✅ Renamed centralizedKawaiiTheme.css"
fi

# Step 7: Rename files in bubblequest directory
echo "📦 Renaming component files..."
find frontend/src/components/bubblequest -type f -name "*awaii*" 2>/dev/null | while read file; do
  newname=$(echo "$file" | sed 's/[Kk]awaii/BubbleQuest/g')
  if [ "$file" != "$newname" ]; then
    git mv "$file" "$newname"
    echo "✅ Renamed $(basename $file) → $(basename $newname)"
  fi
done

echo "✅ File and directory renaming complete!"
echo ""
echo "⚠️  Next steps:"
echo "1. Run the content replacement script"
echo "2. Update imports and references"
echo "3. Test the application"
echo "4. Commit changes"
