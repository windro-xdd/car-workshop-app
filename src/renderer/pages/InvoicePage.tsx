import React, { useEffect, useState } from 'react';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceSummary } from '../components/InvoiceSummary';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoicePDFPreview } from '../components/InvoicePDFPreview';
import { AmendmentForm } from '../components/AmendmentForm';
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
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState<Invoice | null>(null);
  const [selectedInvoiceForAmendment, setSelectedInvoiceForAmendment] = useState<Invoice | null>(null);

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
         setError(null);
         showToast(`Invoice created: ${invoiceNumber}`, 'success', 4000);
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

   const handleDeleteInvoice = async (id: string) => {
     setLoading(true);
     try {
       const result = await window.electronAPI.deleteInvoice(id);
       if (result.success) {
         setInvoices((invoices || []).filter((inv) => inv.id !== id));
         setError(null);
         showToast('Invoice deleted successfully', 'success', 4000);
       } else {
         setError(result.error || 'Failed to delete invoice');
         showToast(result.error || 'Failed to delete invoice', 'error', 5000);
       }
     } catch (err) {
       setError('Error deleting invoice');
       showToast('Error deleting invoice', 'error', 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

   const handleDownloadPDF = async (invoiceId: string) => {
     const invoice = invoices?.find((inv) => inv.id === invoiceId);
     if (!invoice) {
       showToast('Invoice not found', 'error', 4000);
       return;
     }
     setSelectedInvoiceForPDF(invoice);
   };

   const handleCreateAmendment = async (data: any) => {
     setLoading(true);
     try {
       const result = await window.electronAPI.createAmendment(data);
       if (result.success) {
         const amendment = result.data as Invoice;
         setInvoices([...(invoices || []), amendment]);
         setSelectedInvoiceForAmendment(null);
         showToast(`Amendment created: ${amendment.invoiceNumber}`, 'success', 4000);
       } else {
         showToast(`Error: ${result.error}`, 'error', 5000);
       }
     } catch (err) {
       showToast(`Failed to create amendment`, 'error', 5000);
     } finally {
       setLoading(false);
     }
   };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Invoice Management</h1>
        <p className="text-gray-600 mb-8">Create and manage workshop invoices</p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <InvoiceForm
              items={items || []}
              gstPercentage={gstPercentage}
              onLineItemAdd={handleLineItemAdd}
              onCustomerInfoChange={(info) => {
                setCustomerName(info.customerName);
                setCustomerPhone(info.customerPhone || '');
                setCustomerEmail(info.customerEmail || '');
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
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>

        <InvoiceTable
          invoices={invoices || []}
          onSelectInvoice={(invoice) => {
            showToast(`Viewing invoice: ${invoice.invoiceNumber}`, 'info', 3000);
          }}
          onDeleteInvoice={handleDeleteInvoice}
          onDownloadPDF={handleDownloadPDF}
          onCreateAmendment={(invoiceId) => {
            const inv = invoices?.find((i) => i.id === invoiceId);
            if (inv) setSelectedInvoiceForAmendment(inv);
          }}
        />

        {selectedInvoiceForPDF && (
          <InvoicePDFPreview
            invoice={selectedInvoiceForPDF}
            onClose={() => setSelectedInvoiceForPDF(null)}
            onDownload={async (invoiceId: string) => {
              const result = await window.electronAPI.saveInvoicePDF(invoiceId);
              if (result.success) {
                showToast(`PDF saved: ${result.data?.fileName}`, 'success', 4000);
                setSelectedInvoiceForPDF(null);
              } else {
                showToast(`Error: ${result.error}`, 'error', 5000);
              }
            }}
          />
        )}

        {selectedInvoiceForAmendment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Create Amendment: {selectedInvoiceForAmendment.invoiceNumber}</h2>
                <button
                  onClick={() => setSelectedInvoiceForAmendment(null)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <AmendmentForm
                  originalInvoice={selectedInvoiceForAmendment}
                  items={items || []}
                  onSubmit={handleCreateAmendment}
                  onCancel={() => setSelectedInvoiceForAmendment(null)}
                  isLoading={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
