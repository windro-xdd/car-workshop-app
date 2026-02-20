import { contextBridge, ipcRenderer } from 'electron';
import { Item, CreateItemInput, UpdateItemInput } from './types';

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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
