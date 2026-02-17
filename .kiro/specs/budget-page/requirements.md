# Requirements Document: Budget Page

## Introduction

The Budget page is a comprehensive budget management feature for a travel app that helps users set, track, and manage trip budgets before and during travel. The feature integrates with existing app features including collaboration (real-time sync/notifications), itinerary ("行程"), reservations ("預約"), shopping ("購物"), and packing ("準備"). The page follows a cute cat theme with pastel colors, rounded cards, and cat animations, providing an engaging and motivational user experience while preventing overspending through visual progress tracking and alerts.

## Glossary

- **Budget_System**: The complete budget management feature including UI, data models, and business logic
- **Budget_Dashboard**: The header section displaying total budget, spent amount, remaining amount, and progress visualization
- **Expense_Entry**: A single recorded expense with amount, category, date, note, and payment/split information
- **Category**: A budget allocation segment (e.g., Flights, Accommodation, Food, Transport, Activities, Shopping, Misc)
- **Home_Currency**: The user's primary currency (default: HKD)
- **Trip_Currency**: The currency used during the trip (e.g., JPY, USD, EUR)
- **Split_Expense**: An expense shared among multiple trip members with defined payment and owed amounts
- **Budget_Allocation**: The distribution of total budget across different categories
- **Progress_Ring**: A circular visualization showing budget consumption with color-coded status
- **Burn_Rate**: The average daily spending rate calculated from expenses
- **Settlement**: The process of resolving who owes whom in group expenses
- **PostgreSQL**: Relational database used for persistent data storage
- **Local_Storage**: Browser-based storage for offline data persistence


## Requirements

### Requirement 1: Budget Setup and Configuration

**User Story:** As a trip planner, I want to set up a total budget and allocate it across categories, so that I can plan my spending and track it against predefined limits.

#### Acceptance Criteria

1. WHEN a user accesses the Budget page for the first time, THE Budget_System SHALL display a budget setup interface with total budget input and category allocation options
2. WHEN a user enters a total budget amount, THE Budget_System SHALL validate that the amount is a positive number greater than zero
3. THE Budget_System SHALL provide pre-set category allocations (Flights 30%, Accommodation 25%, Food 15%, Transport 10%, Activities 10%, Shopping 5%, Misc 5%)
4. WHEN a user modifies category allocation percentages, THE Budget_System SHALL ensure the total allocation equals 100%
5. WHEN a user saves budget configuration, THE Budget_System SHALL persist the data to both Local_Storage and PostgreSQL database
6. THE Budget_System SHALL display an interactive pie chart showing Budget_Allocation across all categories
7. WHEN a user selects a Trip_Currency, THE Budget_System SHALL store the selection and use it for all expense displays

### Requirement 2: Expense Entry and Management

**User Story:** As a traveler, I want to quickly log expenses with relevant details, so that I can track my spending in real-time without disrupting my trip activities.

#### Acceptance Criteria

1. WHEN a user clicks the floating "+" button, THE Budget_System SHALL display an expense entry form
2. THE Budget_System SHALL require amount, category, and date fields for each Expense_Entry
3. WHEN a user enters an expense amount, THE Budget_System SHALL accept positive decimal numbers with up to 2 decimal places
4. THE Budget_System SHALL provide optional fields for note, payment method, and split information
5. WHEN a user saves an Expense_Entry, THE Budget_System SHALL immediately update the Budget_Dashboard with the new expense
6. WHEN an Expense_Entry is saved, THE Budget_System SHALL persist it to both Local_Storage and PostgreSQL database within 1 second
7. THE Budget_System SHALL display each Expense_Entry as a card showing amount in both Trip_Currency and Home_Currency, date, category, note, and split information
8. WHEN a user taps an expense card, THE Budget_System SHALL allow editing or deletion of the Expense_Entry
9. WHEN an expense is deleted, THE Budget_System SHALL update all related calculations and visualizations immediately

### Requirement 3: Multi-Currency Support

**User Story:** As an international traveler, I want to see expenses in both local and home currency, so that I can understand my spending in familiar terms while tracking local costs.

#### Acceptance Criteria

1. THE Budget_System SHALL support Home_Currency set to HKD by default
2. THE Budget_System SHALL allow users to select any Trip_Currency from a predefined list of major currencies
3. WHEN displaying expense amounts, THE Budget_System SHALL show both Trip_Currency and Home_Currency values
4. THE Budget_System SHALL fetch current exchange rates from an external API at least once per day
5. WHEN exchange rates are unavailable, THE Budget_System SHALL use the most recently cached rate and display a warning indicator
6. WHEN calculating totals and budget remaining, THE Budget_System SHALL use Home_Currency as the base currency
7. THE Budget_System SHALL display currency conversion rates in the Budget_Dashboard with last update timestamp

### Requirement 4: Budget Visualization and Progress Tracking

**User Story:** As a budget-conscious traveler, I want to see visual representations of my spending progress, so that I can quickly understand if I'm on track or overspending.

#### Acceptance Criteria

1. THE Budget_System SHALL display a Progress_Ring showing total budget, spent amount, and remaining amount
2. WHEN budget consumption is below 70%, THE Progress_Ring SHALL display in green color
3. WHEN budget consumption is between 70% and 90%, THE Progress_Ring SHALL display in yellow color
4. WHEN budget consumption exceeds 90%, THE Progress_Ring SHALL display in red color

6. THE Budget_System SHALL calculate and display Burn_Rate as average daily spending
7. WHEN Burn_Rate exceeds planned daily budget, THE Budget_System SHALL display a warning banner
8. THE Budget_System SHALL provide a pie chart comparing planned Budget_Allocation versus actual spending by category
9. THE Budget_System SHALL provide a bar chart showing spending by category with planned vs actual amounts
10. THE Budget_System SHALL provide a line chart showing cumulative spending over time
11. WHEN a user reaches a budget milestone (25%, 50%, 75%, 100%), THE Budget_System SHALL display a Animation with confetti

### Requirement 5: Category-Based Budget Tracking

**User Story:** As a detailed planner, I want to track spending within each budget category, so that I can identify which areas are consuming more or less than planned.

#### Acceptance Criteria

1. THE Budget_System SHALL maintain separate spending totals for each Category
2. WHEN displaying category progress, THE Budget_System SHALL show allocated amount, spent amount, and remaining amount for each Category
3. THE Budget_System SHALL display progress bars for each Category with color-coding (green/yellow/red)
4. WHEN a Category exceeds its allocated budget, THE Budget_System SHALL display a warning indicator on that category
5. WHEN filtering expenses by category, THE Budget_System SHALL display only Expense_Entry items matching the selected Category
6. THE Budget_System SHALL allow users to adjust category allocations after initial setup
7. WHEN category allocations are adjusted, THE Budget_System SHALL recalculate all category budgets and update visualizations

### Requirement 6: Group Expense Management and Splitting

**User Story:** As a group traveler, I want to track who paid for expenses and split costs fairly, so that we can settle accounts accurately at the end of the trip.

#### Acceptance Criteria

1. WHEN creating a Split_Expense, THE Budget_System SHALL allow selection of the member who paid
2. WHEN creating a Split_Expense, THE Budget_System SHALL allow selection of members who share the expense
3. THE Budget_System SHALL support equal splitting and custom amount splitting for Split_Expense entries
4. THE Budget_System SHALL calculate and display total amount owed to each member
5. THE Budget_System SHALL calculate and display total amount each member owes
6. THE Budget_System SHALL provide a group view showing member avatars with owed/owing totals
7. WHEN a user clicks the settle button, THE Budget_System SHALL display a Settlement summary with payment instructions
8. THE Budget_System SHALL allow marking Split_Expense entries as settled
9. WHEN a Split_Expense is marked as settled, THE Budget_System SHALL update all member balances immediately

### Requirement 7: Expense Filtering and Organization

**User Story:** As a user reviewing expenses, I want to filter and organize my expense list, so that I can find specific expenses and analyze spending patterns.

#### Acceptance Criteria

1. THE Budget_System SHALL provide filter tabs: 全部 (All), 待支付 (Pending), 已結算 (Settled), 按類別 (By Category), 按日期 (By Date)
2. WHEN a user selects the "全部" tab, THE Budget_System SHALL display all Expense_Entry items in reverse chronological order
3. WHEN a user selects the "待支付" tab, THE Budget_System SHALL display only unsettled Split_Expense items
4. WHEN a user selects the "已結算" tab, THE Budget_System SHALL display only settled Split_Expense items
5. WHEN a user selects the "按類別" tab, THE Budget_System SHALL group expenses by Category
6. WHEN a user selects the "按日期" tab, THE Budget_System SHALL group expenses by date
7. THE Budget_System SHALL maintain filter selection when navigating away and returning to the Budget page

### Requirement 8: Integration with Existing Features

**User Story:** As an app user, I want the budget feature to integrate with my itinerary, reservations, shopping, and packing lists, so that I have a unified trip management experience.

#### Acceptance Criteria

1. WHEN a user adds a reservation in the "預約" feature, THE Budget_System SHALL allow linking the reservation cost as an Expense_Entry
2. WHEN a user adds a shopping item in the "購物" feature, THE Budget_System SHALL allow linking the purchase as an Expense_Entry
3. WHEN viewing an itinerary item in the "行程" feature, THE Budget_System SHALL display associated expenses
4. WHEN a user accesses the Budget page from the trip dashboard, THE Budget_System SHALL load the current trip's budget data
5. THE Budget_System SHALL be accessible via a bottom navigation tab labeled "預算" (Budget)
6. WHEN budget data changes, THE Budget_System SHALL broadcast updates via the collaboration system for real-time sync
7. WHEN another user updates budget data, THE Budget_System SHALL receive and display the update within 2 seconds

### Requirement 9: Real-Time Collaboration and Synchronization

**User Story:** As a group trip member, I want to see budget updates from other members in real-time, so that everyone has current spending information.

#### Acceptance Criteria

1. WHEN a user adds an Expense_Entry, THE Budget_System SHALL sync the data to PostgreSQL database within 1 second
2. WHEN another user adds an Expense_Entry, THE Budget_System SHALL receive the update via WebSocket and refresh the display within 2 seconds
3. WHEN network connectivity is unavailable, THE Budget_System SHALL store changes in Local_Storage and queue them for sync
4. WHEN network connectivity is restored, THE Budget_System SHALL sync all queued changes to PostgreSQL database automatically
5. WHEN a sync conflict occurs, THE Budget_System SHALL use the most recent timestamp to resolve the conflict
6. THE Budget_System SHALL display a sync status indicator showing online/offline/syncing states
7. WHEN a user modifies budget configuration, THE Budget_System SHALL notify all trip members via the collaboration notification system

### Requirement 10: User Interface and Visual Design

**User Story:** As a user, I want an attractive and intuitive interface with animations, so that budget tracking feels engaging rather than tedious.

#### Acceptance Criteria

1. THE Budget_System SHALL use a cute cat theme with pastel pink and beige colors
2. THE Budget_System SHALL display all cards with rounded corners and soft shadows
3. THE Budget_System SHALL display a Cat_Animation in the Budget_Dashboard that appears to eat budget pie segments
4. WHEN a user adds an expense, THE Budget_System SHALL provide immediate visual feedback with animation
5. WHEN a user reaches a spending milestone, THE Budget_System SHALL display confetti animation 
6. THE Budget_System SHALL use color-coded progress indicators (green for safe, yellow for warning, red for over budget)
7. THE Budget_System SHALL maintain a sticky Budget_Dashboard header when scrolling through expenses
8. THE Budget_System SHALL use a floating action button (FAB) for adding new expenses
9. THE Budget_System SHALL follow mobile-first design principles with responsive layouts
10. THE Budget_System SHALL ensure all interactive elements have minimum touch target size of 44x44 pixels

### Requirement 11: Bilingual Support

**User Story:** As a user who speaks Chinese or English, I want the interface in my preferred language, so that I can use the app comfortably.

#### Acceptance Criteria

1. THE Budget_System SHALL support both Traditional Chinese and English languages
2. THE Budget_System SHALL default to Traditional Chinese language
3. WHEN a user changes language preference, THE Budget_System SHALL update all text labels, buttons, and messages immediately
4. THE Budget_System SHALL persist language preference to Local_Storage
5. THE Budget_System SHALL display category names, filter tabs, and navigation labels in the selected language
6. THE Budget_System SHALL format currency amounts according to the selected language locale
7. THE Budget_System SHALL format dates according to the selected language locale

### Requirement 12: Data Persistence and Offline Support

**User Story:** As a traveler who may have intermittent internet connectivity, I want my budget data to be available offline, so that I can track expenses even without network access.

#### Acceptance Criteria

1. THE Budget_System SHALL store all budget configuration and Expense_Entry data in Local_Storage
2. WHEN the app loads, THE Budget_System SHALL load data from Local_Storage before attempting to sync with PostgreSQL database
3. WHEN network connectivity is unavailable, THE Budget_System SHALL allow full read and write operations using Local_Storage
4. THE Budget_System SHALL maintain a sync queue for changes made while offline
5. WHEN network connectivity is restored, THE Budget_System SHALL sync all queued changes to PostgreSQL database in chronological order
6. THE Budget_System SHALL handle sync conflicts by preserving the most recent change based on timestamp
7. THE Budget_System SHALL display a visual indicator when operating in offline mode

### Requirement 13: Alerts and Notifications

**User Story:** As a budget-conscious user, I want to receive alerts when I'm approaching or exceeding budget limits, so that I can adjust my spending behavior.

#### Acceptance Criteria

1. WHEN total spending reaches 70% of budget, THE Budget_System SHALL display a warning banner
2. WHEN total spending reaches 90% of budget, THE Budget_System SHALL display a critical warning banner
3. WHEN total spending exceeds 100% of budget, THE Budget_System SHALL display an over-budget alert banner
4. WHEN a Category spending exceeds its allocated budget, THE Budget_System SHALL display a category-specific warning
5. WHEN Burn_Rate exceeds planned daily budget by 20%, THE Budget_System SHALL display a burn rate warning
6. THE Budget_System SHALL allow users to dismiss warning banners
7. WHEN a dismissed warning condition persists, THE Budget_System SHALL not re-display the same warning for 24 hours

### Requirement 14: Performance and Responsiveness

**User Story:** As a mobile user, I want the budget page to load quickly and respond instantly to my actions, so that I can efficiently manage my budget on the go.

#### Acceptance Criteria

1. WHEN a user navigates to the Budget page, THE Budget_System SHALL display the Budget_Dashboard within 1 second
2. WHEN a user adds an Expense_Entry, THE Budget_System SHALL update the UI within 200 milliseconds
3. WHEN a user applies a filter, THE Budget_System SHALL update the expense list within 300 milliseconds
4. THE Budget_System SHALL render charts and visualizations within 500 milliseconds of data load
5. WHEN scrolling through expense lists, THE Budget_System SHALL maintain 60 frames per second scroll performance
6. THE Budget_System SHALL lazy-load expense cards when the list exceeds 50 items
7. THE Budget_System SHALL optimize database queries to fetch only necessary data for the current view
