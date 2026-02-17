import React, { useState, useEffect, useMemo } from 'react';
import { TotalBudgetInput } from '../molecules/TotalBudgetInput';
import { CategoryAllocationItem } from '../molecules/CategoryAllocationItem';
import { BudgetPieChart } from '../molecules/BudgetPieChart';
import { BudgetCategory } from '../../../types/trip';
import { CategoryAllocation, BudgetConfig } from '../../../types/expense';

interface BudgetSetupSectionProps {
  budgetConfig: BudgetConfig | null;
  onSave: (config: Partial<BudgetConfig>) => Promise<void>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

// Default category allocations (Requirements 1.3)
const DEFAULT_ALLOCATIONS: Record<BudgetCategory, number> = {
  flights: 30,
  accommodation: 25,
  food: 15,
  transport: 10,
  activities: 10,
  shopping: 5,
  misc: 5,
};

const CATEGORY_ORDER: BudgetCategory[] = [
  'flights',
  'accommodation',
  'food',
  'transport',
  'activities',
  'shopping',
  'misc',
];

export const BudgetSetupSection: React.FC<BudgetSetupSectionProps> = ({
  budgetConfig,
  onSave,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  // Local state for editing
  const [totalBudget, setTotalBudget] = useState<number>(budgetConfig?.totalBudget || 0);
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Initialize allocations from config or defaults
  useEffect(() => {
    if (budgetConfig?.categoryAllocations && budgetConfig.categoryAllocations.length > 0) {
      setAllocations(budgetConfig.categoryAllocations);
      setTotalBudget(budgetConfig.totalBudget);
    } else {
      // Create default allocations
      const defaultAllocations: CategoryAllocation[] = CATEGORY_ORDER.map(category => ({
        category,
        percentage: DEFAULT_ALLOCATIONS[category],
        allocatedAmount: 0,
      }));
      setAllocations(defaultAllocations);
    }
  }, [budgetConfig]);

  // Recalculate allocated amounts when total budget or percentages change
  useEffect(() => {
    if (totalBudget > 0) {
      setAllocations(prev =>
        prev.map(allocation => ({
          ...allocation,
          allocatedAmount: (allocation.percentage / 100) * totalBudget,
        }))
      );
    }
  }, [totalBudget]);

  // Validate allocation sum (Requirements 1.4)
  const allocationSum = useMemo(() => {
    return allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
  }, [allocations]);

  const isAllocationValid = useMemo(() => {
    return Math.abs(allocationSum - 100) < 0.01; // Allow for floating point errors
  }, [allocationSum]);

  const isBudgetValid = useMemo(() => {
    return totalBudget > 0;
  }, [totalBudget]);

  const canSave = useMemo(() => {
    return isBudgetValid && isAllocationValid && !isSaving;
  }, [isBudgetValid, isAllocationValid, isSaving]);

  // Handle total budget change
  const handleTotalBudgetChange = (value: number) => {
    setTotalBudget(value);
    setValidationError('');
  };

  // Handle category percentage change
  const handlePercentageChange = (category: BudgetCategory, percentage: number) => {
    setAllocations(prev =>
      prev.map(allocation =>
        allocation.category === category
          ? {
              ...allocation,
              percentage,
              allocatedAmount: (percentage / 100) * totalBudget,
            }
          : allocation
      )
    );
    setValidationError('');
  };

  // Handle save
  const handleSave = async () => {
    // Validate
    if (!isBudgetValid) {
      setValidationError('Please enter a valid budget amount greater than 0');
      return;
    }

    if (!isAllocationValid) {
      setValidationError(
        `Category allocations must sum to 100% (current: ${allocationSum.toFixed(1)}%)`
      );
      return;
    }

    setIsSaving(true);
    setValidationError('');

    try {
      await onSave({
        totalBudget,
        categoryAllocations: allocations,
      });
    } catch (error) {
      console.error('Failed to save budget config:', error);
      setValidationError(
        error instanceof Error ? error.message : 'Failed to save budget configuration'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Render collapsed state
  if (isCollapsed) {
    return (
      <div className={`rounded-2xl border-2 border-[#d5d0c2] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-bubblequest-sm ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
          aria-expanded="false"
          aria-label="Expand budget setup section"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Budget Setup</h3>
              {budgetConfig && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {budgetConfig.tripCurrency} {budgetConfig.totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  // Render expanded state
  return (
    <div className={`rounded-2xl border-2 border-[#d5d0c2] dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-bubblequest-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b-2 border-[#d5d0c2] dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Budget Setup</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure your trip budget and category allocations
              </p>
            </div>
          </div>
          {onToggleCollapse && budgetConfig && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-expanded="true"
              aria-label="Collapse budget setup section"
            >
              <svg className="w-5 h-5 text-gray-400 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Total Budget Input */}
        <div>
          <TotalBudgetInput
            value={totalBudget}
            currency={budgetConfig?.tripCurrency || 'HKD'}
            onChange={handleTotalBudgetChange}
            label="Total Trip Budget"
            placeholder="Enter your total budget"
            error={!isBudgetValid && totalBudget === 0 ? 'Budget must be greater than 0' : undefined}
          />
        </div>

        {/* Category Allocations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Category Allocations
            </h4>
            <div className={`text-sm font-medium ${
              isAllocationValid 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              Total: {allocationSum.toFixed(1)}%
              {isAllocationValid && (
                <svg className="inline-block w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {allocations.map(allocation => (
              <CategoryAllocationItem
                key={allocation.category}
                category={allocation.category}
                percentage={allocation.percentage}
                allocatedAmount={allocation.allocatedAmount}
                currency={budgetConfig?.tripCurrency || 'HKD'}
                onPercentageChange={handlePercentageChange}
              />
            ))}
          </div>
        </div>

        {/* Budget Pie Chart */}
        {totalBudget > 0 && allocations.length > 0 && (
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Budget Visualization
            </h4>
            <BudgetPieChart
              categoryAllocations={allocations}
              currency={budgetConfig?.tripCurrency || 'HKD'}
              height={300}
              showLegend={true}
            />
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{validationError}</p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              canSave
                ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Save budget configuration"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Budget Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
