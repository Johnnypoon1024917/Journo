import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BudgetCategory } from '../../../types/trip';
import { CategorySummary } from '../../../types/expense';

interface CategoryComparisonChartProps {
  categorySummaries: CategorySummary[];
  currency: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  flights: '#87CEEB', // Sky blue
  accommodation: '#DDA0DD', // Plum
  food: '#FFB6C1', // Pink
  transport: '#98FB98', // Pale green
  activities: '#FFD700', // Gold
  shopping: '#FFA07A', // Light salmon
  misc: '#D3D3D3', // Light gray
};

const CATEGORY_LABELS: Record<BudgetCategory, { short: string; full: string }> = {
  flights: { short: 'Flights', full: 'Flights' },
  accommodation: { short: 'Accom', full: 'Accommodation' },
  food: { short: 'Food', full: 'Food' },
  transport: { short: 'Trans', full: 'Transport' },
  activities: { short: 'Activity', full: 'Activities' },
  shopping: { short: 'Shop', full: 'Shopping' },
  misc: { short: 'Misc', full: 'Miscellaneous' },
};

interface ChartData {
  category: string;
  categoryKey: BudgetCategory;
  allocated: number;
  spent: number;
  color: string;
}

export const CategoryComparisonChart: React.FC<CategoryComparisonChartProps> = React.memo(({
  categorySummaries,
  currency,
  width,
  height = 300,
  showLegend = true,
  className = '',
}) => {
  const chartData: ChartData[] = useMemo(() => {
    return categorySummaries
      .filter(summary => summary.allocated > 0)
      .map(summary => ({
        category: CATEGORY_LABELS[summary.category].short,
        categoryKey: summary.category,
        allocated: summary.allocated,
        spent: summary.spent,
        color: CATEGORY_COLORS[summary.category],
      }));
  }, [categorySummaries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const fullLabel = CATEGORY_LABELS[data.categoryKey].full;
      
      return (
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {fullLabel}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Allocated:</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {currency} {data.allocated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Spent:</span>
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                {currency} {data.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Remaining:</span>
              <span className={`text-sm font-medium ${data.spent > data.allocated ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {currency} {Math.abs(data.allocated - data.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {data.spent > data.allocated && ' over'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="flex justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-blue-400" />
        <span className="text-xs text-gray-700 dark:text-gray-300">Allocated</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-pink-400" />
        <span className="text-xs text-gray-700 dark:text-gray-300">Spent</span>
      </div>
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No category data</p>
          <p className="text-xs mt-1">Add expenses to see the comparison</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width={width || '100%'} height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="category"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}k`;
              }
              return value.toString();
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          {showLegend && <Legend content={<CustomLegend />} />}
          <Bar
            dataKey="allocated"
            fill="#60A5FA"
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
          <Bar
            dataKey="spent"
            fill="#F472B6"
            radius={[8, 8, 0, 0]}
            animationBegin={200}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

CategoryComparisonChart.displayName = 'CategoryComparisonChart';
