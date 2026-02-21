import React, { useEffect, useState } from 'react';
import { Invoice } from '../../types';
import { formatDate, formatCurrency } from '../utils/invoiceUtils';
import { exportToCSV, exportToPDF } from '../utils/reportExport';

interface DailyRevenueRow {
  date: string;
  dailyTotal: number;
  cumulativeTotal: number;
}

interface CustomerSummaryRow {
  customerName: string;
  invoiceCount: number;
  totalRevenue: number;
  avgInvoiceValue: number;
}

interface TrendData {
  date: string;
  revenue: number;
}

export const ReportingPage: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'customer' | 'trend'>('daily');

  const [dailyReport, setDailyReport] = useState<DailyRevenueRow[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerSummaryRow[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (invoices.length > 0) {
      generateReports();
    }
  }, [startDate, endDate, invoices]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getInvoices();
      if (result.success) {
        const filtered = (result.data || []).filter(
          (inv) => inv.status === 'Final' && !inv.isAmendment
        );
        setInvoices(filtered);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReports = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = invoices.filter((inv) => {
      const invDate = new Date(inv.invoiceDate);
      return invDate >= start && invDate <= end;
    });

    generateDailyReport(filtered);
    generateCustomerReport(filtered);
    generateTrendReport(filtered);
  };

  const generateDailyReport = (filteredInvoices: Invoice[]) => {
    const dailyMap = new Map<string, number>();

    filteredInvoices.forEach((inv) => {
      const dateStr = formatDate(inv.invoiceDate);
      const current = dailyMap.get(dateStr) || 0;
      dailyMap.set(dateStr, current + inv.netTotal);
    });

    const sortedDates = Array.from(dailyMap.keys()).sort();
    let cumulativeTotal = 0;
    const report: DailyRevenueRow[] = sortedDates.map((date) => {
      const dailyTotal = dailyMap.get(date)!;
      cumulativeTotal += dailyTotal;
      return { date, dailyTotal, cumulativeTotal };
    });

    setDailyReport(report);
  };

  const generateCustomerReport = (filteredInvoices: Invoice[]) => {
    const customerMap = new Map<
      string,
      { count: number; total: number; values: number[] }
    >();

    filteredInvoices.forEach((inv) => {
      const name = inv.customerName;
      const current = customerMap.get(name) || { count: 0, total: 0, values: [] };
      current.count += 1;
      current.total += inv.netTotal;
      current.values.push(inv.netTotal);
      customerMap.set(name, current);
    });

    const report: CustomerSummaryRow[] = Array.from(customerMap.entries())
      .map(([name, data]) => ({
        customerName: name,
        invoiceCount: data.count,
        totalRevenue: data.total,
        avgInvoiceValue: Math.round((data.total / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    setCustomerReport(report);
  };

  const generateTrendReport = (filteredInvoices: Invoice[]) => {
    const trendMap = new Map<string, number>();

    filteredInvoices.forEach((inv) => {
      const dateStr = formatDate(inv.invoiceDate);
      const current = trendMap.get(dateStr) || 0;
      trendMap.set(dateStr, current + inv.netTotal);
    });

    const trend: TrendData[] = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    setTrendData(trend);
  };

  const getTrendChartHeight = (): { maxRevenue: number; chartHeight: number; padding: number } => {
    if (trendData.length === 0) {
      return { maxRevenue: 1000, chartHeight: 300, padding: 40 };
    }
    const maxRevenue = Math.max(...trendData.map((d) => d.revenue));
    const padding = 40;
    const chartHeight = 300;
    return { maxRevenue, chartHeight, padding };
  };

  const renderTrendChart = () => {
    if (trendData.length === 0) {
      return (
        <div className="h-80 bg-gray-50 rounded flex items-center justify-center text-gray-500">
          No data available for selected date range
        </div>
      );
    }

    const { maxRevenue, chartHeight, padding } = getTrendChartHeight();
    const chartWidth = Math.max(600, trendData.length * 60);
    const barWidth = Math.min(40, (chartWidth - 2 * padding) / trendData.length);
    const barSpacing = (chartWidth - 2 * padding) / trendData.length;

    return (
      <div className="overflow-x-auto p-4 bg-white rounded-lg">
        <svg width={chartWidth} height={chartHeight + padding} className="mx-auto">
          <line x1={padding} y1={padding} x2={padding} y2={chartHeight + padding} stroke="#ccc" />
          <line x1={padding} y1={chartHeight + padding} x2={chartWidth - padding} y2={chartHeight + padding} stroke="#ccc" />

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(maxRevenue * ratio);
            const y = chartHeight + padding - chartHeight * ratio;
            return (
              <g key={`y-${ratio}`}>
                <text
                  x={padding - 10}
                  y={y}
                  fontSize="12"
                  fill="#666"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  ₹{(value / 1000).toFixed(0)}k
                </text>
                <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#ddd" />
              </g>
            );
          })}

          {trendData.map((item, index) => {
            const barHeight = (item.revenue / maxRevenue) * chartHeight;
            const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
            const y = chartHeight + padding - barHeight;

            return (
              <g key={`bar-${index}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#3b82f6" />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + padding + 20}
                  fontSize="11"
                  fill="#666"
                  textAnchor="middle"
                  transform={`rotate(45, ${x + barWidth / 2}, ${chartHeight + padding + 20})`}
                >
                  {item.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mb-8">Generate financial reports and analyze business trends</p>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {[
              { id: 'daily', label: 'Daily Revenue' },
              { id: 'customer', label: 'Customer Summary' },
              { id: 'trend', label: 'Revenue Trend' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <>
                {activeTab === 'daily' && (
                  <div>
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => {
                          const headers = ['date', 'dailyTotal', 'cumulativeTotal'];
                          const data = dailyReport.map((row) => ({
                            date: row.date,
                            dailyTotal: formatCurrency(row.dailyTotal),
                            cumulativeTotal: formatCurrency(row.cumulativeTotal),
                          }));
                          exportToCSV('daily-revenue-report', data, headers);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                      >
                        Export CSV
                      </button>
                    </div>
                    {dailyReport.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No data for selected date range</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-300 bg-gray-50">
                              <th className="text-left py-3 px-4">Date</th>
                              <th className="text-right py-3 px-4">Daily Total</th>
                              <th className="text-right py-3 px-4">Cumulative Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailyReport.map((row, idx) => (
                              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-4">{row.date}</td>
                                <td className="text-right py-3 px-4 font-semibold">
                                  {formatCurrency(row.dailyTotal)}
                                </td>
                                <td className="text-right py-3 px-4 font-semibold">
                                  {formatCurrency(row.cumulativeTotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'customer' && (
                  <div>
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => {
                          const headers = ['customerName', 'invoiceCount', 'totalRevenue', 'avgInvoiceValue'];
                          const data = customerReport.map((row) => ({
                            customerName: row.customerName,
                            invoiceCount: row.invoiceCount.toString(),
                            totalRevenue: formatCurrency(row.totalRevenue),
                            avgInvoiceValue: formatCurrency(row.avgInvoiceValue),
                          }));
                          exportToCSV('customer-summary-report', data, headers);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                      >
                        Export CSV
                      </button>
                    </div>
                    {customerReport.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No data for selected date range</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-300 bg-gray-50">
                              <th className="text-left py-3 px-4">Customer Name</th>
                              <th className="text-right py-3 px-4">Invoice Count</th>
                              <th className="text-right py-3 px-4">Total Revenue</th>
                              <th className="text-right py-3 px-4">Avg Invoice Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerReport.map((row, idx) => (
                              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{row.customerName}</td>
                                <td className="text-right py-3 px-4">{row.invoiceCount}</td>
                                <td className="text-right py-3 px-4 font-semibold">
                                  {formatCurrency(row.totalRevenue)}
                                </td>
                                <td className="text-right py-3 px-4">{formatCurrency(row.avgInvoiceValue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'trend' && (
                  <div>
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => {
                          const headers = ['date', 'revenue'];
                          const data = trendData.map((row) => ({
                            date: row.date,
                            revenue: formatCurrency(row.revenue),
                          }));
                          exportToCSV('revenue-trend-report', data, headers);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                      >
                        Export CSV
                      </button>
                    </div>
                    {renderTrendChart()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
