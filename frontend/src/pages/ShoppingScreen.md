# ShoppingScreen Component

## Overview

The ShoppingScreen is a kawaii-style page component that provides a complete shopping list management interface for trip planning. It integrates shopping statistics, filtering, and item management with a beautiful, touch-optimized UI.

## Features

### Core Functionality
- **Shopping Statistics**: Real-time display of items to buy vs. bought
- **Category Filtering**: Filter items by category (all, food, clothing, important, other)
- **Item Management**: Add, edit, delete, and toggle shopping items
- **Progress Tracking**: Visual progress bar showing completion percentage
- **Responsive Design**: Adapts to mobile, tablet, and desktop layouts

### UI Components
- **ShoppingStats**: Displays to buy/bought counts with animated progress bar
- **FilterDropdown**: Category filter with item counts
- **ShoppingItem**: Individual item cards with checkbox, image, tags, and actions
- **FAB**: Floating action button for adding new items
- **Navigation**: Bottom navigation (mobile) or side navigation (desktop)

## Data Flow

```
ShoppingScreen
├── Fetch trip data (tripService)
├── Fetch shopping items (shoppingService)
├── Fetch statistics (shoppingService)
├── Fetch filter options (shoppingService)
└── Handle user actions
    ├── Toggle item checked status
    ├── Delete items
    ├── Filter by category
    └── Navigate between sections
```

## Service Integration

### Shopping Service (localStorage-based)
The shopping service provides a complete API for managing shopping items:

```typescript
shoppingService.getShoppingItems(tripId)
shoppingService.getShoppingStats(tripId)
shoppingService.getFilterOptions(tripId)
shoppingService.toggleShoppingItem(tripId, itemId)
shoppingService.deleteShoppingItem(tripId, itemId)
shoppingService.getFilteredItems(tripId, filterId)
```

The service currently uses localStorage for data persistence but is structured to easily connect to backend API endpoints when available.

## State Management

### Local State
- `trip`: Current trip data
- `items`: All shopping items
- `filteredItems`: Items matching current filter
- `stats`: Shopping statistics (toBuy, bought, total)
- `filterOptions`: Available filter options with counts
- `selectedFilter`: Currently active filter
- `isLoading`: Loading state
- `error`: Error message if any

### State Updates
- Statistics and filter options are automatically updated when items change
- Filtered items update when filter selection changes
- Optimistic UI updates for toggle and delete actions

## User Interactions

### Item Toggle
1. User clicks checkbox on shopping item
2. Service toggles checked status
3. Local state updates immediately
4. Statistics recalculated and updated

### Item Delete
1. User swipes item left or clicks delete in menu
2. Delete animation plays
3. Service removes item
4. Local state updates
5. Statistics and filters recalculated

### Category Filter
1. User selects category from dropdown
2. Service fetches filtered items
3. Filtered items displayed with animation
4. Empty state shown if no matches

## Empty States

### No Items
- Displays shopping bag emoji (🛍️)
- Message: "No items on your shopping list"
- Call-to-action button to add first item

### No Filter Results
- Displays search emoji (🔍)
- Message: "No items match this filter"
- User can change filter or clear it

## Error Handling

### Authentication Errors
- Detects expired tokens
- Logs user out
- Redirects to login page

### Not Found Errors
- Displays error message
- Provides retry and go home options

### Network Errors
- Shows error toast
- Maintains current state
- Allows retry

## Responsive Behavior

### Mobile (< 768px)
- Bottom navigation bar
- Full-width content
- Touch-optimized interactions
- Swipe gestures enabled

### Desktop (≥ 768px)
- Side navigation panel
- Content with left margin
- Hover effects
- Larger touch targets

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus management for modals

## Testing

The component includes comprehensive tests covering:
- Loading states
- Data rendering
- Empty states
- Error handling
- Navigation
- User interactions

Run tests:
```bash
npm test -- ShoppingScreen.test.tsx
```

## Future Enhancements

### Planned Features
- Add/edit item modal
- Image upload for items
- Store suggestions
- Price tracking
- Shopping list sharing
- Offline support
- Real-time collaboration

### Backend Integration
When backend API is available, update service calls in:
- `shoppingService.ts` - Replace localStorage with API calls
- No changes needed in ShoppingScreen component

## Requirements Validation

This component validates the following requirements:
- **11.1**: Display shopping items with checkbox, image, and tags ✓
- **11.2**: Show statistics (to buy and bought counts) ✓
- **11.3**: Toggle item checked status ✓
- **11.4**: Filter by category ✓
- **11.5**: FAB for adding new items ✓
- **11.6**: Display item images ✓
- **11.7**: Display store names ✓
- **11.8**: Delete items via swipe or menu ✓

## Related Components

- `ShoppingStats` - Statistics display
- `FilterDropdown` - Category filter
- `ShoppingItem` - Individual item card
- `FAB` - Floating action button
- `BottomNavigation` - Mobile navigation
- `SideNavigation` - Desktop navigation

## Related Services

- `shoppingService` - Shopping data management
- `tripService` - Trip data fetching

## Related Types

- `ShoppingItem` - Item data structure
- `ShoppingStats` - Statistics data structure
- `ShoppingFilterOption` - Filter option structure
- `ShoppingTag` - Tag type definition
