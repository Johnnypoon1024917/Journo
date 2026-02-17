/**
 * MemberAvatarList Component
 * 
 * Displays a list of trip members with their avatars and balance information
 * Used in the GroupSplitView organism for group expense splitting
 * 
 * Requirements: 6.6
 */

import React from 'react';
import { MemberBalance } from '../../../types/expense';

interface MemberAvatarListProps {
  members: MemberBalance[];
  currency: string;
}

export const MemberAvatarList: React.FC<MemberAvatarListProps> = ({
  members,
  currency,
}) => {
  /**
   * Format currency amount with proper sign
   */
  const formatBalance = (balance: number): string => {
    const absBalance = Math.abs(balance);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absBalance);

    if (balance > 0) {
      return `+${formatted}`;
    } else if (balance < 0) {
      return `-${formatted}`;
    }
    return formatted;
  };

  /**
   * Get color class based on balance
   */
  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  /**
   * Get avatar initials from name
   */
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-pink-300 transition-colors"
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-pink-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center border-2 border-pink-300">
                <span className="text-sm font-semibold text-purple-700">
                  {getInitials(member.userName)}
                </span>
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {member.userName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
              <span>Paid: {formatBalance(member.totalPaid)}</span>
              <span className="text-gray-400">•</span>
              <span>Owes: {formatBalance(member.totalOwed)}</span>
            </div>
          </div>

          {/* Net Balance */}
          <div className="flex-shrink-0 text-right">
            <div className={`text-sm font-semibold ${getBalanceColor(member.netBalance)}`}>
              {formatBalance(member.netBalance)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {member.netBalance > 0 ? 'is owed' : member.netBalance < 0 ? 'owes' : 'settled'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
