import React, { useState } from 'react';
import { TripMember, SplitType, CustomSplit } from '../../../types/expense';

interface SplitSelectorProps {
  tripMembers: TripMember[];
  paidBy?: string;
  splitWith?: string[];
  splitType?: SplitType;
  customSplits?: CustomSplit[];
  totalAmount: number;
  onPaidByChange: (userId: string) => void;
  onSplitWithChange: (userIds: string[]) => void;
  onSplitTypeChange: (type: SplitType) => void;
  onCustomSplitsChange: (splits: CustomSplit[]) => void;
  error?: string;
  className?: string;
}

export const SplitSelector: React.FC<SplitSelectorProps> = ({
  tripMembers,
  paidBy,
  splitWith = [],
  splitType = 'equal',
  customSplits = [],
  totalAmount,
  onPaidByChange,
  onSplitWithChange,
  onSplitTypeChange,
  onCustomSplitsChange,
  error,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePaidByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPaidByChange(e.target.value);
  };

  const handleMemberToggle = (userId: string) => {
    if (splitWith.includes(userId)) {
      onSplitWithChange(splitWith.filter(id => id !== userId));
      // Remove from custom splits if exists
      if (splitType === 'custom') {
        onCustomSplitsChange(customSplits.filter(split => split.userId !== userId));
      }
    } else {
      onSplitWithChange([...splitWith, userId]);
      // Add to custom splits with equal amount if custom split type
      if (splitType === 'custom') {
        const equalAmount = totalAmount / (splitWith.length + 1);
        onCustomSplitsChange([...customSplits, { userId, amount: equalAmount }]);
      }
    }
  };

  const handleSplitTypeChange = (type: SplitType) => {
    onSplitTypeChange(type);
    if (type === 'custom' && splitWith.length > 0) {
      // Initialize custom splits with equal amounts
      const equalAmount = totalAmount / splitWith.length;
      const newCustomSplits = splitWith.map(userId => ({
        userId,
        amount: equalAmount,
      }));
      onCustomSplitsChange(newCustomSplits);
    }
  };

  const handleCustomAmountChange = (userId: string, amount: number) => {
    const updatedSplits = customSplits.map(split =>
      split.userId === userId ? { ...split, amount } : split
    );
    onCustomSplitsChange(updatedSplits);
  };

  const getEqualSplitAmount = () => {
    if (splitWith.length === 0) return 0;
    return totalAmount / splitWith.length;
  };

  const getCustomSplitTotal = () => {
    return customSplits.reduce((sum, split) => sum + split.amount, 0);
  };

  const customSplitDifference = totalAmount - getCustomSplitTotal();
  const hasCustomSplitError = Math.abs(customSplitDifference) > 0.01;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle Split Options */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Split Expense
        </label>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
            isExpanded || splitWith.length > 0
              ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          {isExpanded || splitWith.length > 0 ? (
            <>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {splitWith.length > 0 ? `Split with ${splitWith.length}` : 'Enable'}
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Split
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          {/* Paid By */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Paid By
            </label>
            <select
              value={paidBy || ''}
              onChange={handlePaidByChange}
              className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-pink-300 dark:focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800"
            >
              <option value="">Select who paid...</option>
              {tripMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Split With */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Split With
            </label>
            <div className="space-y-2">
              {tripMembers.map(member => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:border-pink-300 dark:hover:border-pink-600 transition-colors duration-200"
                >
                  <input
                    type="checkbox"
                    checked={splitWith.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-300 dark:focus:ring-pink-600"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-700 dark:text-pink-300 font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-900 dark:text-white font-medium">
                      {member.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Split Type */}
          {splitWith.length > 0 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Split Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSplitTypeChange('equal')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      splitType === 'equal'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSplitTypeChange('custom')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      splitType === 'custom'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Custom Split
                  </button>
                </div>
              </div>

              {/* Split Preview */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Split Preview
                </label>
                <div className="space-y-2">
                  {splitType === 'equal' ? (
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Each person pays:
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {getEqualSplitAmount().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {splitWith.map(userId => {
                        const member = tripMembers.find(m => m.id === userId);
                        const split = customSplits.find(s => s.userId === userId);
                        return (
                          <div
                            key={userId}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700"
                          >
                            <span className="text-sm text-gray-900 dark:text-white flex-1">
                              {member?.name}
                            </span>
                            <input
                              type="number"
                              value={split?.amount || 0}
                              onChange={(e) => handleCustomAmountChange(userId, parseFloat(e.target.value) || 0)}
                              step="0.01"
                              min="0"
                              className="w-24 px-3 py-1 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right font-semibold focus:border-pink-300 dark:focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800"
                            />
                          </div>
                        );
                      })}
                      <div className={`p-3 rounded-lg border-2 ${
                        hasCustomSplitError
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {hasCustomSplitError ? 'Difference:' : 'Total matches!'}
                          </span>
                          <span className={`text-lg font-bold ${
                            hasCustomSplitError
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-green-700 dark:text-green-300'
                          }`}>
                            {hasCustomSplitError ? customSplitDifference.toFixed(2) : '✓'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
