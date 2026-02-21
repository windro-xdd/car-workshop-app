import PDFDocument from 'pdfkit';
import { Invoice, LineItem, Item } from '../../types';

export interface PDFGeneratorOptions {
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  logoPath?: string;
}

const DEFAULT_OPTIONS: PDFGeneratorOptions = {
  companyName: 'KRIPA CAR CARE',
  companyPhone: '9745286370 | 9745286377 | 9995102092',
  companyEmail: 'kripacarcare@gmail.com',
  companyAddress: 'Opposite to old toll booth, Vimangalam, PO Kadaloor, Moodadi',
};

export const generateInvoicePDF = async (
  invoice: Record<string, any> & { lineItems: LineItem[] },
  items: Item[],
  options: PDFGeneratorOptions = {},
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const config = { ...DEFAULT_OPTIONS, ...options };
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with company info
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#000080').text(config.companyName || '', 50, 50, { align: 'left' });
      doc.fontSize(10).font('Helvetica-Oblique').fillColor('#333333').text('Premium Car Workshop Services', 50, 80, { align: 'left' });
      
      doc.moveTo(50, 100).lineTo(555, 100).strokeColor('#888888').stroke();
      
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text('Address: ', 50, 115, { continued: true }).font('Helvetica').text(config.companyAddress || '');
      doc.font('Helvetica-Bold').text('Phone: ', 50, 130, { continued: true }).font('Helvetica').text(config.companyPhone || '');
      doc.font('Helvetica-Bold').text('Email: ', 50, 145, { continued: true }).font('Helvetica').text(config.companyEmail || '');

      doc.moveTo(50, 170).lineTo(555, 170).strokeColor('#000000').stroke();

      // Invoice details section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('INVOICE', 50, 190);

      const detailsX = 50;
      const detailsY = 220;
      doc.fontSize(10).font('Helvetica');

      // Left column: Invoice details
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, detailsX, detailsY);
      doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, detailsX, detailsY + 20);
      doc.text(`Status: ${invoice.status}`, detailsX, detailsY + 40);

      // Right column: Customer details
      const rightColumnX = 320;
      doc.font('Helvetica-Bold').text('BILL TO:', rightColumnX, detailsY);
      doc.font('Helvetica');
      doc.text(`Name: ${invoice.customerName}`, rightColumnX, detailsY + 20);
      if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, rightColumnX, detailsY + 40);
      }
      if (invoice.customerEmail) {
        doc.text(`Email: ${invoice.customerEmail}`, rightColumnX, detailsY + 60);
      }

      // Line items table
      const tableTop = 280;
      const col1X = 50;
      const col2X = 280;
      const col3X = 380;
      const col4X = 450;
      const col5X = 510;
      const rowHeight = 25;

      // Table header
      doc.font('Helvetica-Bold').fontSize(10);
      doc.rect(col1X - 10, tableTop - 15, 500, rowHeight).fillAndStroke('#f3f4f6', '#000');
      doc.fillColor('#000');

      doc.text('Item', col1X, tableTop - 5);
      doc.text('Qty', col2X, tableTop - 5);
      doc.text('Unit Price', col3X, tableTop - 5);
      doc.text('Amount', col4X, tableTop - 5);

      // Table rows
      doc.font('Helvetica').fontSize(9);
      let rowY = tableTop + 10;

      (invoice.lineItems || []).forEach((lineItem) => {
        const item = items.find((i) => i.id === lineItem.itemId);
        const itemName = item?.name || 'Unknown Item';

        doc.text(itemName, col1X, rowY, { width: col2X - col1X - 10 });
        doc.text(lineItem.quantity.toString(), col2X, rowY);
        doc.text(`₹${lineItem.unitPrice.toFixed(2)}`, col3X, rowY);
        doc.text(`₹${lineItem.lineTotal.toFixed(2)}`, col4X, rowY);

        rowY += rowHeight;
      });

      // Totals section
      const totalsY = rowY + 20;
      const totalsX = 350;

      doc.moveTo(totalsX - 20, totalsY - 10).lineTo(555, totalsY - 10).stroke();

      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal:', totalsX, totalsY);
      doc.text(`₹${invoice.grossAmount.toFixed(2)}`, col5X - 40, totalsY);

      doc.text(`GST (${invoice.gstPercentage}%):`, totalsX, totalsY + 20);
      doc.text(`₹${invoice.gstAmount.toFixed(2)}`, col5X - 40, totalsY + 20);

      // Total box
      doc.rect(totalsX - 30, totalsY + 35, 230, 30).stroke();
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', totalsX, totalsY + 42);
      doc.text(`₹${invoice.netTotal.toFixed(2)}`, col5X - 40, totalsY + 42);

      // Footer
      const footerY = 750;
      doc.moveTo(40, footerY).lineTo(555, footerY).stroke();
      doc.font('Helvetica').fontSize(8);
      doc.text('Thank you for your business!', 50, footerY + 10, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 50, footerY + 25, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const savePDFToFile = async (buffer: Buffer, filePath: string): Promise<void> => {
  const fs = await import('fs').then((m) => m.promises);
  await fs.writeFile(filePath, buffer);
};

export const openPDFInViewer = async (filePath: string): Promise<void> => {
  const { spawn } = await import('child_process');
  // Try different PDF viewers based on platform
  const viewers = process.platform === 'win32' ? ['cmd', '/c', filePath] : ['xdg-open', filePath];
  spawn(viewers[0], viewers.slice(1), { detached: true });
};
