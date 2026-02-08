# Implementation Kickoff - New UI Design

**Start Date**: January 31, 2026  
**Target Completion**: March 21, 2026 (7 weeks)

## 🎯 Immediate Actions (Today)

### 1. Review Design Specification ✅
- [x] Analyzed all 5 design images
- [x] Documented all features and components
- [x] Created comprehensive specification
- [x] Defined color palette and design tokens

### 2. Prepare Development Environment

```bash
# 1. Create a new branch for UI redesign
git checkout -b feature/new-ui-design

# 2. Install additional dependencies
cd frontend
npm install framer-motion          # For animations
npm install react-colorful         # For color picker
npm install date-fns               # For date handling
npm install @heroicons/react       # For icons (if not already installed)

# 3. Create design system structure
mkdir -p src/design-system/{tokens,theme,assets/illustrations}
mkdir -p src/components/ui/{Button,Card,Input,Navigation,Modal}
mkdir -p src/components/{schedule,booking,shopping,settings}
```

### 3. Set Up Design Tokens

Create the foundation files:

**File**: `frontend/src/design-system/tokens/colors.ts`
```typescript
export const colors = {
  primary: {
    50: '#FFF5F5',
    100: '#FFE5E5',
    200: '#FFCCCC',
    300: '#FFB3B3',
    400: '#FF9999',
    500: '#FF8080',
    600: '#FF6B6B',
    700: '#FF5252',
    800: '#FF3838',
    900: '#FF1F1F',
  },
  themeOptions: {
    orange: '#F4A460',
    blue: '#6B9BD1',
    teal: '#7ECEC4',
    pink: '#FFB3BA',
    purple: '#C5B3E6',
    yellow: '#FFD97D',
  },
  neutral: {
    50: '#FFFBF5',
    100: '#FFF8F0',
    200: '#F5F0E8',
    300: '#E8E0D5',
    400: '#D4C4B0',
    500: '#B8A890',
    600: '#9C8C70',
    700: '#7A6F5D',
    800: '#5C5449',
    900: '#3D3935',
  },
  success: '#7ECEC4',
  warning: '#FFD97D',
  error: '#FF6B6B',
  info: '#6B9BD1',
};
```

## 📋 Week 1 Detailed Tasks

### Day 1-2: Design System Foundation

#### Task 1.1: Color System
- [ ] Create `colors.ts` with full palette
- [ ] Update `tailwind.config.js` with new colors
- [ ] Test color accessibility (contrast ratios)
- [ ] Create color documentation

#### Task 1.2: Typography System
- [ ] Add Noto Sans TC font
- [ ] Create `typography.ts` with font scales
- [ ] Update Tailwind typography config
- [ ] Test font rendering

#### Task 1.3: Spacing & Layout
- [ ] Create `spacing.ts` with spacing scale
- [ ] Create `shadows.ts` with shadow system
- [ ] Update Tailwind config
- [ ] Document spacing usage

### Day 3-4: Theme Provider

#### Task 1.4: Theme Context
```typescript
// frontend/src/design-system/theme/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  primaryColor: string;
  fontSize: number;
  darkMode: boolean;
  animations: 'none' | 'snow' | 'sakura';
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setDarkMode: (enabled: boolean) => void;
  setAnimations: (type: 'none' | 'snow' | 'sakura') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#FFB3BA');
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [animations, setAnimations] = useState<'none' | 'snow' | 'sakura'>('none');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setPrimaryColor(settings.primaryColor || '#FFB3BA');
      setFontSize(settings.fontSize || 16);
      setDarkMode(settings.darkMode || false);
      setAnimations(settings.animations || 'none');
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('theme-settings', JSON.stringify({
      primaryColor,
      fontSize,
      darkMode,
      animations,
    }));
  }, [primaryColor, fontSize, darkMode, animations]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [primaryColor, fontSize, darkMode]);

  return (
    <ThemeContext.Provider value={{
      primaryColor,
      fontSize,
      darkMode,
      animations,
      setPrimaryColor,
      setFontSize,
      setDarkMode,
      setAnimations,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Day 5: Base Components

#### Task 1.5: Button Component
```typescript
// frontend/src/components/ui/Button/Button.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'rounded-full font-medium transition-all';
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};
```

#### Task 1.6: FAB Component
```typescript
// frontend/src/components/ui/Button/FAB.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';

interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-center';
}

export const FAB: React.FC<FABProps> = ({
  onClick,
  icon = <PlusIcon className="w-6 h-6" />,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-6',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      className={`fixed ${positionClasses[position]} w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full shadow-lg flex items-center justify-center text-white z-50`}
      onClick={onClick}
    >
      {icon}
    </motion.button>
  );
};
```

#### Task 1.7: Bottom Navigation
```typescript
// frontend/src/components/ui/Navigation/BottomNav.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarIcon,
  TicketIcon,
  WalletIcon,
  ShoppingBagIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
}

const navItems: NavItem[] = [
  { id: 'schedule', icon: CalendarIcon, label: '行程', route: '/schedule' },
  { id: 'booking', icon: TicketIcon, label: '預約', route: '/booking' },
  { id: 'budget', icon: WalletIcon, label: '記帳', route: '/budget' },
  { id: 'shopping', icon: ShoppingBagIcon, label: '購物', route: '/shopping' },
  { id: 'checklist', icon: ClipboardDocumentCheckIcon, label: '準備', route: '/checklist' },
  { id: 'members', icon: UsersIcon, label: '成員', route: '/members' },
  { id: 'settings', icon: Cog6ToothIcon, label: '設置', route: '/settings' },
];

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.route;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-primary-500' : 'text-neutral-400'}`} />
              <span className={`text-xs mt-1 ${isActive ? 'text-primary-500 font-medium' : 'text-neutral-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
```

## 🚀 Getting Started Commands

```bash
# 1. Switch to new branch
git checkout -b feature/new-ui-design

# 2. Install dependencies
cd frontend
npm install framer-motion react-colorful date-fns

# 3. Create directory structure
mkdir -p src/design-system/tokens
mkdir -p src/design-system/theme
mkdir -p src/design-system/assets/illustrations
mkdir -p src/components/ui/Button
mkdir -p src/components/ui/Card
mkdir -p src/components/ui/Input
mkdir -p src/components/ui/Navigation
mkdir -p src/components/ui/Modal
mkdir -p src/components/schedule
mkdir -p src/components/booking
mkdir -p src/components/shopping
mkdir -p src/components/settings

# 4. Start development server
npm run dev
```

## 📝 Daily Checklist Template

### Day 1
- [ ] Create color tokens file
- [ ] Update Tailwind config with new colors
- [ ] Test color system
- [ ] Commit: "feat: add new color system"

### Day 2
- [ ] Add Noto Sans TC font
- [ ] Create typography tokens
- [ ] Update Tailwind typography
- [ ] Commit: "feat: add typography system"

### Day 3
- [ ] Create ThemeProvider component
- [ ] Create useTheme hook
- [ ] Add theme persistence
- [ ] Commit: "feat: add theme provider"

### Day 4
- [ ] Integrate ThemeProvider in App.tsx
- [ ] Test theme switching
- [ ] Add theme documentation
- [ ] Commit: "feat: integrate theme system"

### Day 5
- [ ] Create Button component
- [ ] Create FAB component
- [ ] Create BottomNav component
- [ ] Commit: "feat: add base UI components"

## 🎨 Design Assets Needed

### Illustrations
Request from designer:
- [ ] Character illustrations (various poses)
- [ ] Travel-themed icons (plane, train, hotel, etc.)
- [ ] Decorative elements (dots, patterns)
- [ ] Loading animations
- [ ] Empty state illustrations

### Icons
- [ ] Custom icon set (if not using Heroicons)
- [ ] Tab bar icons
- [ ] Action icons
- [ ] Status icons

### Images
- [ ] Placeholder images for items
- [ ] Background patterns
- [ ] Gradient overlays

## 📊 Progress Tracking

### Week 1 Progress
- [ ] Day 1: Color system (0%)
- [ ] Day 2: Typography system (0%)
- [ ] Day 3: Theme provider (0%)
- [ ] Day 4: Theme integration (0%)
- [ ] Day 5: Base components (0%)

### Blockers
- None currently

### Questions
- None currently

## 🔗 Resources

### Documentation
- [Full Design Spec](./NEW_UI_DESIGN_SPEC.md)
- [Current Project Status](./CURRENT_PROJECT_STATUS.md)
- [UI Redesign Preparation](./UI_REDESIGN_PREPARATION.md)

### External Resources
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/)
- [React Colorful](https://github.com/omgovich/react-colorful)

## 🎯 Success Criteria for Week 1

- [ ] Design system tokens created
- [ ] Theme provider working
- [ ] Base components created
- [ ] Bottom navigation functional
- [ ] FAB component working
- [ ] Colors and typography applied
- [ ] No TypeScript errors
- [ ] All tests passing

---

**Status**: 🚀 Ready to Start  
**Next Review**: End of Week 1  
**Team**: Ready to implement
