# Checklist Components

This document describes the Checklist components for the Kawaii UI redesign.

## Components

### ChecklistItem

Displays a single checklist item with checkbox, title, and category.

**Features:**
- Checkbox on left for marking items as completed
- Title display with strike-through when completed
- Category badge display with color coding
- Three-dot menu for edit/delete actions
- Touch-optimized interactions (44px minimum touch targets)
- Framer Motion animations for smooth interactions
- Dark mode support

**Props:**
```typescript
interface ChecklistItemProps {
  item: PackingItem;           // The checklist item data
  onToggle?: (id: string) => void;  // Called when checkbox is toggled
  onEdit?: () => void;          // Called when edit is clicked
  onDelete?: () => void;        // Called when delete is clicked
  className?: string;           // Additional CSS classes
}
```

**Usage:**
```tsx
import { ChecklistItem } from '@/components/kawaii';

<ChecklistItem
  item={item}
  onToggle={(id) => handleToggle(id)}
  onEdit={() => handleEdit()}
  onDelete={() => handleDelete()}
/>
```

**Categories:**
- `essentials` - Essential items (red)
- `clothing` - Clothing items (purple)
- `toiletries` - Toiletries (blue)
- `electronics` - Electronics (yellow)
- `documents` - Documents (orange)
- `health` - Health items (green)
- `activities` - Activity items (pink)
- `misc` - Miscellaneous (gray)

### ChecklistProgress

Displays checklist progress with progress bar and statistics.

**Features:**
- Display total items and completed items counts
- Visual progress bar with percentage
- Animated count transitions
- Completion message when all items are checked
- Kawaii styling with rounded corners
- Dark mode support

**Props:**
```typescript
interface ChecklistProgressProps {
  progress: PackingListProgress;  // Progress data
  className?: string;             // Additional CSS classes
}

interface PackingListProgress {
  total_items: number;      // Total number of items
  checked_items: number;    // Number of checked items
  percentage: number;       // Progress percentage (0-100)
  by_category: {            // Progress by category
    [key in PackingCategory]?: {
      total: number;
      checked: number;
    };
  };
}
```

**Usage:**
```tsx
import { ChecklistProgress } from '@/components/kawaii';

const progress = {
  total_items: 10,
  checked_items: 7,
  percentage: 70,
  by_category: {},
};

<ChecklistProgress progress={progress} />
```

## Styling

Both components use the Kawaii design system tokens:

- **Colors:** `kawaii-primary`, `kawaii-neutral-*`
- **Spacing:** Touch-optimized with 44px minimum touch targets
- **Shadows:** Subtle shadows with hover effects
- **Animations:** Framer Motion for smooth transitions
- **Dark Mode:** Full dark mode support with appropriate color adjustments

## Internationalization

All text is internationalized using react-i18next:

**Translation Keys:**
```json
{
  "checklist": {
    "check": "Mark as complete",
    "uncheck": "Mark as incomplete",
    "totalItems": "Total Items",
    "completed": "Completed",
    "progress": "Progress",
    "allComplete": "All items completed!",
    "categories": {
      "essentials": "Essentials",
      "clothing": "Clothing",
      "toiletries": "Toiletries",
      "electronics": "Electronics",
      "documents": "Documents",
      "health": "Health",
      "activities": "Activities",
      "misc": "Miscellaneous"
    }
  }
}
```

## Accessibility

- **Keyboard Navigation:** All interactive elements are keyboard accessible
- **ARIA Labels:** Proper ARIA labels for screen readers
- **Touch Targets:** Minimum 44px touch targets for mobile
- **Focus Indicators:** Visible focus rings on interactive elements
- **Color Contrast:** WCAG AA compliant color contrast ratios

## Requirements

**Validates:**
- Requirement 13.1: Display checkbox, title, category with strike-through when completed
- Requirement 13.2: Display progress bar and percentage with completed vs total counts

## Demo

See `ChecklistDemo.tsx` for a working example of the components.

## Testing

Unit tests are available in `__tests__/ChecklistComponents.test.tsx`:

```bash
npm test -- ChecklistComponents.test.tsx
```

**Test Coverage:**
- ✓ Renders checklist item with title and category
- ✓ Shows unchecked/checked states correctly
- ✓ Applies strike-through to completed items
- ✓ Calls onToggle when checkbox is clicked
- ✓ Shows menu and handles edit/delete actions
- ✓ Renders progress with correct counts and percentage
- ✓ Shows completion message when all items are done
- ✓ Handles edge cases (no items, partial progress)
