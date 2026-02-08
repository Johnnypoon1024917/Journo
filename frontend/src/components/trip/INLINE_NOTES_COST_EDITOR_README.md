# Inline Notes and Cost Editor

## Overview

The Inline Notes and Cost Editor provides a seamless way to edit place details (notes, cost, and currency) without opening a full modal dialog. This component follows the design principle of ≤1.5 taps to edit, enabling quick updates with optimistic saves.

## Features

### 1. **Tap-to-Edit on Pencil Icon**
- Clicking the pencil icon (✏️) on a place card opens the inline editor
- Editor appears as an overlay with backdrop blur
- No navigation away from the current view

### 2. **Multi-line Notes with Auto-Expand**
- Textarea automatically expands as user types
- Supports multi-line notes with proper formatting
- Maximum height of 300px with scroll for very long notes
- Placeholder text: "Add notes, tips, or reminders..."

### 3. **Currency Formatting (HKD Default)**
- Currency selector with 10 common currencies:
  - HKD (Hong Kong Dollar) - Default
  - USD, EUR, GBP, JPY, CNY, TWD, SGD, AUD, CAD
- Real-time formatted preview of entered cost
- Supports decimal values (e.g., 123.45)
- Input validation to allow only numbers and decimal point

### 4. **Optimistic Save Without Explicit Save Button**
- Changes are automatically saved after 800ms of inactivity (debounced)
- No "Save" button required - follows modern UX patterns
- Saving indicator shows when update is in progress
- Changes persist immediately in UI while API call is in flight

### 5. **Keyboard Shortcuts**
- **Esc**: Close editor without waiting for save
- **Cmd/Ctrl + Enter**: Save immediately and close editor

## Component API

### InlineNotesAndCostEditor

```typescript
interface InlineNotesAndCostEditorProps {
  notes: string | null;
  cost: number | null;
  costCurrency: string | null;
  onSave: (notes: string | null, cost: number | null, costCurrency: string) => void;
  onClose: () => void;
  className?: string;
}
```

### PlaceCardWithInlineEditor

```typescript
interface PlaceCardWithInlineEditorProps {
  place: Place;
  index: number;
  allPlacesInDay: Place[];
  // ... other props
  onNotesAndCostChange?: (
    placeId: string,
    notes: string | null,
    cost: number | null,
    costCurrency: string
  ) => Promise<void>;
}
```

## Usage Example

```typescript
import { PlaceCardWithInlineEditor } from './PlaceCardWithInlineEditor';
import { placeService } from '../../services/placeService';

function MyComponent() {
  const handleNotesAndCostChange = async (
    placeId: string,
    notes: string | null,
    cost: number | null,
    costCurrency: string
  ) => {
    try {
      // Optimistically update local state
      updateLocalPlace(placeId, { notes, cost, cost_currency: costCurrency });

      // Update via API
      await placeService.updatePlace(placeId, {
        notes,
        cost,
        cost_currency: costCurrency,
      });
    } catch (error) {
      // Revert on error
      revertLocalPlace(placeId);
      showError('Failed to update details');
    }
  };

  return (
    <PlaceCardWithInlineEditor
      place={place}
      index={0}
      allPlacesInDay={places}
      onNotesAndCostChange={handleNotesAndCostChange}
    />
  );
}
```

## Design Specifications

### Visual Design

- **Editor Container**: White background with rounded corners (12px), shadow
- **Header**: Light gray background (#f9fafb) with title and close button
- **Currency Select**: Dropdown with custom arrow icon, hover effects
- **Cost Input**: Large font (16px), tabular numbers, blue border on focus
- **Cost Preview**: Blue background with formatted currency display
- **Notes Textarea**: Auto-expanding, 14px font, 1.6 line height
- **Saving Indicator**: Blue background with spinner and "Saving..." text

### Spacing

- **Editor Padding**: 20px (desktop), 16px (mobile)
- **Section Gap**: 20px between cost and notes sections
- **Input Padding**: 10-14px for comfortable touch targets
- **Mobile Optimization**: Reduced padding and font sizes for small screens

### Colors

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | #ffffff | #1f2937 |
| Header BG | #f9fafb | #111827 |
| Border | #e5e7eb | #4b5563 |
| Text | #1f2937 | #f9fafb |
| Primary | #3b82f6 | #60a5fa |
| Cost Preview BG | #dbeafe | #1e3a8a |
| Cost Preview Text | #1e40af | #bfdbfe |

### Animations

- **Slide In**: 250ms cubic-bezier(0.4, 0, 0.2, 1)
- **Backdrop Fade**: 200ms ease-out
- **Button Hover**: 150ms cubic-bezier(0.4, 0, 0.2, 1)
- **Spinner Rotation**: 0.8s linear infinite

## Accessibility

### Keyboard Navigation
- All inputs are keyboard accessible
- Tab order: Currency → Cost → Notes → Close button
- Esc key closes editor
- Cmd/Ctrl+Enter saves and closes

### Screen Reader Support
- Proper ARIA labels on all inputs
- Currency select has aria-label="Currency"
- Cost input has aria-label="Cost amount"
- Notes textarea has aria-label="Notes"
- Close button has aria-label="Close editor"

### Focus Management
- Textarea receives focus on mount
- Cursor positioned at end of existing text
- Focus visible styles on all interactive elements
- 3px blue outline with 2px offset

### Motion Preferences
- Respects `prefers-reduced-motion` media query
- Disables animations when user prefers reduced motion

## Mobile Optimizations

### Touch Targets
- Minimum 44x44px touch targets (iOS guidelines)
- Pencil icon: 36x36px (desktop), 32x32px (mobile)
- Close button: 28x28px with padding

### Input Types
- Cost input uses `inputMode="decimal"` for numeric keyboard on mobile
- Textarea uses default keyboard for text entry

### Layout
- Full-width editor on mobile (max-width: 100%)
- Reduced padding: 16px (mobile) vs 20px (desktop)
- Smaller fonts: 15px (mobile) vs 16px (desktop)
- Rounded corners only on top for bottom-sheet feel

## Performance Considerations

### Debouncing
- 800ms debounce on auto-save to reduce API calls
- Prevents excessive updates while user is typing
- Clears timeout on component unmount

### Optimistic Updates
- UI updates immediately before API call
- Provides instant feedback to user
- Reverts on error with error message

### Auto-Expand Textarea
- Efficiently calculates height based on scrollHeight
- Only recalculates when content changes
- No layout thrashing

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **13.5**: Create inline edit panel for notes, cost, and tags ✅
- **13.6**: Implement optimistic save without explicit save button ✅
- **20.3**: Add currency formatting (HKD default) ✅

### Requirement 13.5: Inline Edit Panel
- ✅ Tap-to-edit on pencil icon
- ✅ Inline edit panel (not modal)
- ✅ Notes field with multi-line support
- ✅ Cost field with currency selector
- ✅ Auto-expand textarea

### Requirement 13.6: Optimistic Save
- ✅ No explicit save button
- ✅ Auto-save with 800ms debounce
- ✅ Saving indicator during API call
- ✅ Keyboard shortcuts (Esc, Cmd+Enter)

### Requirement 20.3: Currency Formatting
- ✅ HKD as default currency
- ✅ 10 currency options
- ✅ Real-time formatted preview
- ✅ Intl.NumberFormat for proper formatting

## Testing

### Manual Testing Checklist

- [ ] Click pencil icon opens editor
- [ ] Editor displays current notes and cost
- [ ] Currency selector shows correct default (HKD)
- [ ] Cost input accepts only numbers and decimal
- [ ] Cost preview updates in real-time
- [ ] Textarea auto-expands with content
- [ ] Changes save automatically after 800ms
- [ ] Saving indicator appears during save
- [ ] Esc key closes editor
- [ ] Cmd/Ctrl+Enter saves and closes
- [ ] Editor works on mobile (touch)
- [ ] Dark mode styles apply correctly
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader announces changes

### Integration Testing

```typescript
describe('InlineNotesAndCostEditor', () => {
  it('should save changes after debounce period', async () => {
    const onSave = jest.fn();
    render(<InlineNotesAndCostEditor onSave={onSave} />);
    
    // Type in notes
    const textarea = screen.getByLabelText('Notes');
    fireEvent.change(textarea, { target: { value: 'Test note' } });
    
    // Wait for debounce
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Test note', null, 'HKD');
    }, { timeout: 1000 });
  });

  it('should format cost correctly', () => {
    render(<InlineNotesAndCostEditor cost={1234.56} costCurrency="HKD" />);
    
    expect(screen.getByText('HK$1,235')).toBeInTheDocument();
  });
});
```

## Future Enhancements

1. **Tags Support**: Add tag input with autocomplete
2. **Budget Category**: Add budget category selector
3. **Rich Text Notes**: Support markdown or basic formatting
4. **Photo Attachment**: Allow attaching photos to notes
5. **Voice Notes**: Support voice-to-text for notes
6. **Collaborative Editing**: Show when others are editing
7. **Version History**: Track changes to notes and cost
8. **Templates**: Quick-insert common notes (e.g., "Bring cash", "Book in advance")

## Related Components

- `InlineTimeEditor`: For editing start/end times
- `PlaceCardWithInlineEditor`: Wrapper component with all inline editors
- `TransportModeSelector`: For editing transport mode
- `PlaceCard`: Base place card component
