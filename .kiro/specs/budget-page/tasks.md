# Implementation Plan: Budget Page

## Overview

This implementation plan creates a comprehensive budget management feature for the travel app. The Budget page integrates with existing features (itinerary, reservations, shopping, packing) and provides real-time collaboration, offline support, multi-currency handling, and group expense splitting. The implementation follows the existing React + TypeScript architecture with Zustand state management, Tailwind CSS styling, and PostgreSQL backend.

## Tasks

- [x] 1. Set up database schema and backend API endpoints
  - Create PostgreSQL tables for budget_configs and expenses
  - Add database indexes for performance optimization
  - Create migration files for schema changes
  - Implement API endpoints for budget configuration CRUD operations
  - Implement API endpoints for expense CRUD operations
  - Implement batch sync endpoint for offline queue processing
  - Add authorization middleware to verify trip membership
  - _Requirements: 1.5, 2.6, 9.1, 9.4, 12.5_

- [x] 2. Implement core data models and TypeScript interfaces
  - [x] 2.1 Create TypeScript interfaces for budget data models
    - Define BudgetConfig, ExpenseEntry, BudgetSummary, CategorySummary interfaces
    - Define MemberBalance, Settlement, CustomSplit interfaces
    - Define API request/response DTOs
    - Export all types from types/expense.ts
    - _Requirements: 1.1, 2.1, 6.1_

  - [ ]* 2.2 Write property test for data model validation
    - **Property 1: Budget Amount Validation**
    - **Property 5: Required Field Validation**
    - **Property 6: Decimal Amount Validation**
    - **Validates: Requirements 1.2, 2.2, 2.3**

- [x] 3. Create Zustand budget store
  - [x] 3.1 Implement budgetStore with state and actions
    - Define store state (budgetConfig, expenses, filterTab, syncStatus)
    - Implement loadBudgetData action to fetch from API
    - Implement updateBudgetConfig action with local + API sync
    - Implement addExpense, updateExpense, deleteExpense actions
    - Implement filter and UI state actions (setFilterTab, openExpenseForm)
    - Add computed selectors for budgetSummary, categorySummaries, filteredExpenses
    - _Requirements: 1.5, 2.5, 2.6, 7.1, 9.1_

  - [ ]* 3.2 Write property tests for store actions
    - **Property 7: Expense Addition Updates Dashboard**
    - **Property 13: Category Spending Totals**
    - **Property 21: Expense List Filtering and Grouping**
    - **Validates: Requirements 2.5, 2.9, 5.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 4. Extend budget service with new functionality
  - [x] 4.1 Add budget configuration methods to budgetService
    - Implement getBudgetConfig, createBudgetConfig, updateBudgetConfig methods
    - Implement getExpenses, createExpense, updateExpense, deleteExpense methods
    - Implement calculateBudgetSummary with burn rate calculation
    - Implement calculateCategorySummaries with allocation tracking
    - Implement calculateMemberBalances for group expense splitting
    - Implement calculateSettlements using balance minimization algorithm
    - _Requirements: 1.1, 2.1, 4.6, 5.1, 6.4, 6.5_

  - [ ]* 4.2 Write property tests for budget calculations
    - **Property 2: Category Allocation Sum Invariant**
    - **Property 10: Home Currency Calculation Base**
    - **Property 11: Burn Rate Calculation**
    - **Property 14: Category Display Completeness**
    - **Property 18: Split Expense Calculation**
    - **Property 19: Member Balance Calculation**
    - **Validates: Requirements 1.4, 3.6, 4.6, 5.2, 6.3, 6.4, 6.5**

- [x] 5. Implement real-time sync service
  - [x] 5.1 Create BudgetSyncService for WebSocket communication
    - Implement WebSocket connection management (connect, disconnect, reconnect)
    - Implement subscribeToTripBudget for real-time event listeners
    - Implement syncBudgetConfig and syncExpense methods
    - Implement offline queue management (queueBudgetConfigUpdate, processSyncQueue)
    - Add conflict resolution using timestamp comparison
    - Integrate with existing socketService
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 12.4, 12.5_

  - [ ]* 5.2 Write property tests for sync operations
    - **Property 3: Data Persistence Round-Trip** (Local Storage and PostgreSQL)
    - **Property 24: Real-Time Sync Broadcast** (via WebSocket)
    - **Property 25: Offline Queue Management**
    - **Property 26: Conflict Resolution by Timestamp**
    - **Validates: Requirements 1.5, 2.6, 8.6, 8.7, 9.3, 9.4, 9.5, 12.1, 12.4, 12.5**

- [x] 6. Checkpoint - Ensure backend and services are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create atomic UI components (atoms)
  - [x] 7.1 Create basic input and display atoms
    - Create TripTitle component for displaying trip name
    - Create StatCard component for displaying budget statistics
    - Create BurnRateIndicator component with color-coded status
    - Create FilterTab component for expense filtering
    - Create FloatingAddButton (FAB) component
    - Create ExpenseAmount component with dual currency display
    - Create ExpenseCategory component with category icon
    - Create SplitInfo component for split expense details
    - Style all components with Tailwind CSS and kawaii theme
    - _Requirements: 2.7, 4.6, 7.1, 10.1, 10.2, 10.8_

  - [x]* 7.2 Write unit tests for atomic components
    - Test component rendering with various props
    - Test accessibility (ARIA labels, keyboard navigation)
    - Test responsive behavior at different breakpoints
    - _Requirements: 10.9, 10.10_

- [ ] 8. Create molecular UI components (molecules)
  - [x] 8.1 Create budget header and input molecules
    - Create CurrencySelector component with dropdown
    - Create TotalBudgetInput component with validation
    - Create CategoryAllocationItem component with percentage slider
    - Create BudgetProgressRing component with color-coded status
    - Create CatEatingAnimation component with animation states
    - Create AlertBanner component for warnings
    - Style with pastel colors and rounded corners
    - _Requirements: 1.1, 1.2, 1.7, 4.1, 4.2, 4.3, 10.1, 10.2, 10.3, 10.4_

  - [x] 8.2 Create expense card and form molecules
    - Create ExpenseCard component with all expense details
    - Create ExpenseForm component with validation
    - Create AmountInput component with decimal validation
    - Create CategorySelect component with category icons
    - Create DatePicker component
    - Create NoteInput component
    - Create SplitSelector component for group expenses
    - Add edit and delete actions to ExpenseCard
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8, 6.1, 6.2_

  - [x] 8.3 Create chart molecules
    - Create BudgetPieChart component using recharts
    - Create CategoryComparisonChart component (bar chart)
    - Create SpendingOverTimeChart component (line chart)
    - Create CategoryProgressBars component with color coding
    - Optimize chart rendering performance
    - _Requirements: 1.6, 4.8, 4.9, 4.10, 14.4_

  - [ ]* 8.4 Write property tests for form validation
    - **Property 1: Budget Amount Validation**
    - **Property 5: Required Field Validation**
    - **Property 6: Decimal Amount Validation**
    - **Validates: Requirements 1.2, 2.2, 2.3**

  - [ ]* 8.5 Write unit tests for molecular components
    - Test ExpenseCard displays all required fields
    - Test ExpenseForm validation and submission
    - Test chart rendering with various data sets
    - Test accessibility and responsive behavior
    - _Requirements: 2.7, 10.9, 10.10_

- [ ] 9. Create organism UI components (organisms)
  - [x] 9.1 Create BudgetDashboard organism
    - Compose BudgetHeader, BudgetProgressRing, BudgetStats, AlertBanner
    - Implement sticky header behavior on scroll
    - Add currency selector integration
    - Add alert banner logic for budget thresholds
    - _Requirements: 4.1, 4.2, 4.3, 4.7, 10.7, 13.1, 13.2, 13.3_

  - [x] 9.2 Create BudgetSetupSection organism
    - Compose TotalBudgetInput, CategoryAllocationList, BudgetPieChart
    - Implement collapsible behavior after initial setup
    - Add category allocation validation (sum = 100%)
    - Add save button with loading state
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 9.3 Create ExpenseListSection organism
    - Compose ExpenseFilters, ExpenseList, FloatingAddButton
    - Implement filter tab switching
    - Implement virtual scrolling for large lists
    - Add empty state when no expenses
    - _Requirements: 2.1, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 14.6_

  - [x] 9.4 Create VisualizationSection organism
    - Compose CategoryComparisonChart, SpendingOverTimeChart, CategoryProgressBars
    - Implement expandable/collapsible behavior
    - Add loading states for chart rendering
    - _Requirements: 4.8, 4.9, 5.2, 5.3, 14.4_

  - [x] 9.5 Create GroupSplitView organism
    - Compose MemberAvatarList, BalanceSummary, SettleButton
    - Implement settlement calculation display
    - Add settle button with confirmation modal
    - Show only for group trips (multiple members)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 9.6 Create ExpenseFormModal organism
    - Compose ExpenseForm with modal wrapper
    - Implement open/close animations
    - Add form submission with loading state
    - Add error handling and display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 9.7 Write property tests for organism behavior
    - **Property 2: Category Allocation Sum Invariant**
    - **Property 7: Expense Addition Updates Dashboard**
    - **Property 12: Burn Rate Warning Threshold**
    - **Property 15: Category Over-Budget Warning**
    - **Property 16: Category Filtering**
    - **Property 20: Settlement Updates Balances**
    - **Validates: Requirements 1.4, 2.5, 2.9, 4.7, 5.4, 5.5, 6.9**

  - [ ]* 9.8 Write unit tests for organism components
    - Test BudgetDashboard sticky behavior
    - Test BudgetSetupSection validation
    - Test ExpenseListSection filtering
    - Test GroupSplitView settlement calculations
    - _Requirements: 1.4, 5.5, 6.4, 6.5, 10.7_

- [x] 10. Checkpoint - Ensure UI components are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Create main BudgetPage component
  - [x] 11.1 Implement BudgetPage with layout integration
    - Compose all organism components in proper layout
    - Integrate with NavigationWrapper and PageLayout
    - Connect to budgetStore for state management
    - Implement data loading on mount
    - Add loading and error states
    - Implement responsive layout for mobile/tablet/desktop
    - _Requirements: 8.4, 8.5, 10.9, 14.1_

  - [ ]* 11.2 Write integration tests for BudgetPage
    - Test page loads budget data correctly
    - Test adding expense updates all sections
    - Test deleting expense recalculates summaries
    - Test filter switching updates expense list
    - Test offline mode queues changes
    - _Requirements: 2.5, 2.9, 7.2, 9.3, 12.3_

- [x] 12. Implement multi-currency support
  - [x] 12.1 Extend currencyService for budget needs
    - Add convertExpenseToHomeCurrency method
    - Implement batch currency conversion for expense lists
    - Add exchange rate caching with 24-hour expiration
    - Add fallback to cached rates when API unavailable
    - Display last update timestamp for exchange rates
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 12.2 Write property tests for currency conversion
    - **Property 4: Currency Selection Persistence**
    - **Property 9: Multi-Currency Display**
    - **Property 10: Home Currency Calculation Base**
    - **Validates: Requirements 1.7, 3.3, 3.6**

  - [ ]* 12.3 Write unit tests for currency edge cases
    - Test conversion with unavailable exchange rates
    - Test fallback to cached rates
    - Test warning display for stale rates
    - _Requirements: 3.4, 3.5_

- [x] 13. Implement offline support and sync
  - [x] 13.1 Extend offlineStorage for budget data
    - Add budget_configs and expenses to IndexedDB schema
    - Add sync_queue for offline changes
    - Implement loadBudgetDataOffline method
    - Implement saveBudgetDataOffline method
    - Implement queueBudgetChange method
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 13.2 Implement sync queue processing
    - Implement processSyncQueue in BudgetSyncService
    - Add exponential backoff for failed syncs (1s, 2s, 4s, 8s, max 30s)
    - Add sync status indicator (online/offline/syncing/error)
    - Implement automatic sync on network restoration
    - _Requirements: 9.3, 9.4, 12.5, 12.6_

  - [ ]* 13.3 Write property tests for offline operations
    - **Property 25: Offline Queue Management**
    - **Property 26: Conflict Resolution by Timestamp**
    - **Property 31: Offline Operations**
    - **Validates: Requirements 9.3, 9.4, 9.5, 12.3, 12.4, 12.5, 12.6**

  - [ ]* 13.4 Write integration tests for offline mode
    - Test adding expense while offline
    - Test sync queue processing when online
    - Test conflict resolution with concurrent edits
    - _Requirements: 9.3, 9.4, 9.5, 12.5, 12.6_

- [x] 14. Implement internationalization (i18n)
  - [x] 14.1 Add budget translations to locale files
    - Add Traditional Chinese translations to zh-TW/budget.json
    - Add English translations to en/budget.json
    - Include category names, filter tabs, navigation labels
    - Include error messages and validation messages
    - Include alert banner messages
    - _Requirements: 11.1, 11.2, 11.5_

  - [x] 14.2 Implement locale-based formatting
    - Use i18next for all text labels
    - Implement currency formatting based on locale
    - Implement date formatting based on locale
    - Add language switcher integration
    - _Requirements: 11.3, 11.4, 11.6, 11.7_

  - [ ]* 14.3 Write property tests for i18n
    - **Property 28: Language Switching Updates UI**
    - **Property 29: Language Preference Persistence**
    - **Property 30: Locale-Based Formatting**
    - **Validates: Requirements 11.3, 11.4, 11.5, 11.6, 11.7**

- [x] 15. Implement alert and notification system
  - [x] 15.1 Create alert banner logic
    - Implement budget threshold detection (70%, 90%, 100%)
    - Implement category over-budget detection
    - Implement burn rate warning detection (20% over planned)
    - Add alert dismissal with 24-hour suppression
    - Store dismissed alerts in localStorage
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [x] 15.2 Integrate with collaboration notification system
    - Send notification when budget config is modified
    - Send notification when expense is added by another user
    - Use existing notificationService for delivery
    - _Requirements: 9.7, 27_

  - [ ]* 15.3 Write property tests for alerts
    - **Property 32: Budget Threshold Alerts**
    - **Property 33: Category Budget Alerts**
    - **Property 34: Burn Rate Alert Threshold**
    - **Property 35: Warning Dismissal Suppression**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.7**

- [x] 16. Implement integration with existing features
  - [x] 16.1 Add expense linking to reservations
    - Add "Add to Budget" button in reservation detail view
    - Implement createExpenseFromReservation helper
    - Auto-populate expense form with reservation data
    - Link expense to reservation via linkedItemId
    - _Requirements: 8.1_

  - [x] 16.2 Add expense linking to shopping items
    - Add "Mark as Purchased" button in shopping item view
    - Implement createExpenseFromShoppingItem helper
    - Auto-create expense when item marked as purchased
    - Link expense to shopping item via linkedItemId
    - _Requirements: 8.2_

  - [x] 16.3 Add expense display in itinerary view
    - Display associated expenses in itinerary item detail
    - Show expense badge with amount on itinerary cards
    - Add "View in Budget" link to navigate to budget page
    - _Requirements: 8.3_

  - [ ]* 16.4 Write integration tests for feature linking
    - Test creating expense from reservation
    - Test creating expense from shopping item
    - Test viewing linked expenses in itinerary
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 17. Implement animations and visual enhancements
  - [x] 17.1 Create cat animation component
    - Implement idle, eating, worried, sad animation states
    - Add state transitions based on budget percentage
    - Integrate with BudgetProgressRing
    - Use CSS transforms for GPU acceleration
    - _Requirements: 10.3, 10.4_

  - [x] 17.2 Create milestone confetti animation
    - Implement confetti effect for 25%, 50%, 75% milestones
    - Trigger only when under budget
    - Use requestAnimationFrame for smooth animation
    - Add prefers-reduced-motion support
    - _Requirements: 4.11, 10.5_

  - [x] 17.3 Add micro-interactions
    - Add ripple effect on button clicks
    - Add slide-in animation for expense cards
    - Add fade-in animation for charts
    - Add loading skeleton for data fetching
    - _Requirements: 10.4, 14.2_

  - [ ]* 17.4 Write unit tests for animations
    - Test cat animation state transitions
    - Test confetti trigger conditions
    - Test reduced motion preferences
    - _Requirements: 10.3, 10.4, 10.5_

- [x] 18. Implement accessibility features
  - [x] 18.1 Add keyboard navigation support
    - Implement tab navigation through all interactive elements
    - Add Enter/Space activation for buttons
    - Add arrow key support for sliders
    - Add Escape key to close modals
    - _Requirements: 10.10_

  - [x] 18.2 Add screen reader support
    - Add ARIA labels to all interactive elements
    - Add ARIA live regions for dynamic updates
    - Use semantic HTML (nav, main, section, article)
    - Add alt text for cat animations and icons
    - _Requirements: 10.10_

  - [x] 18.3 Ensure color contrast and touch targets
    - Verify WCAG AA compliance for all text
    - Ensure minimum 44x44px touch targets
    - Add adequate spacing between touch targets (8px minimum)
    - Add visual feedback on touch
    - _Requirements: 10.10_

  - [ ]* 18.4 Write accessibility tests
    - Test keyboard navigation flow
    - Test screen reader announcements
    - Test color contrast ratios
    - Test touch target sizes
    - _Requirements: 10.10_

- [x] 19. Checkpoint - Ensure all features are integrated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Implement performance optimizations
  - [x] 20.1 Optimize rendering performance
    - Add React.memo to expensive components
    - Implement virtual scrolling for expense lists > 50 items
    - Debounce input handlers (300ms for search/filter)
    - Lazy load charts (render on scroll into view)
    - _Requirements: 14.2, 14.3, 14.5, 14.6_

  - [x] 20.2 Optimize data loading
    - Load budget config and recent expenses first (last 30 days)
    - Lazy load older expenses on demand
    - Prefetch trip member data
    - Optimize PostgreSQL queries with proper indexes
    - _Requirements: 14.1, 14.7_

  - [x] 20.3 Optimize animations
    - Use CSS transforms for GPU acceleration
    - Use requestAnimationFrame for smooth animations
    - Disable animations on low-end devices
    - _Requirements: 14.5_

  - [ ]* 20.4 Write performance tests
    - Test page load time < 1 second
    - Test expense addition UI update < 200ms
    - Test filter application < 300ms
    - Test scroll performance at 60fps
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [ ] 21. Add routing and navigation
  - [x] 21.1 Add budget route to app router
    - Add /trips/:tripId/budget route
    - Add budget tab to bottom navigation
    - Add navigation from trip dashboard to budget page
    - Implement route guards for trip membership
    - _Requirements: 8.4, 8.5_

  - [x] 21.2 Implement filter state persistence
    - Save filter selection to localStorage
    - Restore filter selection on page load
    - Maintain filter when navigating away and returning
    - _Requirements: 7.7, 22_

  - [ ]* 21.3 Write navigation tests
    - Test route navigation to budget page
    - Test filter state persistence
    - Test route guards for non-members
    - _Requirements: 7.7, 8.4, 22, 23_

- [ ] 22. Final integration and testing
  - [ ] 22.1 Perform end-to-end testing
    - Test complete budget setup flow
    - Test adding and editing expenses
    - Test group expense splitting and settlement
    - Test offline mode and sync
    - Test multi-currency conversion
    - Test real-time collaboration with multiple users
    - _Requirements: All_

  - [ ] 22.2 Perform cross-browser testing
    - Test on Chrome (desktop and mobile)
    - Test on Safari (desktop and iOS)
    - Test on Firefox
    - Test on Android Chrome
    - _Requirements: 10.9, 14.1_

  - [ ] 22.3 Perform accessibility audit
    - Run automated accessibility tests (axe-core)
    - Perform manual keyboard navigation testing
    - Test with screen reader (NVDA/JAWS/VoiceOver)
    - Verify WCAG 2.1 AA compliance
    - _Requirements: 10.10_

  - [ ]* 22.4 Write remaining property tests
    - **Property 8: Expense Display Completeness**
    - **Property 17: Category Allocation Recalculation**
    - **Property 22: Filter State Persistence**
    - **Property 23: Trip Data Loading**
    - **Property 27: Collaboration Notifications**
    - **Validates: Requirements 2.7, 5.7, 7.7, 8.4, 9.7**

- [ ] 23. Documentation and cleanup
  - [ ] 23.1 Write component documentation
    - Document all component props and usage
    - Add JSDoc comments to all public methods
    - Create Storybook stories for key components
    - Update README with budget feature overview
    - _Requirements: All_

  - [ ] 23.2 Write user guide
    - Create user guide for budget setup
    - Document expense entry workflow
    - Document group expense splitting
    - Document offline mode behavior
    - Add screenshots and examples
    - _Requirements: All_

  - [ ] 23.3 Code cleanup and optimization
    - Remove unused imports and code
    - Ensure consistent code formatting
    - Run linter and fix all warnings
    - Optimize bundle size
    - _Requirements: All_

- [ ] 24. Final checkpoint - Deployment readiness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check library (minimum 100 iterations)
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows existing app patterns for consistency
- All components use the established kawaii theme with pastel colors
- Real-time collaboration uses existing WebSocket infrastructure
- Offline support uses existing IndexedDB services
- Multi-currency support uses existing Frankfurter API integration
