import React, { useEffect, useState } from 'react';
import { Invoice } from '../../types';
import { useToast } from '../components/ToastProvider';
import { formatDate, formatCurrency } from '../utils/invoiceUtils';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/reportExport';

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
  const { showToast } = useToast();
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
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

    if (start > end) {
      showToast('Start date cannot be after end date', 'error', 5000);
      setDailyReport([]);
      setCustomerReport([]);
      setTrendData([]);
      return;
    }

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

  const renderExportDropdown = (
    reportName: string,
    reportTitle: string,
    data: Array<Record<string, any>>,
    headers: string[]
  ) => {
    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === reportName ? null : reportName)}
          className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-zinc-50 hover:text-zinc-900 transition-all duration-200 ease-out flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4"></path>
          </svg>
          Export
          <svg
            className={`w-4 h-4 ml-2 transition-transform duration-200 ${openDropdown === reportName ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </button>

        {openDropdown === reportName && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 overflow-hidden">
            <button
              onClick={() => {
                exportToCSV(reportName, data, headers);
                showToast(`${reportTitle} exported as CSV`, 'success', 4000);
                setOpenDropdown(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              CSV
            </button>
            <button
              onClick={() => {
                exportToExcel(reportName, data, headers);
                showToast(`${reportTitle} exported as Excel`, 'success', 4000);
                setOpenDropdown(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 border-t border-zinc-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Excel
            </button>
            <button
              onClick={() => {
                exportToPDF(reportName, reportTitle, data, headers);
                showToast(`${reportTitle} exported as PDF`, 'success', 4000);
                setOpenDropdown(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 border-t border-zinc-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              PDF
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTrendChart = () => {
    if (trendData.length === 0) {
      return (
        <div className="h-80 border border-zinc-200 border-dashed rounded-xl flex items-center justify-center text-zinc-400 text-sm">
          No data available for selected date range
        </div>
      );
    }

    const { maxRevenue, chartHeight, padding } = getTrendChartHeight();
    const chartWidth = Math.max(600, trendData.length * 60);
    const barWidth = Math.min(40, (chartWidth - 2 * padding) / trendData.length);
    const barSpacing = (chartWidth - 2 * padding) / trendData.length;

    return (
      <div className="overflow-x-auto bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <svg width={chartWidth} height={chartHeight + padding} className="mx-auto">
          <line x1={padding} y1={padding} x2={padding} y2={chartHeight + padding} stroke="#e4e4e7" strokeWidth="1" />
          <line x1={padding} y1={chartHeight + padding} x2={chartWidth - padding} y2={chartHeight + padding} stroke="#e4e4e7" strokeWidth="1" />

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(maxRevenue * ratio);
            const y = chartHeight + padding - chartHeight * ratio;
            return (
              <g key={`y-${ratio}`}>
                <text
                  x={padding - 10}
                  y={y}
                  fontSize="11"
                  fill="#71717a"
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="font-medium"
                >
                  ₹{(value / 1000).toFixed(0)}k
                </text>
                <line x1={padding - 5} y1={y} x2={chartWidth - padding} y2={y} stroke="#f4f4f5" strokeWidth="1" strokeDasharray="4 4" />
              </g>
            );
          })}

          {trendData.map((item, index) => {
            const barHeight = (item.revenue / maxRevenue) * chartHeight;
            const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
            const y = chartHeight + padding - barHeight;

            return (
              <g
                key={`bar-${index}`}
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={hoveredBar === index ? '#2563eb' : '#3b82f6'}
                  rx="4"
                  ry="4"
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease-out' }}
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + padding + 24}
                  fontSize="11"
                  fill="#71717a"
                  textAnchor="middle"
                  className="font-medium"
                  transform={`rotate(45, ${x + barWidth / 2}, ${chartHeight + padding + 24})`}
                >
                  {item.date}
                </text>
                {hoveredBar === index && (
                  <g className="animate-in fade-in zoom-in-95 duration-150">
                    <rect
                      x={x + barWidth / 2 - 40}
                      y={y - 35}
                      width="80"
                      height="28"
                      fill="#18181b"
                      rx="6"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 16}
                      fontSize="12"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {formatCurrency(item.revenue)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-sm md:text-base text-zinc-500 mt-1">Generate financial reports and analyze business trends</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-zinc-200 mb-8">
        <div className="border-b border-zinc-100 pb-4 mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <h2 className="text-lg font-semibold text-zinc-900">Date Range</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-zinc-700 mb-1.5">Start Date</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Select start date for report"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-zinc-700 mb-1.5">End Date</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="Select end date for report"
              className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/50 px-2 pt-2">
          {[
            { id: 'daily', label: 'Daily Revenue' },
            { id: 'customer', label: 'Customer Summary' },
            { id: 'trend', label: 'Revenue Trend' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              aria-label={`View ${tab.label} report`}
              className={`px-5 py-3 text-sm font-medium transition-all duration-200 ease-out border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600 bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 rounded-t-lg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 bg-zinc-50/30">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center">
              <svg className="animate-spin h-6 w-6 text-zinc-400 mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading report data...</span>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
               {activeTab === 'daily' && (
                 <div>
                   <div className="mb-5 flex justify-end">
                     {renderExportDropdown(
                       'daily-revenue-report',
                       'Daily Revenue Report',
                       dailyReport.map((row) => ({
                         date: row.date,
                         dailyTotal: formatCurrency(row.dailyTotal),
                         cumulativeTotal: formatCurrency(row.cumulativeTotal),
                       })),
                       ['date', 'dailyTotal', 'cumulativeTotal']
                     )}
                   </div>
                  {dailyReport.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 border border-zinc-200 border-dashed rounded-xl bg-white">No data for selected date range</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50/50 border-b border-zinc-200">
                            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Daily Total</th>
                            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Cumulative Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {dailyReport.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors duration-150 ease-in-out">
                              <td className="px-6 py-4 text-sm text-zinc-900 font-medium">{row.date}</td>
                              <td className="px-6 py-4 text-sm text-zinc-900 text-right font-semibold">{formatCurrency(row.dailyTotal)}</td>
                              <td className="px-6 py-4 text-sm text-zinc-600 text-right">{formatCurrency(row.cumulativeTotal)}</td>
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
                   <div className="mb-5 flex justify-end">
                     {renderExportDropdown(
                       'customer-summary-report',
                       'Customer Summary Report',
                       customerReport.map((row) => ({
                         customerName: row.customerName,
                         invoiceCount: row.invoiceCount.toString(),
                         totalRevenue: formatCurrency(row.totalRevenue),
                         avgInvoiceValue: formatCurrency(row.avgInvoiceValue),
                       })),
                       ['customerName', 'invoiceCount', 'totalRevenue', 'avgInvoiceValue']
                     )}
                   </div>
                  {customerReport.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 border border-zinc-200 border-dashed rounded-xl bg-white">No data for selected date range</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50/50 border-b border-zinc-200">
                            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Invoice Count</th>
                            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Total Revenue</th>
                            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Avg Invoice Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {customerReport.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors duration-150 ease-in-out">
                              <td className="px-6 py-4 text-sm text-zinc-900 font-medium">{row.customerName}</td>
                              <td className="px-6 py-4 text-sm text-zinc-600 text-right">{row.invoiceCount}</td>
                              <td className="px-6 py-4 text-sm text-zinc-900 text-right font-semibold">{formatCurrency(row.totalRevenue)}</td>
                              <td className="px-6 py-4 text-sm text-zinc-600 text-right">{formatCurrency(row.avgInvoiceValue)}</td>
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
                   <div className="mb-5 flex justify-end">
                     {renderExportDropdown(
                       'revenue-trend-report',
                       'Revenue Trend Report',
                       trendData.map((row) => ({
                         date: row.date,
                         revenue: formatCurrency(row.revenue),
                       })),
                       ['date', 'revenue']
                     )}
                   </div>
                  {renderTrendChart()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
