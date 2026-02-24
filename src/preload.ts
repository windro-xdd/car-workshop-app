import { contextBridge, ipcRenderer } from 'electron';
import { Item, CreateItemInput, UpdateItemInput, Invoice, GstConfig, User, LoginInput, CreateUserInput, BusinessConfig } from './types';

interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const electronAPI = {
  getItems: () =>
    ipcRenderer.invoke('get-items') as Promise<IpcResponse<Item[]>>,

  createItem: (data: CreateItemInput) =>
    ipcRenderer.invoke('create-item', data) as Promise<IpcResponse<Item>>,

  updateItem: (data: UpdateItemInput) =>
    ipcRenderer.invoke('update-item', data) as Promise<IpcResponse<Item>>,

  deleteItem: (id: string) =>
    ipcRenderer.invoke('delete-item', id) as Promise<IpcResponse<void>>,

  bulkImportItems: (data: { items: any[], filePath: string }) =>
    ipcRenderer.invoke('bulk-import-items', data) as Promise<
      IpcResponse<{ success: number; failed: number; errors: string[] }>
    >,

  getInvoices: () =>
    ipcRenderer.invoke('get-invoices') as Promise<IpcResponse<Invoice[]>>,

  createInvoice: (data: any) =>
    ipcRenderer.invoke('create-invoice', data) as Promise<IpcResponse<Invoice>>,

  deleteInvoice: (id: string) =>
    ipcRenderer.invoke('delete-invoice', id) as Promise<IpcResponse<void>>,

  getGstConfig: () =>
    ipcRenderer.invoke('get-gst-config') as Promise<IpcResponse<GstConfig>>,

  updateGstConfig: (data: GstConfig) =>
    ipcRenderer.invoke('update-gst-config', data) as Promise<IpcResponse<GstConfig>>,

  generateInvoicePDF: (invoiceId: string) =>
    ipcRenderer.invoke('generate-invoice-pdf', invoiceId) as Promise<
      IpcResponse<{ filePath: string; fileName: string }>
    >,

  saveInvoicePDF: (invoiceId: string) =>
    ipcRenderer.invoke('save-invoice-pdf', invoiceId) as Promise<
      IpcResponse<{ filePath: string; fileName: string }>
    >,

  printInvoicePDF: (invoiceId: string) =>
    ipcRenderer.invoke('print-invoice-pdf', invoiceId) as Promise<
      IpcResponse<{ filePath: string; fileName: string }>
    >,

  createAmendment: (data: any) =>
    ipcRenderer.invoke('create-amendment', data) as Promise<IpcResponse<Invoice>>,

  listAmendmentsForInvoice: (invoiceId: string) =>
    ipcRenderer.invoke('list-amendments-for-invoice', invoiceId) as Promise<IpcResponse<Invoice[]>>,

  createBackup: (options?: { customPath?: boolean }) =>
    ipcRenderer.invoke('create-backup', options) as Promise<
      IpcResponse<{ backupPath: string; fileName: string; timestamp: string }>
    >,

  listBackups: () =>
    ipcRenderer.invoke('list-backups') as Promise<
      IpcResponse<{ fileName: string; filePath: string; size: number; createdAt: Date }[]>
    >,

  restoreBackup: (backupPath: string) =>
    ipcRenderer.invoke('restore-backup', backupPath) as Promise<IpcResponse<{ message: string; backupPath: string }>>,

  deleteBackup: (backupPath: string) =>
    ipcRenderer.invoke('delete-backup', backupPath) as Promise<IpcResponse<{ message: string }>>,

  registerUser: (data: CreateUserInput) =>
    ipcRenderer.invoke('register-user', data) as Promise<IpcResponse<User>>,

  loginUser: (data: LoginInput) =>
    ipcRenderer.invoke('login-user', data) as Promise<IpcResponse<User>>,

  getUsers: () =>
    ipcRenderer.invoke('get-users') as Promise<IpcResponse<User[]>>,

  getBusinessConfig: () =>
    ipcRenderer.invoke('get-business-config') as Promise<IpcResponse<BusinessConfig>>,

  updateBusinessConfig: (data: Partial<BusinessConfig>) =>
    ipcRenderer.invoke('update-business-config', data) as Promise<IpcResponse<BusinessConfig>>,

  saveLogoFile: (data: { buffer: number[]; fileName: string }) =>
    ipcRenderer.invoke('save-logo-file', data) as Promise<IpcResponse<{ logoPath: string }>>,

  readLogoFile: (logoPath: string) =>
    ipcRenderer.invoke('read-logo-file', logoPath) as Promise<
      IpcResponse<{ buffer: number[]; mimeType: string }>
    >,

  openPdf: (filePath: string) =>
    ipcRenderer.invoke('open-pdf', filePath) as Promise<IpcResponse<void>>,

  clearDatabase: () =>
    ipcRenderer.invoke('clear-database') as Promise<IpcResponse<{ message: string }>>,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
