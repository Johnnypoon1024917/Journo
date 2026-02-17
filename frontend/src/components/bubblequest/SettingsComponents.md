# Settings Components

This document describes the Settings screen components for the BubbleQuest UI redesign.

## Overview

The Settings components allow users to customize their app experience with theme colors, font sizes, dark mode, animations, and language preferences. All changes are applied immediately with live preview.

## Components

### 1. ThemeCustomization

Allows users to customize the app's theme color.

**Features:**
- 6 preset color circles (Pink, Orange, Blue, Teal, Purple, Yellow)
- Custom color picker with HexColorPicker
- Live preview of theme changes
- Selected color highlighting
- Touch-optimized with 44px minimum targets

**Props:**
```typescript
interface ThemeCustomizationProps {
  className?: string;
}
```

**Usage:**
```tsx
import { ThemeCustomization } from '@/components/bubblequest';

<ThemeCustomization />
```

**Requirements:** 6.1, 6.2, 6.6

---

### 2. FontSizeSlider

A slider for adjusting the app's font size.

**Features:**
- Slider ranging from 12px to 24px
- Default at 16px
- Live preview of font size changes
- Visual size indicators (Small, Default, Large, Extra Large)
- Reset button when not at default
- Touch-optimized

**Props:**
```typescript
interface FontSizeSliderProps {
  className?: string;
}
```

**Usage:**
```tsx
import { FontSizeSlider } from '@/components/bubblequest';

<FontSizeSlider />
```

**Requirements:** 6.3

---

### 3. DarkModeToggle

A toggle switch for enabling/disabling dark mode.

**Features:**
- Toggle switch with smooth animation
- Apply dark mode immediately
- Sun/Moon icons for visual feedback
- Touch-optimized with 44px minimum target
- Animated transition between states

**Props:**
```typescript
interface DarkModeToggleProps {
  className?: string;
}
```

**Usage:**
```tsx
import { DarkModeToggle } from '@/components/bubblequest';

<DarkModeToggle />
```

**Requirements:** 6.4

---

### 4. AnimationSelector

Allows users to select particle animation effects.

**Features:**
- Options for none, snow, sakura
- Visual cards with icons
- Preview descriptions for each animation type
- Selected state highlighting
- Performance note for active animations
- Touch-optimized

**Props:**
```typescript
interface AnimationSelectorProps {
  className?: string;
}
```

**Usage:**
```tsx
import { AnimationSelector } from '@/components/bubblequest';

<AnimationSelector />
```

**Requirements:** 6.5

---

### 5. LanguageSelector

A dropdown selector for changing the app's language.

**Features:**
- Dropdown with supported languages (English, Traditional Chinese, Simplified Chinese, Japanese)
- Apply language change immediately
- Flag icons for visual identification
- Current language highlighting
- Touch-optimized
- Closes on outside click

**Props:**
```typescript
interface LanguageSelectorProps {
  className?: string;
}
```

**Usage:**
```tsx
import { LanguageSelector } from '@/components/bubblequest';

<LanguageSelector />
```

**Requirements:** 20.1, 20.3

---

## State Management

All Settings components use the `useBubbleQuestThemeStore` Zustand store for state management:

```typescript
import { useBubbleQuestThemeStore } from '@/stores/bubbleQuestThemeStore';

const {
  primaryColor,
  fontSize,
  darkMode,
  animations,
  setPrimaryColor,
  setFontSize,
  setDarkMode,
  setAnimations,
} = useBubbleQuestThemeStore();
```

The LanguageSelector uses `react-i18next` for internationalization:

```typescript
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
i18n.changeLanguage('zh-TW');
```

## Live Preview

All Settings components provide immediate feedback:

- **Theme changes** are applied instantly via CSS custom properties
- **Font size changes** update the root font size immediately
- **Dark mode** toggles the `dark` class on the document root
- **Animation changes** update the animation type in the store
- **Language changes** update all UI text immediately

## Persistence

Settings are automatically persisted to localStorage via Zustand's persist middleware:

- Theme settings: `bubblequest-theme-settings`
- Language: `i18nextLng`

## Accessibility

All components follow accessibility best practices:

- Minimum 44px touch targets
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader support

## Testing

Comprehensive unit tests are available in `__tests__/SettingsComponents.test.tsx`:

- Component rendering
- User interactions
- State management
- Integration between components
- Accessibility attributes

Run tests:
```bash
npm test -- src/components/bubblequest/__tests__/SettingsComponents.test.tsx
```

## Dependencies

- `react-colorful`: Color picker component
- `framer-motion`: Animations
- `react-i18next`: Internationalization
- `zustand`: State management

## Example: Complete Settings Screen

```tsx
import {
  ThemeCustomization,
  FontSizeSlider,
  DarkModeToggle,
  AnimationSelector,
  LanguageSelector,
} from '@/components/bubblequest';

function SettingsScreen() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <ThemeCustomization />
      <FontSizeSlider />
      <DarkModeToggle />
      <AnimationSelector />
      <LanguageSelector />
    </div>
  );
}
```

## Design Tokens

Components use kawaii design tokens from `@/design-system/bubblequest-tokens`:

- Colors: `kawaiiColors`, `kawaiiThemePresets`
- Typography: `kawaiiTypography`
- Spacing: `kawaiiSpacing`
- Animations: `kawaiiAnimations`
- Shadows: `kawaiiShadows`
- Border Radius: `kawaiiBorderRadius`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Android Chrome 90+
- Progressive enhancement for older browsers
