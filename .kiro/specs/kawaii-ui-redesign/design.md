# Design Document: Kawaii UI Redesign

## Overview

This design document specifies the technical architecture and implementation approach for the kawaii-style UI redesign of the Journo travel platform. The redesign transforms the existing application into a nostalgic, joyful experience while maintaining all existing functionality and using the current backend APIs without modification.

### Design Principles

1. **Nostalgic Joy**: Recreate the childhood experience of decorating schedule books
2. **At-a-Glance Information**: Minimize navigation, maximize information density
3. **Touch-First**: Optimize for mobile with 44px minimum touch targets
4. **Performance**: Maintain 60fps animations and <2s load times
5. **Accessibility**: WCAG AA compliance with adjustable font sizes
6. **Progressive Enhancement**: Core functionality works without JavaScript animations

### Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom kawaii design tokens
- **Animation**: Framer Motion for component animations
- **State Management**: Zustand for theme and UI state
- **Internationalization**: react-i18next for multi-language support
- **File Upload**: react-dropzone for PDF uploads
- **Color Picker**: react-colorful for theme customization
- **Date Handling**: date-fns for date formatting and calculations
- **Icons**: Heroicons for consistent iconography

## Architecture

### Component Hierarchy

```
App
├── ThemeProvider (design-system/theme)
│   ├── Theme state management
│   ├── CSS custom properties injection
│   └── Dark mode handling
├── I18nProvider (i18n)
│   └── Language state and translations
├── AnimationProvider (components/animations)
│   └── Particle effects (snow, sakura)
├── Layout
│   ├── BottomNavigation (mobile)
│   ├── SideNavigation (desktop)
│   └── FAB (context-dependent)
└── Routes
    ├── ScheduleScreen
    │   ├── CountdownTimer
    │   ├── DateSelector
    │   ├── WeatherWidget
    │   └── DayCard[]
    │       ├── HotelInfo
    │       ├── FlightInfo
    │       └── ActivityItem[]
    ├── BookingScreen
    │   ├── BookingTabs
    │   ├── BoardingPassCard[]
    │   └── AccommodationCard[]
    ├── ShoppingScreen
    │   ├── ShoppingStats
    │   ├── FilterDropdown
    │   └── ShoppingItem[]
    ├── BudgetScreen
    │   ├── ExpenseSummary
    │   └── ExpenseItem[]
    ├── ChecklistScreen
    │   ├── ChecklistProgress
    │   └── ChecklistItem[]
    ├── MembersScreen
    │   └── MemberCard[]
    └── SettingsScreen
        ├── ThemeCustomization
        ├── FontSizeSlider
        ├── DarkModeToggle
        ├── AnimationSelector
        └── LanguageSelector
```

### State Management Architecture

```typescript
// Theme Store (Zustand)
interface ThemeStore {
  primaryColor: string;
  fontSize: number;
  darkMode: boolean;
  animations: 'none' | 'snow' | 'sakura';
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setDarkMode: (enabled: boolean) => void;
  setAnimations: (type: 'none' | 'snow' | 'sakura') => void;
  loadTheme: () => void;
  saveTheme: () => void;
}

// UI Store (Zustand)
interface UIStore {
  activeTab: string;
  selectedDate: Date;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  setActiveTab: (tab: string) => void;
  setSelectedDate: (date: Date) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

// Sticker Store (Zustand)
interface StickerStore {
  stickers: Sticker[];
  selectedSticker: string | null;
  loadStickers: (tripId: string) => Promise<void>;
  selectSticker: (stickerId: string) => void;
  attachSticker: (elementId: string, stickerId: string) => Promise<void>;
}
```

## Components and Interfaces

### Design System Components

#### 1. ThemeProvider

**Purpose**: Manages theme state and applies CSS custom properties

**Interface**:
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextValue {
  primaryColor: string;
  fontSize: number;
  darkMode: boolean;
  animations: 'none' | 'snow' | 'sakura';
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setDarkMode: (enabled: boolean) => void;
  setAnimations: (type: 'none' | 'snow' | 'sakura') => void;
}
```

**Behavior**:
- Loads theme from localStorage on mount
- Applies CSS custom properties to document root
- Persists changes to localStorage
- Provides theme context to all children

#### 2. Button Component

**Purpose**: Reusable button with kawaii styling and animations

**Interface**:
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}
```

**Variants**:
- `primary`: Filled with primary color, white text
- `secondary`: Neutral background, dark text
- `ghost`: Transparent background, primary text

**Animations**:
- Scale down on tap (0.95)
- Hover scale up (1.02)
- Disabled state with reduced opacity

#### 3. FAB (Floating Action Button)

**Purpose**: Primary action button that floats above content

**Interface**:
```typescript
interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-center';
  label?: string;
}
```

**Behavior**:
- Fixed positioning with z-index 50
- Gradient background with primary colors
- Pulse animation on idle
- Scale animation on tap
- Shows above bottom navigation (bottom: 80px)

#### 4. Card Component

**Purpose**: Container for content with kawaii styling

**Interface**:
```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}
```

**Variants**:
- `default`: White background, subtle shadow
- `elevated`: Larger shadow, hover lift effect
- `outlined`: Border instead of shadow

### Navigation Components

#### 5. BottomNavigation

**Purpose**: Fixed bottom navigation for mobile

**Interface**:
```typescript
interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
  badge?: number;
}
```

**Behavior**:
- Fixed at bottom with safe area insets
- 7 tabs with icons and labels
- Active tab highlighted with primary color
- Smooth transition animations
- Touch-optimized (44px minimum height)

#### 6. SideNavigation

**Purpose**: Side navigation for desktop/tablet

**Interface**:
```typescript
interface SideNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
}
```

**Behavior**:
- Fixed left side on desktop
- Collapsible with animation
- Larger icons and labels
- Hover effects

### Screen-Specific Components

#### 7. CountdownTimer

**Purpose**: Displays time remaining until trip departure

**Interface**:
```typescript
interface CountdownTimerProps {
  departureDate: Date;
  className?: string;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  progress: number; // 0-100
}
```

**Behavior**:
- Updates every second
- Shows days, hours, minutes, seconds
- Progress bar with plane icon
- Animated number transitions

#### 8. DayCard

**Purpose**: Displays all information for a single trip day

**Interface**:
```typescript
interface DayCardProps {
  day: TripDay;
  onActivityClick: (activity: Activity) => void;
  onActivityReorder: (activityId: string, newIndex: number) => void;
}

interface TripDay {
  date: Date;
  dayNumber: number;
  location: string;
  weather: WeatherInfo;
  hotel?: HotelInfo;
  flights: FlightInfo[];
  activities: Activity[];
  stickers: StickerPlacement[];
}
```

**Behavior**:
- Cream background with rounded corners
- Cute character illustration
- Drag-and-drop for activity reordering
- Tap to expand/collapse sections
- Google Maps integration for locations

#### 9. BoardingPassCard

**Purpose**: Displays flight/train booking in boarding pass style

**Interface**:
```typescript
interface BoardingPassCardProps {
  booking: FlightBooking;
  onEdit: () => void;
  onDelete: () => void;
}

interface FlightBooking {
  id: string;
  type: 'flight' | 'train';
  origin: {
    code: string;
    name: string;
    time: string;
  };
  destination: {
    code: string;
    name: string;
    time: string;
  };
  flightNumber: string;
  date: string;
  route: string;
}
```

**Behavior**:
- Pink gradient background
- White text with decorative elements
- Three-dot menu for actions
- Swipe to delete
- Tap to view details

#### 10. ShoppingItem

**Purpose**: Displays shopping list item with checkbox and image

**Interface**:
```typescript
interface ShoppingItemProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

interface ShoppingItem {
  id: string;
  name: string;
  store?: string;
  image?: string;
  tags: ShoppingTag[];
  checked: boolean;
  priority: 'normal' | 'important';
}

type ShoppingTag = '一般' | '寄食' | '服飾' | '重要' | '其他';
```

**Behavior**:
- Checkbox on left
- Image thumbnail (60x60px)
- Tags as colored pills
- Three-dot menu for actions
- Swipe to delete
- Strike-through when checked

### Animation Components

#### 11. ParticleSystem

**Purpose**: Renders snow or sakura particle effects

**Interface**:
```typescript
interface ParticleSystemProps {
  type: 'snow' | 'sakura';
  particleCount?: number;
  enabled: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  rotation: number;
}
```

**Behavior**:
- Generates particles off-screen
- Animates using requestAnimationFrame
- Pointer-events: none (doesn't block interactions)
- Respects reduced motion preferences
- Maintains 60fps performance

#### 12. StickerModal

**Purpose**: Modal for selecting and placing stickers

**Interface**:
```typescript
interface StickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (stickerId: string) => void;
  stickers: Sticker[];
  selectedSticker?: string;
}

interface Sticker {
  id: string;
  image: string;
  category: StickerCategory;
  tags: string[];
}

type StickerCategory = 
  | 'characters'
  | 'activities'
  | 'transportation'
  | 'food'
  | 'landmarks'
  | 'emotions'
  | 'weather'
  | 'seasonal';
```

**Behavior**:
- Centered modal with backdrop
- Grid layout (4 columns on mobile)
- Category tabs for filtering
- Selected sticker highlighted
- Close button and backdrop click

### Settings Components

#### 13. ThemeCustomization

**Purpose**: UI for customizing theme colors

**Interface**:
```typescript
interface ThemeCustomizationProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: 'Pink', value: '#FFB3BA' },
  { name: 'Orange', value: '#F4A460' },
  { name: 'Blue', value: '#6B9BD1' },
  { name: 'Teal', value: '#7ECEC4' },
  { name: 'Purple', value: '#C5B3E6' },
  { name: 'Yellow', value: '#FFD97D' },
];
```

**Behavior**:
- 6 preset color circles
- Custom color picker
- Live preview of changes
- Selected color highlighted

#### 14. FontSizeSlider

**Purpose**: Slider for adjusting font size

**Interface**:
```typescript
interface FontSizeSliderProps {
  currentSize: number;
  onSizeChange: (size: number) => void;
  min?: number;
  max?: number;
}
```

**Behavior**:
- Range: 12px - 24px
- Default: 16px
- Live preview
- Snap to integer values

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  primaryColor: string;
  customColor?: string;
  fontSize: number;
  darkMode: boolean;
  animations: 'none' | 'snow' | 'sakura';
  language: string;
}
```

### Trip Data

```typescript
interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  theme: ThemeConfig;
  days: TripDay[];
  bookings: Booking[];
  shopping: ShoppingItem[];
  budget: Expense[];
  checklist: ChecklistItem[];
  members: Member[];
  documents: TravelDocument[];
}

interface TripDay {
  id: string;
  date: Date;
  dayNumber: number;
  location: string;
  weather: WeatherInfo;
  hotel?: HotelInfo;
  flights: FlightInfo[];
  activities: Activity[];
  stickers: StickerPlacement[];
}

interface Activity {
  id: string;
  time: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  icon: string;
  notes?: string;
  completed: boolean;
  order: number;
}
```

### Booking Data

```typescript
interface Booking {
  id: string;
  type: 'flight' | 'train' | 'accommodation';
  data: FlightBooking | TrainBooking | AccommodationBooking;
}

interface FlightBooking {
  origin: LocationInfo;
  destination: LocationInfo;
  flightNumber: string;
  date: string;
  route: string;
}

interface AccommodationBooking {
  name: string;
  checkIn: string;
  checkOut: string;
  location: string;
  confirmationNumber?: string;
}

interface LocationInfo {
  code: string;
  name: string;
  time: string;
}
```

### Document Data

```typescript
interface TravelDocument {
  id: string;
  type: DocumentType;
  name: string;
  pdfUrl: string;
  thumbnail: string;
  extractedData?: ExtractedDocumentData;
  uploadedAt: Date;
  tags: string[];
}

type DocumentType = 
  | 'flight'
  | 'hotel'
  | 'car'
  | 'ticket'
  | 'insurance'
  | 'visa'
  | 'other';

interface ExtractedDocumentData {
  date?: string;
  location?: string;
  confirmationNumber?: string;
  amount?: number;
  currency?: string;
}
```

### Sticker Data

```typescript
interface Sticker {
  id: string;
  image: string;
  category: StickerCategory;
  tags: string[];
  aiGenerated: boolean;
  destination?: string;
  season?: string;
}

interface StickerPlacement {
  stickerId: string;
  elementId: string;
  elementType: 'day' | 'activity' | 'booking';
  position: { x: number; y: number };
  rotation: number;
  scale: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

**Redundant Properties:**
1. Properties 9.1, 9.3, 9.4, 9.5, 9.6 are redundant with 2.2, 2.3, and 2.1 (schedule screen duplicates at-a-glance view requirements)
2. Properties 15.1-15.4, 15.7 are redundant with 6.1-6.6 (settings screen duplicates theme customization requirements)
3. Property 16.7 is redundant with 4.2 (AI sticker generation)
4. Property 6.8 is redundant with 6.7 (theme persistence round-trip)

**Combined Properties:**
1. Google Maps URL generation (3.2 and 3.3) can be combined into a single property about correct URL format
2. Theme persistence (6.7 and 20.4) follow the same round-trip pattern and can be tested similarly
3. Shopping item rendering (11.1, 11.6, 11.7) can be combined into a comprehensive property about complete item data display
4. Booking rendering (10.3, 10.4) can be combined into a property about complete booking data display

After reflection, I will write properties that provide unique validation value without redundancy.

### Correctness Properties

#### Property 1: Theme Persistence Round-Trip
*For any* valid theme configuration (color, font size, dark mode, animations), saving the theme to localStorage and then loading it should restore the exact same configuration.
**Validates: Requirements 1.5, 6.7**

#### Property 2: Dark Mode Toggle
*For any* theme state, toggling dark mode should update the CSS class on the document root and persist the change to localStorage.
**Validates: Requirements 1.6, 6.4**

#### Property 3: Day Card Completeness
*For any* trip day with data, the rendered day card should contain all present fields: date, weather (if available), hotel (if available), flights (if any), and activities (if any).
**Validates: Requirements 2.1**

#### Property 4: Countdown Timer Accuracy
*For any* future departure date, the countdown timer should display the correct number of days, hours, minutes, and seconds remaining.
**Validates: Requirements 2.2**

#### Property 5: Completed Activity Indicators
*For any* activity with completed=true, the rendered output should contain a visual completion indicator (checkmark or similar).
**Validates: Requirements 2.6**

#### Property 6: Google Maps URL Generation
*For any* location, the generated Google Maps URL should either contain coordinates (if available) or use search format (if coordinates unavailable), and both formats should be valid Google Maps URLs.
**Validates: Requirements 3.1, 3.2, 3.3**

#### Property 7: Sticker Attachment Persistence
*For any* sticker attached to a trip element, the attachment should create a StickerPlacement record that persists across page reloads.
**Validates: Requirements 4.4, 4.5**

#### Property 8: Seasonal Sticker Generation
*For any* trip date in a specific season (spring, summer, fall, winter), the generated stickers should include at least one sticker from the corresponding seasonal category.
**Validates: Requirements 4.6**

#### Property 9: PDF Upload Success
*For any* valid PDF file, the upload process should succeed and create a document record with a thumbnail URL.
**Validates: Requirements 5.1, 5.2**

#### Property 10: Document Type Validation
*For any* uploaded document, it should have exactly one type from the valid set: flight, hotel, car, ticket, insurance, visa, or other.
**Validates: Requirements 5.4**

#### Property 11: Document Search Accuracy
*For any* search query, all returned documents should match the query in at least one field (name, type, tags, or extracted data).
**Validates: Requirements 5.5**

#### Property 12: Theme Change Live Preview
*For any* theme setting change (color, font size, dark mode), the CSS custom properties should update immediately without requiring a page reload.
**Validates: Requirements 6.6**

#### Property 13: Active Tab Highlighting
*For any* active navigation tab, it should be styled with the current primary theme color.
**Validates: Requirements 8.3**

#### Property 14: Tab Navigation
*For any* tab click, the navigation handler should be called with the correct route corresponding to that tab.
**Validates: Requirements 8.4**

#### Property 15: Localized Tab Labels
*For any* selected language, all navigation tab labels should be translated to that language.
**Validates: Requirements 8.6**

#### Property 16: Activity Reordering
*For any* activity drag-and-drop operation, the activity's order property should update to reflect its new position in the list.
**Validates: Requirements 9.7**

#### Property 17: Booking Tab Counts
*For any* trip, the "Tickets" tab count should equal the number of flight/train bookings, and the "Accommodation" tab count should equal the number of hotel bookings.
**Validates: Requirements 10.2**

#### Property 18: Booking Data Completeness
*For any* flight booking, the rendered card should display origin, destination, times, flight number, and date. *For any* accommodation booking, the rendered card should display hotel name, check-in/out dates, and location.
**Validates: Requirements 10.3, 10.4**

#### Property 19: Shopping Item Completeness
*For any* shopping item, the rendered output should display checkbox, name, image (if present), tags, and store (if present).
**Validates: Requirements 11.1, 11.6, 11.7**

#### Property 20: Shopping Statistics Accuracy
*For any* shopping list, the "to buy" count should equal the number of unchecked items, and the "bought" count should equal the number of checked items.
**Validates: Requirements 11.2**

#### Property 21: Shopping Item Toggle
*For any* shopping item, checking it should set checked=true and update the statistics accordingly.
**Validates: Requirements 11.3**

#### Property 22: Shopping Filter Accuracy
*For any* category filter, all displayed items should have tags matching that category (or all items if filter is "all").
**Validates: Requirements 11.4**

#### Property 23: Expense Total Calculation
*For any* list of expenses, the displayed total should equal the sum of all expense amounts.
**Validates: Requirements 12.2**

#### Property 24: Expense Category Breakdown
*For any* list of expenses, the sum of all category totals should equal the overall total.
**Validates: Requirements 12.3**

#### Property 25: Currency Conversion
*For any* expense in a foreign currency, the displayed amount should be converted to the user's base currency using the current exchange rate.
**Validates: Requirements 12.6**

#### Property 26: Checklist Progress Accuracy
*For any* checklist, the progress percentage should equal (completed items / total items) * 100.
**Validates: Requirements 13.2**

#### Property 27: Checklist Item Toggle
*For any* checklist item, checking it should set completed=true and update the progress accordingly.
**Validates: Requirements 13.3**

#### Property 28: Checklist Item Categorization
*For any* checklist item, it should have exactly one category from the valid set: packing, documents, or tasks.
**Validates: Requirements 13.5**

#### Property 29: Member Data Display
*For any* trip member, the rendered output should display avatar and name.
**Validates: Requirements 14.1**

#### Property 30: Member Role Display
*For any* trip member, the rendered output should display their role (owner, editor, or viewer).
**Validates: Requirements 14.3**

#### Property 31: Language Change Immediate Update
*For any* language change, all static UI text should update immediately to the new language without requiring a page reload.
**Validates: Requirements 20.3**

#### Property 32: Language Persistence Round-Trip
*For any* selected language, saving it to localStorage and then loading it should restore the same language selection.
**Validates: Requirements 20.4**

#### Property 33: UI Element Translation Completeness
*For any* supported language, all key UI elements (buttons, labels, navigation tabs) should have translations available.
**Validates: Requirements 20.5**

#### Property 34: Date Formatting Localization
*For any* date and selected language, the formatted date string should follow the conventions of that language/locale.
**Validates: Requirements 20.6**

#### Property 35: Number Formatting Localization
*For any* number and selected language, the formatted number string should follow the conventions of that language/locale (decimal separators, thousands separators).
**Validates: Requirements 20.7**

#### Property 36: Multilingual Content Display
*For any* user-generated content with translations, the system should display the translation matching the user's selected language, or fall back to the default language if translation is unavailable.
**Validates: Requirements 20.9**

## Error Handling

### Theme Loading Errors

**Scenario**: localStorage is unavailable or corrupted
**Handling**:
- Catch localStorage errors and fall back to default theme
- Log error to console for debugging
- Display user-friendly message if theme cannot be saved

**Scenario**: Invalid theme values in localStorage
**Handling**:
- Validate theme values before applying
- Fall back to defaults for invalid values
- Clear corrupted theme data

### File Upload Errors

**Scenario**: PDF file is too large (>10MB)
**Handling**:
- Reject upload before sending to server
- Display error message with size limit
- Suggest compressing the file

**Scenario**: PDF file is corrupted or invalid
**Handling**:
- Server returns error response
- Display user-friendly error message
- Allow user to try uploading a different file

**Scenario**: OCR extraction fails
**Handling**:
- Document is still saved without extracted data
- User can manually enter information
- Display message indicating manual entry may be needed

### Network Errors

**Scenario**: API request fails due to network issues
**Handling**:
- Display error toast with retry option
- Queue changes for offline sync if applicable
- Show offline indicator

**Scenario**: Real-time sync connection drops
**Handling**:
- Attempt automatic reconnection
- Display connection status indicator
- Queue changes for sync when reconnected

### Google Maps Integration Errors

**Scenario**: Location has no coordinates and name is empty
**Handling**:
- Disable Google Maps link
- Display location as plain text
- Log warning for data quality

**Scenario**: Google Maps fails to open (popup blocked)
**Handling**:
- Display message about popup blocker
- Provide alternative: copy link to clipboard
- Offer to open in same tab

### Animation Errors

**Scenario**: Browser doesn't support requestAnimationFrame
**Handling**:
- Fall back to CSS animations
- Disable particle effects
- Maintain core functionality

**Scenario**: Performance issues with animations
**Handling**:
- Detect low frame rate
- Automatically reduce particle count
- Offer to disable animations

### Internationalization Errors

**Scenario**: Translation file fails to load
**Handling**:
- Fall back to English translations
- Log error for debugging
- Display message about language unavailability

**Scenario**: Missing translation keys
**Handling**:
- Display key name as fallback
- Log missing keys for translation team
- Maintain UI functionality

## Testing Strategy

### Unit Testing

**Framework**: Vitest with React Testing Library

**Component Testing**:
- Render tests for all UI components
- Interaction tests (clicks, drags, inputs)
- Prop validation and edge cases
- Accessibility tests (ARIA labels, keyboard navigation)

**State Management Testing**:
- Zustand store actions and state updates
- Theme persistence to localStorage
- UI state transitions

**Utility Function Testing**:
- Date formatting and calculations
- URL generation for Google Maps
- Color manipulation utilities
- Number and currency formatting

**Example Unit Tests**:
```typescript
describe('CountdownTimer', () => {
  it('displays correct countdown for future date', () => {
    const futureDate = addDays(new Date(), 5);
    render(<CountdownTimer departureDate={futureDate} />);
    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
  });

  it('updates every second', async () => {
    const futureDate = addSeconds(new Date(), 10);
    render(<CountdownTimer departureDate={futureDate} />);
    await waitFor(() => {
      expect(screen.getByText(/9 seconds/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});

describe('ThemeStore', () => {
  it('persists theme to localStorage', () => {
    const { setPrimaryColor } = useThemeStore.getState();
    setPrimaryColor('#FF0000');
    expect(localStorage.getItem('theme-settings')).toContain('#FF0000');
  });

  it('loads theme from localStorage on init', () => {
    localStorage.setItem('theme-settings', JSON.stringify({
      primaryColor: '#00FF00',
      fontSize: 18,
      darkMode: true,
      animations: 'snow'
    }));
    const { loadTheme, primaryColor } = useThemeStore.getState();
    loadTheme();
    expect(primaryColor).toBe('#00FF00');
  });
});
```

### Property-Based Testing

**Framework**: fast-check for TypeScript

**Configuration**: Minimum 100 iterations per property test

**Property Test Examples**:

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  // Feature: kawaii-ui-redesign, Property 1: Theme Persistence Round-Trip
  it('theme round-trip preserves all settings', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryColor: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
          fontSize: fc.integer({ min: 12, max: 24 }),
          darkMode: fc.boolean(),
          animations: fc.constantFrom('none', 'snow', 'sakura')
        }),
        (theme) => {
          const store = useThemeStore.getState();
          store.setPrimaryColor(theme.primaryColor);
          store.setFontSize(theme.fontSize);
          store.setDarkMode(theme.darkMode);
          store.setAnimations(theme.animations);
          store.saveTheme();
          
          const saved = JSON.parse(localStorage.getItem('theme-settings')!);
          expect(saved).toEqual(theme);
          
          store.loadTheme();
          expect(store.primaryColor).toBe(theme.primaryColor);
          expect(store.fontSize).toBe(theme.fontSize);
          expect(store.darkMode).toBe(theme.darkMode);
          expect(store.animations).toBe(theme.animations);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: kawaii-ui-redesign, Property 4: Countdown Timer Accuracy
  it('countdown timer shows correct time for any future date', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }), // days in future
        (daysInFuture) => {
          const departureDate = addDays(new Date(), daysInFuture);
          const countdown = calculateCountdown(departureDate);
          
          expect(countdown.days).toBe(daysInFuture);
          expect(countdown.hours).toBeGreaterThanOrEqual(0);
          expect(countdown.hours).toBeLessThan(24);
          expect(countdown.minutes).toBeGreaterThanOrEqual(0);
          expect(countdown.minutes).toBeLessThan(60);
          expect(countdown.seconds).toBeGreaterThanOrEqual(0);
          expect(countdown.seconds).toBeLessThan(60);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: kawaii-ui-redesign, Property 6: Google Maps URL Generation
  it('generates valid Google Maps URLs for any location', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          coordinates: fc.option(fc.record({
            lat: fc.double({ min: -90, max: 90 }),
            lng: fc.double({ min: -180, max: 180 })
          }))
        }),
        (location) => {
          const url = generateGoogleMapsUrl(location.name, location.coordinates);
          
          expect(url).toContain('google.com/maps');
          
          if (location.coordinates) {
            expect(url).toContain(`${location.coordinates.lat},${location.coordinates.lng}`);
          } else {
            expect(url).toContain(encodeURIComponent(location.name));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: kawaii-ui-redesign, Property 20: Shopping Statistics Accuracy
  it('shopping statistics match actual item counts', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string(),
          checked: fc.boolean()
        })),
        (items) => {
          const stats = calculateShoppingStats(items);
          const expectedBought = items.filter(i => i.checked).length;
          const expectedToBuy = items.filter(i => !i.checked).length;
          
          expect(stats.bought).toBe(expectedBought);
          expect(stats.toBuy).toBe(expectedToBuy);
          expect(stats.bought + stats.toBuy).toBe(items.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: kawaii-ui-redesign, Property 23: Expense Total Calculation
  it('expense total equals sum of all amounts', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          amount: fc.double({ min: 0, max: 10000, noNaN: true }),
          category: fc.constantFrom('food', 'transport', 'accommodation', 'activities', 'other')
        })),
        (expenses) => {
          const total = calculateExpenseTotal(expenses);
          const expectedTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
          
          expect(total).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: kawaii-ui-redesign, Property 26: Checklist Progress Accuracy
  it('checklist progress percentage is correct', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          completed: fc.boolean()
        }), { minLength: 1 }),
        (items) => {
          const progress = calculateChecklistProgress(items);
          const completedCount = items.filter(i => i.completed).length;
          const expectedProgress = (completedCount / items.length) * 100;
          
          expect(progress).toBeCloseTo(expectedProgress, 2);
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Framework**: Playwright for E2E tests

**Test Scenarios**:
- Complete user flows (create trip, add activities, customize theme)
- Cross-screen navigation
- Real-time collaboration between multiple users
- Offline functionality and sync
- File upload and OCR extraction
- Google Maps integration

**Example Integration Tests**:
```typescript
test('user can create trip and customize theme', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Create New Trip');
  
  // Fill trip details
  await page.fill('[name="tripName"]', 'Tokyo Winter 2026');
  await page.fill('[name="destination"]', 'Tokyo, Japan');
  await page.click('[name="startDate"]');
  await page.click('text=14');
  
  // Customize theme
  await page.click('[data-testid="theme-pink"]');
  await page.click('text=Create Trip');
  
  // Verify theme applied
  const primaryColor = await page.evaluate(() => 
    getComputedStyle(document.documentElement).getPropertyValue('--primary-color')
  );
  expect(primaryColor).toContain('#FFB3BA');
  
  // Verify trip created
  await expect(page.locator('text=Tokyo Winter 2026')).toBeVisible();
});

test('user can upload PDF and view extracted data', async ({ page }) => {
  await page.goto('/trip/123/booking');
  
  // Upload PDF
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-fixtures/boarding-pass.pdf');
  
  // Wait for OCR processing
  await page.waitForSelector('[data-testid="document-card"]', { timeout: 10000 });
  
  // Verify extracted data
  await expect(page.locator('text=HKG → KIX')).toBeVisible();
  await expect(page.locator('text=CX596')).toBeVisible();
});
```

### Visual Regression Testing

**Framework**: Percy or Chromatic

**Test Coverage**:
- All screens in light and dark mode
- All theme color variations
- Responsive layouts (mobile, tablet, desktop)
- Animation states
- Empty states and error states

### Performance Testing

**Metrics**:
- Lighthouse CI for automated performance audits
- Bundle size monitoring with bundlesize
- Animation frame rate monitoring
- Time to Interactive (TTI)
- First Contentful Paint (FCP)

**Targets**:
- Lighthouse Performance Score: 90+
- Bundle Size: <50MB
- TTI: <2s on 3G
- FCP: <1s
- Animation FPS: 60

### Accessibility Testing

**Tools**:
- axe-core for automated a11y testing
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)

**Requirements**:
- WCAG AA compliance
- All interactive elements keyboard accessible
- Proper ARIA labels and roles
- Color contrast ratios meet standards
- Focus indicators visible

## Implementation Notes

### Phase 1: Foundation (Weeks 1-2)

**Priority**: Design system and core components

**Deliverables**:
- Design tokens and theme system
- Base UI components (Button, Card, FAB, Navigation)
- Theme provider with persistence
- i18n setup with initial translations

### Phase 2: Core Screens (Weeks 3-4)

**Priority**: Schedule, Booking, and Shopping screens

**Deliverables**:
- Schedule screen with countdown and day cards
- Booking screen with boarding pass cards
- Shopping screen with items and filters
- Google Maps integration

### Phase 3: Additional Screens (Weeks 5-6)

**Priority**: Budget, Checklist, Members, Settings

**Deliverables**:
- Budget screen with expense tracking
- Checklist screen with progress
- Members screen with collaboration
- Settings screen with customization

### Phase 4: Advanced Features (Week 7)

**Priority**: Stickers, animations, PDF upload

**Deliverables**:
- Sticker system with AI generation
- Particle animations (snow, sakura)
- PDF upload with OCR
- Document management

### Phase 5: Polish and Optimization (Week 8)

**Priority**: Performance, accessibility, testing

**Deliverables**:
- Performance optimization
- Accessibility improvements
- Comprehensive test coverage
- Visual regression tests
- Documentation

### Technical Considerations

**Bundle Size Optimization**:
- Code splitting by route
- Lazy loading for heavy components
- Tree shaking for unused code
- Dynamic imports for i18n bundles
- Image optimization and lazy loading

**Performance Optimization**:
- React.memo for expensive components
- useMemo and useCallback for expensive calculations
- Virtual scrolling for long lists
- Debouncing for search and filters
- Service worker for offline caching

**Accessibility**:
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Reduced motion support

**Browser Compatibility**:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Android Chrome 90+
- Progressive enhancement for older browsers

**Mobile Optimization**:
- Touch-optimized interactions
- Safe area insets for notched devices
- Responsive images
- Optimized animations for mobile
- Reduced data usage

