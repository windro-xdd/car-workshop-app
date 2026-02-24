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
  companyAddress: 'Opposite to old toll booth, Vimangalam, PO Kadaloor, Moodadi, Kerala - 673306',
};

// Format numbers with Indian comma grouping (e.g. 11,81,800.00)
const formatIndianCurrency = (amount: number): string => {
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const lastThree = intPart.slice(-3);
  const otherParts = intPart.slice(0, -3);
  const formatted =
    otherParts.length > 0
      ? otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;
  return formatted + '.' + decPart;
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

      const pageLeft = 50;
      const pageRight = 555;
      const pageWidth = pageRight - pageLeft;

      // ── HEADER ──────────────────────────────────────────────
      let y = 45;

      // Company name centered
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(config.companyName || '', pageLeft, y, {
          width: pageWidth,
          align: 'center',
        });
      y += 30;

      // Address + contact on the left, logo on the right
      const addressBlockX = pageLeft;
      const addressBlockW = pageWidth - 100; // leave room for logo

      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      doc.text(config.companyAddress || '', addressBlockX, y, {
        width: addressBlockW,
      });
      y += 13;
      doc.text(`Phone: ${config.companyPhone || ''}`, addressBlockX, y, {
        width: addressBlockW,
      });
      y += 13;
      doc.text(
        `Email: ${config.companyEmail || ''}`,
        addressBlockX,
        y,
        { width: addressBlockW },
      );
      y += 13;

      // GSTIN
      if (config.gstin) {
        doc
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(`GSTIN: ${config.gstin}`, addressBlockX, y, {
            width: addressBlockW,
          });
        y += 13;
      }

      // Logo on the right side of header
      if (config.logoPath) {
        try {
          const fs = require('fs');
          if (fs.existsSync(config.logoPath)) {
            doc.image(config.logoPath, pageRight - 70, 65, {
              width: 65,
              height: 65,
              fit: [65, 65],
            });
          }
        } catch (e) {
          console.error('Could not load logo for PDF:', e);
        }
      }

      y += 8;

      // ── TAX INVOICE BANNER ──────────────────────────────────
      const bannerHeight = 28;
      doc
        .rect(pageLeft, y, pageWidth, bannerHeight)
        .fillAndStroke('#f0f0f0', '#999999');
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('TAX INVOICE', pageLeft, y + 7, {
          width: pageWidth,
          align: 'center',
        });
      y += bannerHeight + 15;

      // ── INVOICE DETAILS TABLE ───────────────────────────────
      const detailLabelW = 130;
      const detailValueW = pageWidth - detailLabelW;
      const detailRowH = 22;

      const drawDetailRow = (label: string, value: string) => {
        // Row border
        doc.rect(pageLeft, y, pageWidth, detailRowH).stroke();
        // Label cell background
        doc
          .rect(pageLeft, y, detailLabelW, detailRowH)
          .fillAndStroke('#fafafa', '#000000');
        // Label text
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(label, pageLeft + 6, y + 6, { width: detailLabelW - 12 });
        // Value cell border
        doc
          .rect(pageLeft + detailLabelW, y, detailValueW, detailRowH)
          .stroke();
        // Value text
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#333333')
          .text(value, pageLeft + detailLabelW + 8, y + 6, {
            width: detailValueW - 16,
          });
        y += detailRowH;
      };

      drawDetailRow('Invoice No:', invoice.invoiceNumber || '');
      drawDetailRow('Invoice Date:', formatDate(invoice.invoiceDate));
      drawDetailRow('Customer Name:', invoice.customerName || '');
      if (invoice.customerPhone) {
        drawDetailRow('Phone:', invoice.customerPhone);
      }
      if (invoice.customerEmail) {
        drawDetailRow('Email:', invoice.customerEmail);
      }
      if (invoice.vehicleNumber) {
        drawDetailRow('Vehicle No:', invoice.vehicleNumber);
      }
      if (invoice.vehicleModel) {
        drawDetailRow('Vehicle Model:', invoice.vehicleModel);
      }

      y += 20;

      // ── LINE ITEMS TABLE ────────────────────────────────────
      const slNoW = 45;
      const descW = 230;
      const qtyW = 60;
      const rateW = 90;
      const amtW = pageWidth - slNoW - descW - qtyW - rateW;
      const itemRowH = 22;

      // Column positions
      const colSlNo = pageLeft;
      const colDesc = colSlNo + slNoW;
      const colQty = colDesc + descW;
      const colRate = colQty + qtyW;
      const colAmt = colRate + rateW;

      // Table header row
      doc
        .rect(pageLeft, y, pageWidth, itemRowH)
        .fillAndStroke('#e8e8e8', '#000000');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Sl No', colSlNo + 6, y + 6, { width: slNoW - 12 });
      doc.text('Description', colDesc + 6, y + 6, { width: descW - 12 });
      doc.text('Qty', colQty + 6, y + 6, {
        width: qtyW - 12,
        align: 'center',
      });
      doc.text('Rate', colRate + 6, y + 6, {
        width: rateW - 12,
        align: 'right',
      });
      doc.text('Amount', colAmt + 6, y + 6, {
        width: amtW - 12,
        align: 'right',
      });

      // Draw vertical lines in header
      [colDesc, colQty, colRate, colAmt].forEach((x) => {
        doc.moveTo(x, y).lineTo(x, y + itemRowH).stroke();
      });

      y += itemRowH;

      // Table data rows
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      const lineItemsList = invoice.lineItems || [];

      lineItemsList.forEach((lineItem, index) => {
        const item = items.find((i) => i.id === lineItem.itemId);
        const itemName = item?.name || 'Unknown Item';
        const hasRemarks = !!(lineItem as any).remarks;
        const rowH = hasRemarks ? 34 : itemRowH;

        // Row border
        doc.rect(pageLeft, y, pageWidth, rowH).stroke();

        // Vertical lines
        [colDesc, colQty, colRate, colAmt].forEach((x) => {
          doc.moveTo(x, y).lineTo(x, y + rowH).stroke();
        });

        doc.fillColor('#333333');
        doc.text(String(index + 1), colSlNo + 6, y + 6, {
          width: slNoW - 12,
          align: 'center',
        });
        doc.font('Helvetica').text(itemName, colDesc + 6, y + 6, { width: descW - 12 });
        if (hasRemarks) {
          doc
            .fontSize(7)
            .font('Helvetica-Oblique')
            .fillColor('#666666')
            .text((lineItem as any).remarks, colDesc + 6, y + 18, { width: descW - 12 });
          doc.fontSize(9).font('Helvetica').fillColor('#333333');
        }
        doc.text(lineItem.quantity.toString(), colQty + 6, y + 6, {
          width: qtyW - 12,
          align: 'center',
        });
        doc.text(formatIndianCurrency(lineItem.unitPrice), colRate + 6, y + 6, {
          width: rateW - 12,
          align: 'right',
        });
        doc.text(formatIndianCurrency(lineItem.lineTotal), colAmt + 6, y + 6, {
          width: amtW - 12,
          align: 'right',
        });

        y += rowH;
      });

      y += 15;

      // ── TOTALS TABLE ────────────────────────────────────────
      const totalsLabelW = pageWidth - 130;
      const totalsValueW = 130;
      const totalsRowH = 22;

      const drawTotalsRow = (
        label: string,
        value: string,
        highlight: boolean,
      ) => {
        if (highlight) {
          doc
            .rect(pageLeft, y, pageWidth, totalsRowH)
            .fillAndStroke('#e8e8e8', '#000000');
        } else {
          doc.rect(pageLeft, y, pageWidth, totalsRowH).stroke();
        }
        // Vertical divider
        doc
          .moveTo(pageLeft + totalsLabelW, y)
          .lineTo(pageLeft + totalsLabelW, y + totalsRowH)
          .stroke();

        const labelFont = highlight ? 'Helvetica-Bold' : 'Helvetica';
        const labelSize = highlight ? 10 : 9;

        doc
          .fontSize(labelSize)
          .font(labelFont)
          .fillColor('#000000')
          .text(label, pageLeft + 8, y + 6, { width: totalsLabelW - 16 });
        doc
          .fontSize(labelSize)
          .font(labelFont)
          .fillColor('#000000')
          .text(value, pageLeft + totalsLabelW + 8, y + 6, {
            width: totalsValueW - 16,
            align: 'right',
          });

        y += totalsRowH;
      };

      drawTotalsRow(
        'Subtotal',
        formatIndianCurrency(invoice.grossAmount),
        false,
      );
      drawTotalsRow(
        `GST (${invoice.gstPercentage}%)`,
        formatIndianCurrency(invoice.gstAmount),
        false,
      );
      drawTotalsRow(
        'Total Amount',
        formatIndianCurrency(invoice.netTotal),
        true,
      );

      y += 40;

      // ── FOOTER ──────────────────────────────────────────────
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(
          'Authorized Signature: ____________________',
          pageLeft + 10,
          y,
        );

      y += 30;
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text('Thank you for your business!', pageLeft + 10, y);

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
  return `${day}-${month}-${year}`;
};

export const savePDFToFile = async (
  buffer: Buffer,
  filePath: string,
): Promise<void> => {
  const fs = await import('fs').then((m) => m.promises);
  await fs.writeFile(filePath, buffer);
};

export const openPDFInViewer = async (filePath: string): Promise<void> => {
  const { spawn } = await import('child_process');
  const viewers =
    process.platform === 'win32'
      ? ['cmd', '/c', filePath]
      : ['xdg-open', filePath];
  spawn(viewers[0], viewers.slice(1), { detached: true });
};
