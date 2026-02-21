import { create } from 'zustand';
import { Invoice, LineItem } from '../../types';

interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  lineItems: LineItem[];
  gstPercentage: number;
  loading: boolean;
  error: string | null;

  setInvoices: (invoices: Invoice[]) => void;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  setLineItems: (items: LineItem[]) => void;
  setGstPercentage: (percentage: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addLineItem: (item: LineItem) => void;
  removeLineItem: (itemId: string) => void;
  updateLineItem: (itemId: string, quantity: number, unitPrice: number) => void;
  clearLineItems: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  currentInvoice: null,
  lineItems: [],
  gstPercentage: 18,
  loading: false,
  error: null,

  setInvoices: (invoices) => set({ invoices }),
  setCurrentInvoice: (currentInvoice) => set({ currentInvoice }),
  setLineItems: (lineItems) => set({ lineItems }),
  setGstPercentage: (gstPercentage) => set({ gstPercentage }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addLineItem: (item) =>
    set((state) => ({
      lineItems: [...state.lineItems, item],
    })),

  removeLineItem: (itemId) =>
    set((state) => ({
      lineItems: state.lineItems.filter((item) => item.itemId !== itemId),
    })),

  updateLineItem: (itemId, quantity, unitPrice) =>
    set((state) => ({
      lineItems: state.lineItems.map((item) =>
        item.itemId === itemId
          ? { ...item, quantity, unitPrice, lineTotal: quantity * unitPrice }
          : item,
      ),
    })),

  clearLineItems: () => set({ lineItems: [] }),
}));
