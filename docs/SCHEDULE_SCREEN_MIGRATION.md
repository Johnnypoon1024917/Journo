# ScheduleScreen Migration Plan

## Current Structure

ScheduleScreen uses `ResponsiveLayout` component which already handles:
- Side navigation (desktop)
- Bottom navigation (mobile)
- Active tab management

## Migration Strategy

Since ScheduleScreen already uses ResponsiveLayout, we need to:

1. **Keep ResponsiveLayout** - It's already doing what NavigationWrapper does
2. **Add PageLayout wrapper** - For consistent padding and sticker display
3. **Replace FAB implementation** - Use FABContainer for consistent positioning
4. **Simplify structure** - Remove redundant wrappers

## Changes Needed

### Before (Current)
```tsx
<ResponsiveLayout
  showNavigation={true}
  activeTab={activeTab}
  onTabChange={handleTabChange}
  contentClassName="!p-0"
>
  {/* Header with gradient */}
  {/* Content */}
</ResponsiveLayout>

{/* FAB - separate */}
<FAB onClick={handleAddActivity} />
```

### After (Migrated)
```tsx
<PageLayout 
  tripId={tripId} 
  showStickers={true}
  noPadding={true}
>
  <ResponsiveLayout
    showNavigation={true}
    activeTab={activeTab}
    onTabChange={handleTabChange}
    contentClassName="!p-0"
  >
    {/* Header with gradient */}
    {/* Content */}
  </ResponsiveLayout>
  
  <FABContainer
    primary={{
      icon: <PlusIcon />,
      onClick: handleAddActivity,
      label: 'Add Activity'
    }}
    secondary={[
      {
        icon: <SparklesIcon />,
        onClick: handleAddSticker,
        label: 'Add Sticker'
      }
    ]}
  />
</PageLayout>
```

## Benefits

1. Consistent sticker display integration
2. Standardized FAB positioning
3. Support for secondary FAB (stickers)
4. Better z-index management
5. Consistent with other pages

## Note

ScheduleScreen is unique because it uses ResponsiveLayout which is more sophisticated than simple navigation. We'll keep ResponsiveLayout and wrap it with PageLayout for consistency.
