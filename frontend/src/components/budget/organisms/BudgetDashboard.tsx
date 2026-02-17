import React, { useEffect, useState, useRef } from 'react';
import { BudgetProgressRing } from '../molecules/BudgetProgressRing';
import { CatEatingAnimation } from '../molecules/CatEatingAnimation';
import { AlertBanner, AlertType } from '../molecules/AlertBanner';
import { CurrencySelector } from '../molecules/CurrencySelector';
import { StatCard } from '../atoms/StatCard';
import { BurnRateIndicator } from '../atoms/BurnRateIndicator';
import { TripTitle } from '../atoms/TripTitle';
import { BudgetPageSummary } from '../../../types/expense';

interface BudgetDashboardProps {
  tripId: string;
  tripTitle: string;
  summary: BudgetPageSummary;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

interface AlertState {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  dismissedAt?: number;
}

const ALERT_SUPPRESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  tripId,
  tripTitle,
  summary,
  currency,
  onCurrencyChange,
  className = '',
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, number>>({});
  const dashboardRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load dismissed alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`budget-dismissed-alerts-${tripId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out expired dismissals
        const now = Date.now();
        const filtered = Object.entries(parsed).reduce((acc, [key, timestamp]) => {
          if (now - (timestamp as number) < ALERT_SUPPRESSION_DURATION) {
            acc[key] = timestamp as number;
          }
          return acc;
        }, {} as Record<string, number>);
        setDismissedAlerts(filtered);
      } catch (e) {
        console.error('Failed to parse dismissed alerts:', e);
      }
    }
  }, [tripId]);

  // Save dismissed alerts to localStorage
  useEffect(() => {
    if (Object.keys(dismissedAlerts).length > 0) {
      localStorage.setItem(
        `budget-dismissed-alerts-${tripId}`,
        JSON.stringify(dismissedAlerts)
      );
    }
  }, [dismissedAlerts, tripId]);

  // Implement sticky header behavior using Intersection Observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px',
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Generate alerts based on budget thresholds
  const generateAlerts = (): AlertState[] => {
    const alerts: AlertState[] = [];
    const now = Date.now();

    // Budget threshold alerts (Requirements 13.1, 13.2, 13.3)
    if (summary.percentageSpent >= 100) {
      const alertId = 'over-budget';
      if (!dismissedAlerts[alertId] || now - dismissedAlerts[alertId] >= ALERT_SUPPRESSION_DURATION) {
        alerts.push({
          id: alertId,
          type: 'danger',
          title: '⚠️ Budget Exceeded',
          message: `You've exceeded your budget by ${currency} ${Math.abs(summary.remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}. Consider adjusting your spending or increasing your budget.`,
        });
      }
    } else if (summary.percentageSpent >= 90) {
      const alertId = 'critical-warning';
      if (!dismissedAlerts[alertId] || now - dismissedAlerts[alertId] >= ALERT_SUPPRESSION_DURATION) {
        alerts.push({
          id: alertId,
          type: 'danger',
          title: '⚠️ Critical Budget Warning',
          message: `You've used ${summary.percentageSpent.toFixed(0)}% of your budget. Only ${currency} ${summary.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining.`,
        });
      }
    } else if (summary.percentageSpent >= 70) {
      const alertId = 'budget-warning';
      if (!dismissedAlerts[alertId] || now - dismissedAlerts[alertId] >= ALERT_SUPPRESSION_DURATION) {
        alerts.push({
          id: alertId,
          type: 'warning',
          title: '⚡ Budget Warning',
          message: `You've used ${summary.percentageSpent.toFixed(0)}% of your budget. ${currency} ${summary.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining.`,
        });
      }
    }

    // Burn rate warning (Requirement 13.5)
    const plannedDailyBudget = summary.daysElapsed > 0 
      ? summary.totalBudget / (summary.daysElapsed + summary.daysRemaining)
      : 0;
    
    if (plannedDailyBudget > 0 && summary.burnRate > plannedDailyBudget * 1.2) {
      const alertId = 'burn-rate-warning';
      if (!dismissedAlerts[alertId] || now - dismissedAlerts[alertId] >= ALERT_SUPPRESSION_DURATION) {
        alerts.push({
          id: alertId,
          type: 'warning',
          title: '🔥 High Burn Rate',
          message: `Your daily spending (${currency} ${summary.burnRate.toFixed(2)}) is 20% higher than planned (${currency} ${plannedDailyBudget.toFixed(2)}). At this rate, you'll exceed your budget.`,
        });
      }
    }

    return alerts;
  };

  const alerts = generateAlerts();

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => ({
      ...prev,
      [alertId]: Date.now(),
    }));
  };

  // Calculate planned daily budget for burn rate indicator
  const plannedDailyBudget = summary.daysElapsed > 0 
    ? summary.totalBudget / (summary.daysElapsed + summary.daysRemaining)
    : 0;

  return (
    <>
      {/* Sentinel element for sticky detection */}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      {/* Dashboard container */}
      <div
        ref={dashboardRef}
        className={`transition-all duration-300 ${
          isSticky
            ? 'sticky top-0 z-40 shadow-lg border-b-2 border-[#d5d0c2] dark:border-gray-700 bg-[#f7f3eb] dark:bg-gray-900'
            : 'bg-transparent'
        } ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 md:py-6">
          {/* Header with title and currency selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3 md:mb-6">
            <TripTitle title={tripTitle} className="flex-1" />
            <div className="w-full sm:w-64">
              <CurrencySelector
                selectedCurrency={currency}
                onCurrencyChange={onCurrencyChange}
                label=""
                className="w-full"
              />
            </div>
          </div>

          {/* Main dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left column: Progress Ring and Cat Animation */}
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-6">
              <div className="block sm:hidden">
                {/* Extra small ring for mobile */}
                <BudgetProgressRing
                  totalBudget={summary.totalBudget}
                  spent={summary.totalSpent}
                  remaining={summary.remaining}
                  currency={currency}
                  percentageSpent={summary.percentageSpent}
                  status={summary.status}
                  size="xs"
                  showAnimation={!isSticky}
                />
              </div>
              <div className="hidden sm:block">
                {/* Regular size for tablet and desktop */}
                <BudgetProgressRing
                  totalBudget={summary.totalBudget}
                  spent={summary.totalSpent}
                  remaining={summary.remaining}
                  currency={currency}
                  percentageSpent={summary.percentageSpent}
                  status={summary.status}
                  size={isSticky ? 'sm' : 'md'}
                  showAnimation={!isSticky}
                />
              </div>
              {!isSticky && (
                <CatEatingAnimation
                  percentageSpent={summary.percentageSpent}
                  size="md"
                />
              )}
            </div>

            {/* Right column: Stats and Burn Rate */}
            <div className="space-y-3 sm:space-y-4">
              {/* Budget Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatCard
                  label="Days Elapsed"
                  value={summary.daysElapsed}
                  subValue={`${summary.daysRemaining} days left`}
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
                <StatCard
                  label="Projected Total"
                  value={`${currency} ${summary.projectedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  subValue={
                    summary.projectedTotal > summary.totalBudget
                      ? `${((summary.projectedTotal / summary.totalBudget - 1) * 100).toFixed(0)}% over`
                      : 'On track'
                  }
                  variant={
                    summary.projectedTotal > summary.totalBudget * 1.1
                      ? 'danger'
                      : summary.projectedTotal > summary.totalBudget
                      ? 'warning'
                      : 'success'
                  }
                  icon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  }
                />
              </div>

              {/* Burn Rate Indicator */}
              <BurnRateIndicator
                burnRate={summary.burnRate}
                plannedRate={plannedDailyBudget}
                currency={currency}
              />
            </div>
          </div>

          {/* Alert Banners */}
          {alerts.length > 0 && (
            <div className="mt-3 sm:mt-6 space-y-2 sm:space-y-3">
              {alerts.map((alert) => (
                <AlertBanner
                  key={alert.id}
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  dismissible={true}
                  onDismiss={() => handleDismissAlert(alert.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
