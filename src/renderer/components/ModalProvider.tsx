import React, { useState } from 'react';

interface ModalContextType {
  openModal: (title: string, message: string | null, options?: ModalOptions) => Promise<boolean>;
}

interface ModalOptions {
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  customContent?: React.ReactNode;
}

const ModalContext = React.createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    message: string | null;
    confirmText: string;
    cancelText: string;
    isDangerous: boolean;
    customContent?: React.ReactNode;
    resolve?: (value: boolean) => void;
  }>({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
  });

  const openModal = (title: string, message: string | null, options: ModalOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalData({
        title,
        message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        isDangerous: options.isDangerous || false,
        customContent: options.customContent,
        resolve,
      });
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    modalData.resolve?.(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    modalData.resolve?.(false);
    setIsOpen(false);
  };

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4 animate-in zoom-in-95 duration-300">
            <h2
              id="modal-title"
              className="text-lg font-bold text-zinc-900 mb-4"
            >
              {modalData.title}
            </h2>
            {modalData.customContent ? (
              <div className="mb-6">
                {modalData.customContent}
              </div>
            ) : (
              <p
                id="modal-description"
                className="text-zinc-600 text-sm mb-6"
              >
                {modalData.message}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors font-medium"
              >
                {modalData.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  modalData.isDangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {modalData.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
