import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BudgetCategory } from '../../../types/trip';
import { CategoryAllocation } from '../../../types/expense';

interface BudgetPieChartProps {
  categoryAllocations: CategoryAllocation[];
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

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  flights: 'Flights',
  accommodation: 'Accommodation',
  food: 'Food',
  transport: 'Transport',
  activities: 'Activities',
  shopping: 'Shopping',
  misc: 'Miscellaneous',
};

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export const BudgetPieChart: React.FC<BudgetPieChartProps> = React.memo(({
  categoryAllocations,
  currency,
  width,
  height = 300,
  showLegend = true,
  className = '',
}) => {
  const chartData: ChartData[] = useMemo(() => {
    return categoryAllocations
      .filter(allocation => allocation.percentage > 0)
      .map(allocation => ({
        name: CATEGORY_LABELS[allocation.category],
        value: allocation.allocatedAmount,
        percentage: allocation.percentage,
        color: CATEGORY_COLORS[allocation.category],
      }));
  }, [categoryAllocations]);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    // Only show label if percentage is significant enough
    if (percentage < 5) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currency} {data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No budget allocations</p>
          <p className="text-xs mt-1">Set up your budget to see the chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width={width || '100%'} height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={height / 3}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={renderLegend} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

BudgetPieChart.displayName = 'BudgetPieChart';
