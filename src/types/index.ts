export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemInput {
  code: string;
  name: string;
  category: string;
  unitPrice: number;
}

export interface UpdateItemInput {
  id: string;
  code?: string;
  name?: string;
  category?: string;
  unitPrice?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  grossAmount: number;
  gstAmount: number;
  netTotal: number;
  gstPercentage: number;
  status: 'Draft' | 'Final' | 'Cancelled';
  isAmendment: boolean;
  originalInvoiceId?: string;
  notes?: string;
  lineItems?: LineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItem {
  id: string;
  invoiceId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface GstConfig {
  id: string;
  rate: number;
  isActive: boolean;
}
