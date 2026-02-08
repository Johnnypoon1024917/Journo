# New UI Design Implementation Specification

**Date**: January 31, 2026  
**Status**: Ready for Implementation  
**Priority**: High

## Overview

Implementation of a new kawaii-style UI design for the Journo travel platform. The design features:
- Soft pink/coral color scheme
- Cute character illustrations
- Rounded, card-based layouts
- Playful, friendly aesthetic
- Bottom navigation bar
- Floating action button (FAB)

## Design Analysis from Images

### Image 1: Settings/Theme Customization
**Features Identified:**
- Theme color selection (6 color options)
- Custom color picker with slider
- Font size adjustment (16px default)
- Dark mode toggle
- Animation effects toggle (None/Snow)
- Bottom navigation: Schedule, Booking, Budget, Shopping, Checklist, Members, Settings

### Image 2: Booking Management (預約管理)
**Features Identified:**
- Boarding pass style cards
- Flight information display (HKG → KIX, NRT → HKG)
- Departure/arrival times
- Flight numbers and dates
- Accommodation counter (3 stays)
- Cute cat illustrations
- "+ New" button for adding bookings
- Category tabs (Tickets: 2, Accommodation: 3)

### Image 3: Trip Timeline/Schedule
**Features Identified:**
- Countdown timer to departure (6 days, 00:38:04)
- Progress bar with plane icon
- Date selector (Wed 14 - Sun 18)
- Weather widget (12°C, cloudy)
- Daily itinerary cards
- Hotel information
- Activity schedule with times
- Location pins
- Day-by-day breakdown

### Image 4: Sticker/Avatar Selection
**Features Identified:**
- Grid layout of cute character stickers
- Various travel-themed illustrations
- Modal overlay design
- Close button
- "Manage" option

### Image 5: Shopping List (購物清單)
**Features Identified:**
- Item counter (8 to buy, 0 bought)
- Character illustrations for categories
- Checkboxes for items
- Product images
- Tags (一般, 寄食, 服飾, 重要, 其他)
- Store names
- Three-dot menu for options
- Filter dropdown (全部 8)

## Design System Specification

### Color Palette

#### Primary Colors
```typescript
colors: {
  primary: {
    50: '#FFF5F5',   // Lightest pink
    100: '#FFE5E5',  // Very light pink
    200: '#FFCCCC',  // Light pink
    300: '#FFB3B3',  // Soft pink
    400: '#FF9999',  // Medium pink
    500: '#FF8080',  // Main pink (primary)
    600: '#FF6B6B',  // Darker pink
    700: '#FF5252',  // Deep pink
    800: '#FF3838',  // Very deep pink
    900: '#FF1F1F',  // Darkest pink
  },
  
  // Theme color options (from image 1)
  themeOptions: {
    orange: '#F4A460',
    blue: '#6B9BD1',
    teal: '#7ECEC4',
    pink: '#FFB3BA',    // Default
    purple: '#C5B3E6',
    yellow: '#FFD97D',
  },
  
  // Neutral colors
  neutral: {
    50: '#FFFBF5',   // Cream white
    100: '#FFF8F0',  // Light cream
    200: '#F5F0E8',  // Beige
    300: '#E8E0D5',  // Light tan
    400: '#D4C4B0',  // Tan
    500: '#B8A890',  // Medium tan
    600: '#9C8C70',  // Dark tan
    700: '#7A6F5D',  // Brown
    800: '#5C5449',  // Dark brown
    900: '#3D3935',  // Very dark brown
  },
  
  // Semantic colors
  success: '#7ECEC4',  // Teal
  warning: '#FFD97D',  // Yellow
  error: '#FF6B6B',    // Red
  info: '#6B9BD1',     // Blue
}
```

### Typography

```typescript
fontFamily: {
  sans: ['Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'sans-serif'],
  display: ['Noto Sans TC', 'sans-serif'],
}

fontSize: {
  xs: '12px',
  sm: '14px',
  base: '16px',    // Default from image
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px',
}

fontWeight: {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}
```

### Spacing & Layout

```typescript
spacing: {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
}

borderRadius: {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
}

shadows: {
  sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
  md: '0 4px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.12)',
}
```

## Component Specifications

### 1. Bottom Navigation Bar

**Design**: Fixed bottom navigation with 7 tabs + FAB

```typescript
interface BottomNavItem {
  id: string;
  icon: IconComponent;
  label: string;
  route: string;
  badge?: number;
}

const navItems: BottomNavItem[] = [
  { id: 'schedule', icon: CalendarIcon, label: '行程', route: '/schedule' },
  { id: 'booking', icon: TicketIcon, label: '預約', route: '/booking' },
  { id: 'budget', icon: WalletIcon, label: '記帳', route: '/budget' },
  { id: 'shopping', icon: ShoppingIcon, label: '購物', route: '/shopping' },
  { id: 'checklist', icon: ChecklistIcon, label: '準備', route: '/checklist' },
  { id: 'members', icon: UsersIcon, label: '成員', route: '/members' },
  { id: 'settings', icon: SettingsIcon, label: '設置', route: '/settings' },
];
```

**Styling**:
- Height: 64px
- Background: White with subtle shadow
- Active state: Pink color
- Icons: 24x24px
- Labels: 12px font size

### 2. Boarding Pass Card

**Design**: Large card with gradient background

```typescript
interface BoardingPass {
  type: 'flight' | 'train';
  origin: {
    code: string;
    time: string;
  };
  destination: {
    code: string;
    time: string;
  };
  flightNumber: string;
  date: string;
  route: string; // e.g., "香港 → 大阪"
}
```

**Styling**:
- Background: Pink gradient (#FFB3BA to #FF9999)
- Border radius: 16px
- Padding: 20px
- White text
- Decorative elements (dots, plane icon)
- Three-dot menu (top right)

### 3. Day Card (Schedule)

**Design**: Expandable card showing daily itinerary

```typescript
interface DayCard {
  date: Date;
  dayNumber: number;
  location: string;
  weather: {
    temp: number;
    condition: string;
    icon: string;
  };
  hotel?: {
    name: string;
    icon: string;
  };
  activities: Activity[];
  route?: string[]; // e.g., ["難波", "梅田", "天滿"]
}

interface Activity {
  time: string;
  location: string;
  icon: string;
  notes?: string;
}
```

**Styling**:
- Background: Cream white (#FFFBF5)
- Border radius: 16px
- Padding: 16px
- Cute character illustration (top right)
- Checkmarks for completed routes
- Drag handle for reordering

### 4. Shopping List Item

**Design**: Card with checkbox, image, and tags

```typescript
interface ShoppingItem {
  id: string;
  name: string;
  store?: string;
  image?: string;
  tags: ShoppingTag[];
  checked: boolean;
  priority?: 'normal' | 'important';
}

type ShoppingTag = '一般' | '寄食' | '服飾' | '重要' | '其他';
```

**Styling**:
- Background: White
- Border radius: 12px
- Padding: 12px
- Checkbox: Left side
- Image: 60x60px, rounded
- Tags: Small pills with different colors
- Three-dot menu: Right side

### 5. Floating Action Button (FAB)

**Design**: Circular button with icon

```typescript
interface FABProps {
  icon: IconComponent;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-center';
  color?: string;
}
```

**Styling**:
- Size: 56x56px
- Background: Pink gradient
- Shadow: Large shadow for elevation
- Icon: White, 24x24px
- Position: Fixed, bottom-right
- Animation: Subtle pulse/bounce

### 6. Date Selector

**Design**: Horizontal scrollable date pills

```typescript
interface DatePill {
  date: Date;
  dayOfWeek: string;
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
}
```

**Styling**:
- Pill size: 60x60px
- Border radius: 12px
- Selected: Pink background
- Unselected: White background
- Text: Day of week (small), Date (large)

### 7. Weather Widget

**Design**: Compact weather display

```typescript
interface WeatherWidget {
  temperature: number;
  feelsLike: number;
  condition: string;
  location: string;
  icon: string;
}
```

**Styling**:
- Background: White
- Border radius: 12px
- Padding: 12px
- Icon: Left side, colored
- Temperature: Large text
- Condition: Small text, right side

### 8. Countdown Timer

**Design**: Trip countdown with progress bar

```typescript
interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  departureDate: Date;
  progress: number; // 0-100
}
```

**Styling**:
- Background: Cream white
- Border radius: 12px
- Large pink numbers
- Progress bar with plane icon
- Departure date below

### 9. Theme Customization Panel

**Design**: Settings panel with color picker

```typescript
interface ThemeSettings {
  primaryColor: string;
  customColor?: string;
  fontSize: number; // 12-24px
  darkMode: boolean;
  animations: 'none' | 'snow' | 'sakura';
}
```

**Styling**:
- Color circles: 48x48px
- Selected: Border highlight
- Slider: Custom pink track
- Toggle switches: Pink when active

### 10. Sticker Selector Modal

**Design**: Grid of selectable stickers

```typescript
interface StickerModal {
  stickers: Sticker[];
  selectedSticker?: string;
  onSelect: (stickerId: string) => void;
  onClose: () => void;
}

interface Sticker {
  id: string;
  image: string;
  category: string;
}
```

**Styling**:
- Modal: Centered, rounded corners
- Grid: 4 columns
- Sticker size: 80x80px
- Padding: 8px between items
- Background: White
- Close button: Top right

## Screen Specifications

### 1. Schedule Screen (行程)

**Layout**:
```
┌─────────────────────────┐
│ Countdown Timer         │
├─────────────────────────┤
│ Date Selector (scroll)  │
├─────────────────────────┤
│ Weather Widget          │
├─────────────────────────┤
│ Day 1 Card              │
│  - Hotel                │
│  - Activities           │
├─────────────────────────┤
│ Day 2 Card              │
│  ...                    │
└─────────────────────────┘
```

**Features**:
- Pull to refresh
- Swipe between days
- Drag to reorder activities
- Tap to expand/collapse
- FAB to add new activity

### 2. Booking Screen (預約)

**Layout**:
```
┌─────────────────────────┐
│ Header: 預約管理         │
│ Subtitle + Illustration │
│ [+ 新增] Button         │
├─────────────────────────┤
│ Tabs: 機票(2) 住宿(3)   │
├─────────────────────────┤
│ Boarding Pass Card 1    │
├─────────────────────────┤
│ Boarding Pass Card 2    │
├─────────────────────────┤
│ ...                     │
└─────────────────────────┘
```

**Features**:
- Tab switching
- Swipe to delete
- Tap to view details
- Three-dot menu for options
- Add new booking

### 3. Shopping Screen (購物)

**Layout**:
```
┌─────────────────────────┐
│ Header: 購物清單         │
│ Subtitle + Illustration │
│ [+ 新增] Button         │
├─────────────────────────┤
│ Stats: 8 待購買 | 0 已購買│
├─────────────────────────┤
│ Filter: 全部(8) ▼       │
├─────────────────────────┤
│ Shopping Item 1         │
├─────────────────────────┤
│ Shopping Item 2         │
├─────────────────────────┤
│ ...                     │
└─────────────────────────┘
```

**Features**:
- Checkbox to mark as bought
- Filter by category
- Sort options
- Swipe actions
- Add new item

### 4. Settings Screen (設置)

**Layout**:
```
┌─────────────────────────┐
│ Theme Color Section     │
│  - 6 color options      │
│  - Custom color picker  │
├─────────────────────────┤
│ Font Size Section       │
│  - Slider (12-24px)     │
├─────────────────────────┤
│ Dark Mode Section       │
│  - Toggle switch        │
├─────────────────────────┤
│ Animation Section       │
│  - None / Snow options  │
└─────────────────────────┘
```

**Features**:
- Live preview of changes
- Save/Apply button
- Reset to default
- Theme persistence

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Design System Setup
```bash
frontend/src/design-system/
├── tokens/
│   ├── colors.ts          # Color palette
│   ├── typography.ts      # Font system
│   ├── spacing.ts         # Spacing scale
│   └── shadows.ts         # Shadow system
├── theme/
│   ├── ThemeProvider.tsx  # Theme context
│   ├── useTheme.ts        # Theme hook
│   └── themes.ts          # Theme presets
└── assets/
    ├── illustrations/     # Cute character SVGs
    └── icons/            # Custom icons
```

**Tasks**:
- [ ] Create color token system
- [ ] Set up typography scale
- [ ] Configure Tailwind with new colors
- [ ] Create theme provider
- [ ] Add illustration assets
- [ ] Create custom icon set

#### 1.2 Base Components
```bash
frontend/src/components/ui/
├── Button/
│   ├── Button.tsx
│   ├── FAB.tsx
│   └── IconButton.tsx
├── Card/
│   ├── Card.tsx
│   ├── BoardingPassCard.tsx
│   └── DayCard.tsx
├── Input/
│   ├── Input.tsx
│   ├── Checkbox.tsx
│   └── Slider.tsx
├── Navigation/
│   ├── BottomNav.tsx
│   └── TabBar.tsx
└── Modal/
    ├── Modal.tsx
    └── BottomSheet.tsx
```

**Tasks**:
- [ ] Create Button component with variants
- [ ] Create FAB component
- [ ] Create Card components
- [ ] Create Input components
- [ ] Create Navigation components
- [ ] Create Modal components

### Phase 2: Core Screens (Week 2)

#### 2.1 Schedule Screen
**File**: `frontend/src/pages/Schedule.tsx`

**Components to Create**:
- CountdownTimer
- DateSelector
- WeatherWidget
- DayCard
- ActivityItem

**API Integration**:
- GET `/api/trips/:id` - Get trip details
- GET `/api/trips/:id/days` - Get daily schedule
- PUT `/api/days/:id` - Update day
- POST `/api/days/:id/places` - Add activity
- PUT `/api/places/:id` - Update activity
- DELETE `/api/places/:id` - Delete activity

**Features**:
- Countdown to departure
- Date navigation
- Weather display
- Drag-and-drop activities
- Add/edit/delete activities
- Hotel information
- Route checkmarks

#### 2.2 Booking Screen
**File**: `frontend/src/pages/Booking.tsx`

**Components to Create**:
- BookingHeader
- BoardingPassCard
- AccommodationCard
- BookingTabs

**API Integration**:
- GET `/api/trips/:id/bookings` - Get all bookings
- POST `/api/trips/:id/bookings` - Add booking
- PUT `/api/bookings/:id` - Update booking
- DELETE `/api/bookings/:id` - Delete booking

**Features**:
- Flight/train bookings
- Accommodation bookings
- Tab switching
- Add new booking
- Edit booking details
- Delete booking

#### 2.3 Shopping Screen
**File**: `frontend/src/pages/Shopping.tsx`

**Components to Create**:
- ShoppingHeader
- ShoppingStats
- ShoppingItem
- FilterDropdown

**API Integration**:
- GET `/api/trips/:id/shopping` - Get shopping list
- POST `/api/trips/:id/shopping` - Add item
- PUT `/api/shopping/:id` - Update item
- DELETE `/api/shopping/:id` - Delete item

**Features**:
- Item list with images
- Checkbox to mark bought
- Category tags
- Filter by category
- Add new item
- Edit item details

### Phase 3: Additional Screens (Week 3)

#### 3.1 Budget Screen (記帳)
**File**: `frontend/src/pages/Budget.tsx`

**Features**:
- Expense tracking
- Category breakdown
- Currency conversion
- Budget vs actual
- Charts and graphs

#### 3.2 Checklist Screen (準備)
**File**: `frontend/src/pages/Checklist.tsx`

**Features**:
- Packing list
- Document checklist
- Pre-trip tasks
- Progress tracking

#### 3.3 Members Screen (成員)
**File**: `frontend/src/pages/Members.tsx`

**Features**:
- Collaborator list
- Invite members
- Permission management
- Member avatars

#### 3.4 Settings Screen (設置)
**File**: `frontend/src/pages/Settings.tsx`

**Features**:
- Theme customization
- Font size adjustment
- Dark mode toggle
- Animation effects
- Language selection
- Account settings

### Phase 4: Polish & Animations (Week 4)

#### 4.1 Animations
```typescript
// Entrance animations
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

// Card animations
const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2 }
};

// FAB animations
const fabPulse = {
  scale: [1, 1.1, 1],
  transition: { repeat: Infinity, duration: 2 }
};

// Snow animation (optional)
const snowfall = {
  // Particle system for snow effect
};
```

**Tasks**:
- [ ] Add page transitions
- [ ] Add card animations
- [ ] Add button feedback
- [ ] Add loading states
- [ ] Add success animations
- [ ] Add snow effect (optional)

#### 4.2 Illustrations
**Tasks**:
- [ ] Add character illustrations to each screen
- [ ] Create illustration variants
- [ ] Add decorative elements
- [ ] Ensure consistent style

#### 4.3 Responsive Design
**Breakpoints**:
- Mobile: 320px - 767px (primary)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Tasks**:
- [ ] Test on various screen sizes
- [ ] Adjust layouts for tablet
- [ ] Create desktop layouts
- [ ] Test touch interactions

### Phase 5: Web Optimization (Week 5)

#### 5.1 Desktop Layout
**Changes for Desktop**:
- Side navigation instead of bottom nav
- Multi-column layouts
- Larger cards
- Hover states
- Keyboard shortcuts

**Layout**:
```
┌──────┬─────────────────────┐
│      │                     │
│ Side │   Main Content      │
│ Nav  │                     │
│      │                     │
│      │                     │
└──────┴─────────────────────┘
```

#### 5.2 Tablet Layout
**Changes for Tablet**:
- Hybrid navigation (side + bottom)
- Two-column layouts
- Larger touch targets
- Split views

### Phase 6: iOS Preparation (Week 6)

#### 6.1 iOS-Specific Features
- [ ] Safe area handling
- [ ] iOS gestures (swipe back)
- [ ] iOS keyboard handling
- [ ] iOS status bar styling
- [ ] iOS haptic feedback
- [ ] iOS share sheet integration

#### 6.2 React Native Setup
```bash
# Create React Native app
npx react-native init JournoMobile

# Install dependencies
npm install @react-navigation/native
npm install @react-navigation/bottom-tabs
npm install react-native-gesture-handler
npm install react-native-reanimated
```

### Phase 7: Android Preparation (Week 7)

#### 7.1 Android-Specific Features
- [ ] Material Design adaptations
- [ ] Android back button handling
- [ ] Android keyboard handling
- [ ] Android status bar styling
- [ ] Android share intent
- [ ] Android notifications

## API Requirements

### New Endpoints Needed

#### Bookings API
```typescript
// GET /api/trips/:tripId/bookings
interface BookingsResponse {
  flights: FlightBooking[];
  accommodations: AccommodationBooking[];
  trains: TrainBooking[];
}

// POST /api/trips/:tripId/bookings
interface CreateBookingRequest {
  type: 'flight' | 'accommodation' | 'train';
  data: FlightData | AccommodationData | TrainData;
}
```

#### Shopping API
```typescript
// GET /api/trips/:tripId/shopping
interface ShoppingListResponse {
  items: ShoppingItem[];
  stats: {
    toBuy: number;
    bought: number;
  };
}

// POST /api/trips/:tripId/shopping
interface CreateShoppingItemRequest {
  name: string;
  store?: string;
  image?: string;
  tags: string[];
  priority?: string;
}
```

#### Theme API
```typescript
// GET /api/users/:userId/theme
interface ThemeResponse {
  primaryColor: string;
  fontSize: number;
  darkMode: boolean;
  animations: string;
}

// PUT /api/users/:userId/theme
interface UpdateThemeRequest {
  primaryColor?: string;
  fontSize?: number;
  darkMode?: boolean;
  animations?: string;
}
```

## File Structure

```
frontend/src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Navigation/
│   │   └── Modal/
│   ├── schedule/              # Schedule-specific components
│   │   ├── CountdownTimer.tsx
│   │   ├── DateSelector.tsx
│   │   ├── WeatherWidget.tsx
│   │   ├── DayCard.tsx
│   │   └── ActivityItem.tsx
│   ├── booking/               # Booking-specific components
│   │   ├── BoardingPassCard.tsx
│   │   ├── AccommodationCard.tsx
│   │   └── BookingTabs.tsx
│   ├── shopping/              # Shopping-specific components
│   │   ├── ShoppingItem.tsx
│   │   ├── ShoppingStats.tsx
│   │   └── FilterDropdown.tsx
│   └── settings/              # Settings-specific components
│       ├── ThemeSelector.tsx
│       ├── FontSizeSlider.tsx
│       └── AnimationToggle.tsx
├── pages/
│   ├── Schedule.tsx
│   ├── Booking.tsx
│   ├── Budget.tsx
│   ├── Shopping.tsx
│   ├── Checklist.tsx
│   ├── Members.tsx
│   └── Settings.tsx
├── design-system/
│   ├── tokens/
│   ├── theme/
│   └── assets/
├── services/
│   ├── api/
│   │   ├── bookings.ts
│   │   ├── shopping.ts
│   │   └── theme.ts
│   └── ...existing services
├── stores/
│   ├── themeStore.ts
│   ├── bookingStore.ts
│   └── shoppingStore.ts
└── utils/
    ├── animations.ts
    └── illustrations.ts
```

## Testing Strategy

### Unit Tests
- [ ] Component rendering
- [ ] User interactions
- [ ] State management
- [ ] API calls

### Integration Tests
- [ ] Screen navigation
- [ ] Data flow
- [ ] API integration
- [ ] Theme switching

### E2E Tests
- [ ] Complete user flows
- [ ] Cross-screen interactions
- [ ] Offline functionality
- [ ] Performance testing

## Success Metrics

### User Experience
- [ ] Smooth 60fps animations
- [ ] < 100ms interaction response
- [ ] Intuitive navigation
- [ ] Consistent design language

### Performance
- [ ] < 2s initial load time
- [ ] < 500ms screen transitions
- [ ] < 50MB bundle size
- [ ] 90+ Lighthouse score

### Functionality
- [ ] All existing features work
- [ ] New features implemented
- [ ] No regressions
- [ ] Cross-platform compatibility

## Timeline Summary

- **Week 1**: Foundation & Design System
- **Week 2**: Core Screens (Schedule, Booking, Shopping)
- **Week 3**: Additional Screens (Budget, Checklist, Members, Settings)
- **Week 4**: Polish & Animations
- **Week 5**: Web Optimization
- **Week 6**: iOS Preparation
- **Week 7**: Android Preparation

**Total**: 7 weeks for complete implementation

## Next Steps

1. **Review this specification** with the team
2. **Gather illustration assets** from designer
3. **Set up design system** foundation
4. **Begin Phase 1 implementation**
5. **Weekly progress reviews**

---

**Status**: 📋 Ready for Implementation  
**Priority**: High  
**Estimated Duration**: 7 weeks
