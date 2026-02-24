import PDFDocument from 'pdfkit';
import { Invoice, LineItem, Item } from '../../types';

export interface PDFGeneratorOptions {
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  logoPath?: string;
  gstin?: string;
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

      // Header with company info and optional logo
      let headerY = 50;

      // If logo exists, draw it on the right
      if (config.logoPath) {
        try {
          const fs = require('fs');
          if (fs.existsSync(config.logoPath)) {
            doc.image(config.logoPath, 480, headerY, { width: 60, height: 60, fit: [60, 60] });
          }
        } catch (e) {
          // Silently skip if logo can't be loaded
          console.error('Could not load logo for PDF:', e);
        }
      }

      doc.fontSize(24).font('Helvetica-Bold').fillColor('#000080').text(config.companyName || '', 50, headerY, { align: 'left' });
      doc.fontSize(10).font('Helvetica-Oblique').fillColor('#333333').text('Premium Car Workshop Services', 50, headerY + 30, { align: 'left' });
      
      // GSTIN
      let gstinY = headerY + 45;
      if (config.gstin) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('GSTIN: ', 50, gstinY, { continued: true }).font('Helvetica').text(config.gstin);
        gstinY += 15;
      }

      const lineAfterHeader = gstinY + 5;
      doc.moveTo(50, lineAfterHeader).lineTo(555, lineAfterHeader).strokeColor('#888888').stroke();
      
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.font('Helvetica-Bold').text('Address: ', 50, lineAfterHeader + 10, { continued: true }).font('Helvetica').text(config.companyAddress || '');
      doc.font('Helvetica-Bold').text('Phone: ', 50, lineAfterHeader + 25, { continued: true }).font('Helvetica').text(config.companyPhone || '');
      doc.font('Helvetica-Bold').text('Email: ', 50, lineAfterHeader + 40, { continued: true }).font('Helvetica').text(config.companyEmail || '');

      const afterContactY = lineAfterHeader + 60;
      doc.moveTo(50, afterContactY).lineTo(555, afterContactY).strokeColor('#000000').stroke();

      // TAX INVOICE header
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('TAX INVOICE', 50, afterContactY + 10, { align: 'center' });
      doc.moveTo(50, afterContactY + 30).lineTo(555, afterContactY + 30).strokeColor('#000000').stroke();

      // Invoice details section
      const detailsY = afterContactY + 45;
      doc.fontSize(10).font('Helvetica');

      // Left column: Invoice details
      doc.font('Helvetica-Bold').text('INVOICE DETAILS', 50, detailsY);
      doc.font('Helvetica');
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, 50, detailsY + 18);
      doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, 50, detailsY + 33);
      doc.text(`Status: ${invoice.status}`, 50, detailsY + 48);

      // Right column: Customer details
      const rightColumnX = 320;
      doc.font('Helvetica-Bold').text('BILL TO:', rightColumnX, detailsY);
      doc.font('Helvetica');
      doc.text(`Name: ${invoice.customerName}`, rightColumnX, detailsY + 18);
      let custY = detailsY + 33;
      if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, rightColumnX, custY);
        custY += 15;
      }
      if (invoice.customerEmail) {
        doc.text(`Email: ${invoice.customerEmail}`, rightColumnX, custY);
        custY += 15;
      }
      if (invoice.vehicleNumber) {
        doc.font('Helvetica-Bold').text('Vehicle No: ', rightColumnX, custY, { continued: true }).font('Helvetica').text(invoice.vehicleNumber);
        custY += 15;
      }
      if (invoice.vehicleModel) {
        doc.font('Helvetica-Bold').text('Vehicle Model: ', rightColumnX, custY, { continued: true }).font('Helvetica').text(invoice.vehicleModel);
        custY += 15;
      }

      // Line items table
      const tableTop = Math.max(detailsY + 75, custY + 15);
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
