export const exportToCSV = (
  reportName: string,
  data: Array<Record<string, any>>,
  headers: string[]
): void => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const element = document.createElement('a');
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
  element.setAttribute('download', `${reportName}-${new Date().toISOString().split('T')[0]}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const exportToExcel = (
  reportName: string,
  data: Array<Record<string, any>>,
  headers: string[]
): void => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const XLSX = require('xlsx');

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  const fileName = `${reportName}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportToPDF = (
  reportName: string,
  reportTitle: string,
  data: Array<Record<string, any>>,
  headers: string[]
): void => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const html = generatePDFHTML(reportTitle, data, headers);
  const printWindow = window.open('', '', 'height=600,width=800');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
};

const generatePDFHTML = (
  title: string,
  data: Array<Record<string, any>>,
  headers: string[]
): string => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  const tableRows = data
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => {
            const value = row[header];
            const isNumber = typeof value === 'number';
            return `<td style="${isNumber ? 'text-align: right;' : ''}">${
              isNumber ? value.toFixed(2) : value
            }</td>`;
          })
          .join('')}</tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1f2937;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .header-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 13px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        thead {
          background-color: #f3f4f6;
          border-bottom: 2px solid #d1d5db;
        }
        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #d1d5db;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #d1d5db;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="header-info">
        <div>Generated on: ${currentDate}</div>
        <div>Kripa Car Care</div>
      </div>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        <p>This is an auto-generated report. For inquiries, contact Kripa Car Care.</p>
      </div>
    </body>
    </html>
  `;
};
