/**
 * BalanceSummary Component
 * 
 * Displays settlement summary showing who owes whom and how much
 * Used in the GroupSplitView organism for group expense splitting
 * 
 * Requirements: 6.7
 */

import React from 'react';
import { Settlement, MemberBalance } from '../../../types/expense';

interface BalanceSummaryProps {
  settlements: Settlement[];
  members: MemberBalance[];
  currency: string;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  settlements,
  members,
  currency,
}) => {
  /**
   * Format currency amount
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Get member name by user ID
   */
  const getMemberName = (userId: string): string => {
    const member = members.find(m => m.userId === userId);
    return member?.userName || 'Unknown';
  };

  /**
   * Get member initials
   */
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * Get member avatar URL
   */
  const getMemberAvatar = (userId: string): string | undefined => {
    const member = members.find(m => m.userId === userId);
    return member?.avatarUrl;
  };

  if (settlements.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-1">
            All Settled! 🎉
          </h3>
          <p className="text-sm text-green-700">
            Everyone's expenses are balanced
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Settlement Instructions
      </h3>
      
      {settlements.map((settlement, index) => {
        const fromName = getMemberName(settlement.from);
        const toName = getMemberName(settlement.to);
        const fromAvatar = getMemberAvatar(settlement.from);
        const toAvatar = getMemberAvatar(settlement.to);

        return (
          <div
            key={`${settlement.from}-${settlement.to}-${index}`}
            className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200"
          >
            <div className="flex items-center gap-3">
              {/* From Member */}
              <div className="flex items-center gap-2 flex-1">
                {fromAvatar ? (
                  <img
                    src={fromAvatar}
                    alt={fromName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-pink-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-2 border-pink-300">
                    <span className="text-xs font-semibold text-purple-700">
                      {getInitials(fromName)}
                    </span>
                  </div>
                )}
                <span className="font-medium text-gray-900 truncate">
                  {fromName}
                </span>
              </div>

              {/* Arrow and Amount */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-pink-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
                <span className="font-bold text-pink-600 text-lg">
                  {formatAmount(settlement.amount)}
                </span>
                <svg
                  className="w-5 h-5 text-pink-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>

              {/* To Member */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="font-medium text-gray-900 truncate">
                  {toName}
                </span>
                {toAvatar ? (
                  <img
                    src={toAvatar}
                    alt={toName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-pink-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-2 border-pink-300">
                    <span className="text-xs font-semibold text-purple-700">
                      {getInitials(toName)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment instruction text */}
            <div className="mt-2 text-sm text-gray-600 text-center">
              <span className="font-medium">{fromName}</span> pays{' '}
              <span className="font-medium">{toName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
