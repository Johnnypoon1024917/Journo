/**
 * GroupSplitView Organism
 * 
 * Displays group expense splitting information including member balances,
 * settlement calculations, and settle button with confirmation modal.
 * Only shown for group trips with multiple members.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */

import React, { useState, useMemo } from 'react';
import { MemberBalance, Settlement, ExpenseEntry, TripMember } from '../../../types/expense';
import { budgetService } from '../../../services/budgetService';
import { MemberAvatarList } from '../molecules/MemberAvatarList';
import { BalanceSummary } from '../molecules/BalanceSummary';
import { SettleButton } from '../atoms/SettleButton';

interface GroupSplitViewProps {
  tripId: string;
  expenses: ExpenseEntry[];
  tripMembers: TripMember[];
  currency: string;
  onSettleComplete?: () => void;
}

export const GroupSplitView: React.FC<GroupSplitViewProps> = ({
  tripId,
  expenses,
  tripMembers,
  currency,
  onSettleComplete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  // Only show for group trips (multiple members)
  if (!tripMembers || tripMembers.length <= 1) {
    return null;
  }

  // Calculate member balances
  const memberBalances = useMemo(() => {
    return budgetService.calculateMemberBalances(expenses, tripMembers);
  }, [expenses, tripMembers]);

  // Calculate settlements
  const settlements = useMemo(() => {
    return budgetService.calculateSettlements(memberBalances);
  }, [memberBalances]);

  // Check if there are unsettled expenses
  const hasUnsettledExpenses = useMemo(() => {
    return expenses.some(expense => 
      expense.splitWith && 
      expense.splitWith.length > 0 && 
      !expense.isSettled
    );
  }, [expenses]);

  /**
   * Handle settle button click - open confirmation modal
   */
  const handleSettleClick = () => {
    setIsModalOpen(true);
  };

  /**
   * Handle settlement confirmation
   */
  const handleConfirmSettle = async () => {
    setIsSettling(true);
    
    try {
      // Mark all unsettled split expenses as settled
      const unsettledExpenses = expenses.filter(
        expense => expense.splitWith && expense.splitWith.length > 0 && !expense.isSettled
      );

      // Update each expense to mark as settled
      for (const expense of unsettledExpenses) {
        await budgetService.updateExpense(tripId, expense.id, {
          isSettled: true,
        });
      }

      // Close modal and notify parent
      setIsModalOpen(false);
      if (onSettleComplete) {
        onSettleComplete();
      }
    } catch (error) {
      console.error('Failed to settle expenses:', error);
      alert('Failed to settle expenses. Please try again.');
    } finally {
      setIsSettling(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    if (!isSettling) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-kawaii-sm p-6 border-2 border-[#d5d0c2] dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Group Split</h2>
          <p className="text-sm text-gray-600">
            {hasUnsettledExpenses ? 'Pending settlements' : 'All settled'}
          </p>
        </div>
      </div>

      {/* Member Balances */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Member Balances</h3>
        <MemberAvatarList members={memberBalances} currency={currency} />
      </div>

      {/* Settlement Summary */}
      <div className="mb-6">
        <BalanceSummary
          settlements={settlements}
          members={memberBalances}
          currency={currency}
        />
      </div>

      {/* Settle Button */}
      <SettleButton
        onClick={handleSettleClick}
        disabled={isSettling}
        hasUnsettledExpenses={hasUnsettledExpenses}
      />

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Settlement</h3>
                <p className="text-sm text-gray-600">Mark all expenses as settled</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to mark all group expenses as settled? This action will:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Mark all pending split expenses as settled</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Clear all member balances</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Update settlement status for all members</span>
                </li>
              </ul>
              <p className="text-sm text-amber-600 mt-4 flex items-start gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  Make sure all members have completed their payments before settling.
                </span>
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                disabled={isSettling}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettle}
                disabled={isSettling}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSettling ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Settling...
                  </span>
                ) : (
                  'Confirm Settlement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
