/**
 * BudgetPage - Main Budget Management Page
 * 
 * Composes all budget organisms into a complete page with layout integration,
 * state management, data loading, and responsive design.
 * 
 * Requirements: 8.4, 8.5, 10.9, 14.1
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Layout Components
import { PageLayout, NavigationWrapper } from '@/components/layout';
import type { NavigationTab } from '@/components/layout';

// Design System
import { Spinner } from '@/design-system/atoms/Spinner';

// Budget Organisms
import { BudgetDashboard } from '@/components/budget/organisms/BudgetDashboard';
import { BudgetSetupSection } from '@/components/budget/organisms/BudgetSetupSection';
import { ExpenseListSection } from '@/components/budget/organisms/ExpenseListSection';
import { VisualizationSection } from '@/components/budget/organisms/VisualizationSection';
import { GroupSplitView } from '@/components/budget/organisms/GroupSplitView';
import { ExpenseFormModal } from '@/components/budget/organisms/ExpenseFormModal';

// Stores
import { useBudgetStore } from '@/stores/budgetStore';
import { useEnhancedAuthStore } from '@/stores/enhancedAuthStore';

// Services
import { tripService } from '@/services/tripService';
import { budgetService } from '@/services/budgetService';

// Types
import { Trip } from '@/types/trip';
import { BudgetConfig, ExpenseEntry, TripMember } from '@/types/expense';

// Hooks
import { useToast } from '@/hooks/useToast';

// ============================================================================
// Loading Spinner Component
// ============================================================================

const LoadingSpinner: React.FC = () => {
  const { t } = useTranslation('common');
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Spinner size="xl" variant="primary" />
        <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
          {t('status.loadingBudget')}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  onGoHome,
}) => {
  const { t } = useTranslation('common');
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">😢</span>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-all shadow-md hover:shadow-lg"
            >
              {t('actions.tryAgain')}
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              {t('actions.goHome')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main BudgetPage Component
// ============================================================================

export const BudgetPage: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken, logout } = useEnhancedAuthStore();
  const { showError, showSuccess } = useToast();
  const { t } = useTranslation(['budget', 'common']);

  // Budget store
  const {
    budgetConfig,
    expenses,
    isExpenseFormOpen,
    editingExpense,
    isLoading: storeLoading,
    error: storeError,
    getBudgetSummary,
    getCategorySummaries,
    setBudgetConfig,
    setExpenses,
    setCurrentTrip,
    updateBudgetConfig,
    openExpenseForm,
    closeExpenseForm,
    setLoading,
  } = useBudgetStore();

  // Local state
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripMembers, setTripMembers] = useState<TripMember[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [navActiveTab, setNavActiveTab] = useState<NavigationTab>('budget');
  const [isSetupCollapsed, setIsSetupCollapsed] = useState(false);
  const [isVisualizationCollapsed, setIsVisualizationCollapsed] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('HKD');

  // Computed values
  const summary = getBudgetSummary();
  const categorySummaries = getCategorySummaries();

  // ========== Data Loading ==========

  /**
   * Load trip data and budget configuration
   */
  const loadTripData = useCallback(async () => {
    if (!tripId || !accessToken) {
      setDataError('Missing trip ID or authentication');
      setIsLoadingData(false);
      return;
    }

    try {
      setIsLoadingData(true);
      setDataError(null);
      setLoading(true);

      // Load trip data
      const tripResponse = await tripService.getTripById(tripId, accessToken);
      const tripData = tripResponse.data;
      setTrip(tripData);
      setCurrentTrip(tripData);

      // Load budget configuration
      try {
        const config = await budgetService.getBudgetConfig(tripId);
        if (config) {
          setBudgetConfig(config);
          setSelectedCurrency(config.tripCurrency);
          setIsSetupCollapsed(true);
        }
      } catch (configError: any) {
        // Budget config might not exist yet - that's okay
        if (configError.status !== 404) {
          console.error('Error loading budget config:', configError);
        }
      }

      // Load expenses
      try {
        const expenseList = await budgetService.getExpenses(tripId);
        setExpenses(expenseList);
      } catch (expenseError) {
        console.error('Error loading expenses:', expenseError);
        // Continue even if expenses fail to load
        setExpenses([]);
      }

      // Load trip members (for group split functionality)
      // TODO: Implement trip members API in future task
      // For now, use placeholder
      setTripMembers([]);

    } catch (err: any) {
      console.error('Error loading trip data:', err);

      // Handle authentication errors
      if (err.status === 401 || err.message?.includes('Invalid or expired token')) {
        await logout();
        showError(t('common:auth.sessionExpired'), t('common:auth.sessionExpiredMessage'));
        navigate('/login', { replace: true });
        return;
      }

      // Handle not found
      if (err.status === 404) {
        setDataError(t('common:errors.tripNotFound'));
        return;
      }

      setDataError(err.message || t('common:errors.failedToLoadData'));
    } finally {
      setIsLoadingData(false);
      setLoading(false);
    }
  }, [tripId, accessToken, setBudgetConfig, setExpenses, setCurrentTrip, setLoading, logout, showError, navigate]);

  // Load data on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    loadTripData();
  }, [loadTripData]);

  // ========== Event Handlers ==========

  /**
   * Handle currency change
   */
  const handleCurrencyChange = useCallback((currency: string) => {
    setSelectedCurrency(currency);
    // TODO: Implement currency conversion in task 12
  }, []);

  /**
   * Handle budget configuration save
   */
  const handleBudgetConfigSave = useCallback(async (updates: Partial<BudgetConfig>) => {
    if (!tripId) return;

    try {
      if (budgetConfig) {
        // Update existing config
        await updateBudgetConfig(updates);
        showSuccess(t('common:status.success'), t('budget:form.success'));
      } else {
        // Create new config
        const newConfig = await budgetService.createBudgetConfig({
          tripId,
          totalBudget: updates.totalBudget || 0,
          tripCurrency: selectedCurrency,
          categoryAllocations: updates.categoryAllocations || [],
        });
        setBudgetConfig(newConfig);
        setIsSetupCollapsed(true);
        showSuccess(t('common:status.success'), t('budget:form.success'));
      }
    } catch (error) {
      console.error('Error saving budget config:', error);
      showError(t('common:status.error'), t('budget:form.error'));
      throw error;
    }
  }, [tripId, budgetConfig, selectedCurrency, updateBudgetConfig, setBudgetConfig, showSuccess, showError, t]);

  /**
   * Handle add expense button click
   */
  const handleAddExpense = useCallback(() => {
    openExpenseForm();
  }, [openExpenseForm]);

  /**
   * Handle edit expense
   */
  const handleEditExpense = useCallback((expense: ExpenseEntry) => {
    openExpenseForm(expense);
  }, [openExpenseForm]);

  /**
   * Handle delete expense
   */
  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    if (!confirm(t('budget:expenses.confirmDelete'))) {
      return;
    }

    try {
      await budgetService.deleteExpense(tripId!, expenseId);
      
      // Remove from local state
      setExpenses(expenses.filter(e => e.id !== expenseId));
      
      showSuccess(t('common:status.success'), t('budget:form.success'));
    } catch (error) {
      console.error('Error deleting expense:', error);
      showError(t('common:status.error'), t('budget:form.error'));
    }
  }, [tripId, expenses, setExpenses, showSuccess, showError, t]);

  /**
   * Handle expense form success
   */
  const handleExpenseFormSuccess = useCallback(() => {
    // Reload expenses
    loadTripData();
  }, [loadTripData]);

  /**
   * Handle settlement complete
   */
  const handleSettlementComplete = useCallback(() => {
    // Reload expenses to reflect settlement
    loadTripData();
    showSuccess(t('common:status.success'), t('budget:groupSplit.allSettled'));
  }, [loadTripData, showSuccess, t]);

  /**
   * Handle navigation tab change
   */
  const handleNavTabChange = useCallback((tab: NavigationTab) => {
    setNavActiveTab(tab);

    switch (tab) {
      case 'schedule':
        navigate(`/trips/${tripId}`);
        break;
      case 'booking':
        navigate(`/trips/${tripId}/booking`);
        break;
      case 'shopping':
        navigate(`/trips/${tripId}/shopping`);
        break;
      case 'checklist':
        navigate(`/trips/${tripId}/checklist`);
        break;
      case 'members':
        navigate(`/trips/${tripId}/members`);
        break;
      case 'settings':
        navigate('/settings');
        break;
    }
  }, [tripId, navigate]);

  // ========== Render ==========

  // Loading state
  if (isLoadingData || storeLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (dataError || storeError || !trip) {
    return (
      <ErrorDisplay
        message={dataError || storeError || 'Trip not found'}
        onRetry={dataError ? loadTripData : undefined}
        onGoHome={() => navigate('/')}
      />
    );
  }

  return (
    <NavigationWrapper activeTab={navActiveTab} onTabChange={handleNavTabChange}>
      <PageLayout tripId={tripId} showStickers={false}>
        {/* Main Content */}
        <div className="min-h-screen">{/* Use default NavigationWrapper background */}
          <div className="max-w-7xl mx-auto">
            {/* Budget Dashboard (Sticky Header) */}
            {summary && (
              <BudgetDashboard
                tripId={tripId!}
                tripTitle={trip.title}
                summary={summary}
                currency={selectedCurrency}
                onCurrencyChange={handleCurrencyChange}
              />
            )}

            {/* Content Sections */}
            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {/* Budget Setup Section */}
              <BudgetSetupSection
                budgetConfig={budgetConfig}
                onSave={handleBudgetConfigSave}
                isCollapsed={isSetupCollapsed}
                onToggleCollapse={() => setIsSetupCollapsed(!isSetupCollapsed)}
              />

              {/* Only show remaining sections if budget is configured */}
              {budgetConfig && (
                <>
                  {/* Expense List Section */}
                  <ExpenseListSection
                    expenses={expenses}
                    homeCurrency={budgetConfig.homeCurrency}
                    exchangeRate={1} // TODO: Implement in task 12
                    onAddExpense={handleAddExpense}
                    onEditExpense={handleEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                  />

                  {/* Visualization Section */}
                  {expenses.length > 0 && (
                    <VisualizationSection
                      categorySummaries={categorySummaries}
                      expenses={expenses}
                      totalBudget={budgetConfig.totalBudget}
                      currency={selectedCurrency}
                      tripStartDate={trip.start_date || undefined}
                      tripEndDate={trip.end_date || undefined}
                      isCollapsed={isVisualizationCollapsed}
                      onToggleCollapse={() => setIsVisualizationCollapsed(!isVisualizationCollapsed)}
                    />
                  )}

                  {/* Group Split View (only for group trips) */}
                  {tripMembers.length > 1 && (
                    <GroupSplitView
                      tripId={tripId!}
                      expenses={expenses}
                      tripMembers={tripMembers}
                      currency={selectedCurrency}
                      onSettleComplete={handleSettlementComplete}
                    />
                  )}
                </>
              )}

              {/* Empty State - No Budget Configured */}
              {!budgetConfig && (
                <div className="text-center py-16 px-4">
                  <div className="inline-block mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                      <span className="text-5xl">💰</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {t('budget:empty.noBudget')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                    {t('budget:empty.noBudgetDescription')}
                  </p>
                  <button
                    onClick={() => setIsSetupCollapsed(false)}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                  >
                    {t('budget:empty.getStarted')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expense Form Modal */}
        <ExpenseFormModal
          isOpen={isExpenseFormOpen}
          onClose={closeExpenseForm}
          tripId={tripId!}
          tripMembers={tripMembers}
          currency={selectedCurrency}
          initialData={editingExpense || undefined}
          onSuccess={handleExpenseFormSuccess}
        />
      </PageLayout>
    </NavigationWrapper>
  );
};

export default BudgetPage;
