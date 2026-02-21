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

  const fileName = `${reportName}-${new Date().toISOString().split('T')[0]}.pdf`;

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
  element.setAttribute('download', fileName.replace('.pdf', '.csv'));
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
