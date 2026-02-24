export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'manager' | 'staff';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemInput {
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  isActive?: boolean;
}

export interface UpdateItemInput {
  id: string;
  code?: string;
  name?: string;
  category?: string;
  unitPrice?: number;
  isActive?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  vehicleNumber?: string | null;
  vehicleModel?: string | null;
  grossAmount: number;
  gstAmount: number;
  netTotal: number;
  gstPercentage: number;
  status: 'Draft' | 'Final' | 'Cancelled';
  isAmendment: boolean;
  originalInvoiceId?: string;
  notes?: string;
  userId: string;
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

export interface BusinessConfig {
  id: string;
  gstin: string;
  logoPath: string;
  createdAt?: Date;
  updatedAt?: Date;
}
