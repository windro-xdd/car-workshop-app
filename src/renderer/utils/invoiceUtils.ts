/**
 * Invoice utility functions for number generation and GST calculation
 */

/**
 * Generate invoice number in format INV-YYYY/MMD0-XXX
 * Example: INV-2026/0220-001
 * @param sequenceNumber - Sequential number for the invoice (1, 2, 3, etc.)
 * @returns Formatted invoice number
 */
export function generateInvoiceNumber(sequenceNumber: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequence = String(sequenceNumber).padStart(3, '0');

  return `INV-${year}/${month}${day}-${sequence}`;
}

/**
 * Calculate GST amount
 * @param grossAmount - Total amount before GST
 * @param gstPercentage - GST percentage (e.g., 18 for 18%)
 * @returns GST amount
 */
export function calculateGST(grossAmount: number, gstPercentage: number): number {
  return Number((grossAmount * (gstPercentage / 100)).toFixed(2));
}

/**
 * Calculate net total (gross amount + GST)
 * @param grossAmount - Total amount before GST
 * @param gstPercentage - GST percentage
 * @returns Net total (gross + GST)
 */
export function calculateNetTotal(grossAmount: number, gstPercentage: number): number {
  const gstAmount = calculateGST(grossAmount, gstPercentage);
  return Number((grossAmount + gstAmount).toFixed(2));
}

/**
 * Calculate line item total
 * @param quantity - Quantity of items
 * @param unitPrice - Price per unit
 * @returns Line total (quantity × unitPrice)
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Number((quantity * unitPrice).toFixed(2));
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @returns Formatted currency string (₹XX.XX)
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Format date for display
 * @param date - Date to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
