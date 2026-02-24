import React, { useEffect, useState } from 'react';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceSummary } from '../components/InvoiceSummary';
import { InvoicePDFPreview } from '../components/InvoicePDFPreview';
import { useInvoiceStore } from '../store/invoiceStore';
import { useItemStore } from '../store/itemStore';
import { useUserStore } from '../store/userStore';
import { useToast } from '../components/ToastProvider';
import { Invoice, LineItem } from '../../types';
import { generateInvoiceNumber } from '../utils/invoiceUtils';

export const InvoicePage: React.FC = () => {
    const {
      invoices,
      lineItems,
      gstPercentage,
      loading,
      error,
      setInvoices,
      setLineItems,
      addLineItem,
      removeLineItem,
      setLoading,
      setError,
    } = useInvoiceStore();

    const { items, setItems } = useItemStore();
    const { currentUser } = useUserStore();
    const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState<Invoice | null>(null);

  useEffect(() => {
    loadItems();
    loadInvoices();
  }, []);

  const loadItems = async () => {
    try {
      const result = await window.electronAPI.getItems();
      if (result.success) {
        setItems(result.data || []);
      }
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getInvoices();
      if (result.success) {
        setInvoices(result.data || []);
        setError(null);
      } else {
        setError(result.error || 'Failed to load invoices');
      }
    } catch (err) {
      setError('Error loading invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLineItemAdd = (itemId: string, quantity: number, unitPrice: number) => {
    const lineTotal = quantity * unitPrice;
    const newLineItem: LineItem = {
      id: `temp_${Date.now()}`,
      invoiceId: '',
      itemId,
      quantity,
      unitPrice,
      lineTotal,
    };
    addLineItem(newLineItem);
  };

   const handleCreateInvoice = async () => {
     if (!customerName.trim()) {
       showToast('Please enter customer name', 'error', 4000);
       return;
     }

     if (lineItems.length === 0) {
       showToast('Please add at least one item to the invoice', 'error', 4000);
       return;
     }

     setLoading(true);
     try {
       const invoiceNumber = generateInvoiceNumber((invoices || []).length + 1);
       const grossAmount = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
       const gstAmount = Number((grossAmount * (gstPercentage / 100)).toFixed(2));
       const netTotal = Number((grossAmount + gstAmount).toFixed(2));

       const newInvoice: Invoice = {
          id: `inv_${Date.now()}`,
          invoiceNumber,
          invoiceDate: new Date(),
          customerName,
          customerPhone,
          customerEmail,
          vehicleNumber: vehicleNumber || null,
          vehicleModel: vehicleModel || null,
          grossAmount,
          gstAmount,
          netTotal,
          gstPercentage,
          status: 'Final',
          isAmendment: false,
          userId: currentUser!.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

       const result = await window.electronAPI.createInvoice({
         ...newInvoice,
         lineItems: lineItems.map((line) => ({
           itemId: line.itemId,
           quantity: line.quantity,
           unitPrice: line.unitPrice,
         })),
       });

       if (result.success) {
         const invoice = result.data as Invoice;
         setInvoices([...(invoices || []), invoice]);
         setLineItems([]);
         setCustomerName('');
         setCustomerPhone('');
         setCustomerEmail('');
         setVehicleNumber('');
         setVehicleModel('');
         setError(null);
         showToast(`Invoice created: ${invoiceNumber}`, 'success', 4000);

         // Auto-generate and open PDF
         try {
           const pdfResult = await window.electronAPI.generateInvoicePDF(invoice.id);
           if (pdfResult.success && pdfResult.data) {
             await window.electronAPI.openPdf(pdfResult.data.filePath);
           }
         } catch (pdfErr) {
           console.error('Error auto-generating PDF:', pdfErr);
           // Don't block - invoice was created successfully
         }
       } else {
         setError(result.error || 'Failed to create invoice');
         showToast(result.error || 'Failed to create invoice', 'error', 5000);
       }
     } catch (err) {
       setError('Error creating invoice');
       showToast('Error creating invoice', 'error', 5000);
       console.error(err);
     } finally {
       setLoading(false);
     }
   };

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Create Invoice</h1>
        <p className="text-sm md:text-base text-zinc-500 mt-1">Create workshop invoices for customers</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <InvoiceForm
              items={items || []}
              gstPercentage={gstPercentage}
              onLineItemAdd={handleLineItemAdd}
              onCustomerInfoChange={(info) => {
                setCustomerName(info.customerName);
                setCustomerPhone(info.customerPhone || '');
                setCustomerEmail(info.customerEmail || '');
                setVehicleNumber(info.vehicleNumber || '');
                setVehicleModel(info.vehicleModel || '');
              }}
            />
          </div>

          <div>
            <InvoiceSummary
              customerName={customerName}
              lineItems={lineItems || []}
              items={items || []}
              gstPercentage={gstPercentage}
              onRemoveLineItem={(itemId) => removeLineItem(itemId)}
            />

            <button
              onClick={handleCreateInvoice}
              disabled={loading || lineItems.length === 0 || !customerName}
              className="w-full mt-6 px-6 py-3 bg-brand-600 text-white font-medium rounded-xl shadow-sm hover:bg-brand-700 hover:shadow disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed transition-all duration-200 ease-out"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>

        {selectedInvoiceForPDF && (
          <InvoicePDFPreview
            invoice={selectedInvoiceForPDF}
            items={items || []}
            onClose={() => setSelectedInvoiceForPDF(null)}
          />
        )}
    </div>
  );
};
