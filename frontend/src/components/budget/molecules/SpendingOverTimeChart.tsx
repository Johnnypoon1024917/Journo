import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ExpenseEntry } from '../../../types/expense';

interface SpendingOverTimeChartProps {
  expenses: ExpenseEntry[];
  totalBudget: number;
  currency: string;
  tripStartDate?: string;
  tripEndDate?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  cumulative: number;
  daily: number;
}

export const SpendingOverTimeChart: React.FC<SpendingOverTimeChartProps> = React.memo(({
  expenses,
  totalBudget,
  currency,
  tripStartDate,
  tripEndDate,
  width,
  height = 300,
  showLegend = true,
  className = '',
}) => {
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (expenses.length === 0) return [];

    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group expenses by date and calculate cumulative spending
    const expensesByDate = new Map<string, number>();
    sortedExpenses.forEach(expense => {
      const date = expense.date.split('T')[0]; // Get YYYY-MM-DD
      const current = expensesByDate.get(date) || 0;
      expensesByDate.set(date, current + expense.amount);
    });

    // Create data points with cumulative totals
    let cumulative = 0;
    const dataPoints: ChartDataPoint[] = [];
    
    // Sort dates and create chart data
    const sortedDates = Array.from(expensesByDate.keys()).sort();
    sortedDates.forEach(date => {
      const daily = expensesByDate.get(date) || 0;
      cumulative += daily;
      
      // Format date for display (MM/DD)
      const dateObj = new Date(date);
      const displayDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      
      dataPoints.push({
        date,
        displayDate,
        cumulative,
        daily,
      });
    });

    return dataPoints;
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dateObj = new Date(data.date);
      const fullDate = dateObj.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      return (
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {fullDate}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Daily:</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {currency} {data.daily.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                {currency} {data.cumulative.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Remaining:</span>
              <span className={`text-sm font-medium ${data.cumulative > totalBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {currency} {Math.abs(totalBudget - data.cumulative).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {data.cumulative > totalBudget && ' over'}
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
        <div className="w-4 h-1 rounded bg-pink-400" />
        <span className="text-xs text-gray-700 dark:text-gray-300">Cumulative Spending</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-1 rounded bg-gray-400 border-t-2 border-dashed border-gray-600" />
        <span className="text-xs text-gray-700 dark:text-gray-300">Budget Limit</span>
      </div>
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No spending data</p>
          <p className="text-xs mt-1">Add expenses to see spending over time</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width={width || '100%'} height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="displayDate"
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
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={<CustomLegend />} />}
          
          {/* Budget limit reference line */}
          <ReferenceLine
            y={totalBudget}
            stroke="#9CA3AF"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Budget',
              position: 'right',
              fill: '#6B7280',
              fontSize: 12,
            }}
          />
          
          {/* Cumulative spending line */}
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#F472B6"
            strokeWidth={3}
            dot={{ fill: '#F472B6', r: 4 }}
            activeDot={{ r: 6 }}
            animationBegin={0}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

SpendingOverTimeChart.displayName = 'SpendingOverTimeChart';
