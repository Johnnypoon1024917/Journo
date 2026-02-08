import { Trip, Place } from '../types/trip';
import { BudgetSummary, CategorySpending, DailySpending } from './budgetService';
import { getCurrencySymbol } from '../constants/currencies';

class BudgetExportService {
  /**
   * Export budget as CSV
   */
  exportCSV(
    trip: Trip,
    places: Place[],
    days: Array<{ id: string; day_number: number; date: string | null }>
  ): void {

    // CSV Header
    const headers = ['Date', 'Day', 'Place', 'Category', 'Cost', 'Currency', 'Notes'];
    const rows: string[][] = [headers];

    // Group places by day
    const placesByDay: Record<string, Place[]> = {};
    places.forEach((place) => {
      if (!placesByDay[place.trip_day_id]) {
        placesByDay[place.trip_day_id] = [];
      }
      placesByDay[place.trip_day_id].push(place);
    });

    // Add data rows
    days.forEach((day) => {
      const dayPlaces = placesByDay[day.id] || [];
      dayPlaces.forEach((place) => {
        rows.push([
          day.date || '',
          `Day ${day.day_number}`,
          place.name,
          place.budget_category || 'misc',
          place.cost?.toString() || '0',
          place.cost_currency || trip.currency_code || 'USD',
          place.notes || '',
        ]);
      });
    });

    // Convert to CSV string
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${trip.title.replace(/[^a-z0-9]/gi, '_')}_budget.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export budget as PDF (simplified HTML-based approach)
   */
  async exportPDF(
    trip: Trip,
    summary: BudgetSummary,
    categories: CategorySpending[],
    dailySpending: DailySpending[]
  ): Promise<void> {
    const currencySymbol = getCurrencySymbol(trip.currency_code || 'USD');

    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${trip.title} - Budget Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #1f2937;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
          }
          h2 {
            color: #374151;
            margin-top: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .summary {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #d1d5db;
          }
          .summary-item:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #6b7280;
          }
          .value {
            font-weight: 700;
            color: #1f2937;
          }
          .status-ok { color: #10b981; }
          .status-warning { color: #f59e0b; }
          .status-danger { color: #ef4444; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          .progress-bar {
            width: 100%;
            height: 20px;
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
          }
          .progress-fill {
            height: 100%;
            background: #3b82f6;
          }
          .progress-fill.warning {
            background: #f59e0b;
          }
          .progress-fill.danger {
            background: #ef4444;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <h1>${trip.title} - Budget Report</h1>
        
        <div class="summary">
          <div class="summary-item">
            <span class="label">Destination:</span>
            <span class="value">${trip.destination || 'Not specified'}</span>
          </div>
          <div class="summary-item">
            <span class="label">Dates:</span>
            <span class="value">${trip.start_date || 'TBD'} to ${trip.end_date || 'TBD'}</span>
          </div>
          <div class="summary-item">
            <span class="label">Currency:</span>
            <span class="value">${trip.currency_code || 'USD'}</span>
          </div>
        </div>

        <h2>Budget Summary</h2>
        <div class="summary">
          <div class="summary-item">
            <span class="label">Total Budget:</span>
            <span class="value">${currencySymbol}${summary.totalBudget.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Spent:</span>
            <span class="value">${currencySymbol}${summary.totalSpent.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Remaining:</span>
            <span class="value status-${summary.status}">
              ${summary.remaining >= 0 ? '' : '-'}${currencySymbol}${Math.abs(summary.remaining).toFixed(2)}
            </span>
          </div>
          <div class="summary-item">
            <span class="label">Daily Budget:</span>
            <span class="value">${currencySymbol}${summary.dailyBudget.toFixed(2)}</span>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill ${summary.status}" style="width: ${Math.min(summary.percentageSpent, 100)}%"></div>
        </div>
        <p style="text-align: center; color: #6b7280;">${summary.percentageSpent.toFixed(1)}% of budget used</p>

        <h2>Spending by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            ${categories
              .filter((cat) => cat.amount > 0)
              .map(
                (cat) => `
              <tr>
                <td style="text-transform: capitalize;">${cat.category}</td>
                <td>${currencySymbol}${cat.amount.toFixed(2)}</td>
                <td>${cat.percentage.toFixed(1)}%</td>
                <td>${cat.count}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <h2>Daily Spending</h2>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th>Spent</th>
              <th>Budget</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${dailySpending
              .map(
                (day) => `
              <tr>
                <td>Day ${day.dayNumber}</td>
                <td>${day.date ? new Date(day.date).toLocaleDateString() : 'TBD'}</td>
                <td>${currencySymbol}${day.spent.toFixed(2)}</td>
                <td>${currencySymbol}${day.budget.toFixed(2)}</td>
                <td>${day.spent > day.budget ? '⚠️ Over' : '✓ OK'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <p style="margin-top: 40px; color: #6b7280; font-size: 12px; text-align: center;">
          Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }

  /**
   * Generate shareable budget URL
   */
  getShareableURL(shareToken: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/t/${shareToken}?tab=budget`;
  }

  /**
   * Copy shareable URL to clipboard
   */
  async copyShareableURL(shareToken: string): Promise<boolean> {
    try {
      const url = this.getShareableURL(shareToken);
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Failed to copy URL:', error);
      return false;
    }
  }
}

export const budgetExportService = new BudgetExportService();
