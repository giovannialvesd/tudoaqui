import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type ConfirmOptions = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && options && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancel}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={handleCancel}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    options.type === 'danger' ? 'bg-red-50 text-red-500' : 
                    options.type === 'warning' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {options.type === 'danger' ? <AlertCircle className="w-6 h-6" /> : 
                     options.type === 'warning' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-1 leading-tight">{options.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{options.description}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  >
                    {options.cancelText || 'Cancelar'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-md ${
                      options.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20 hover:shadow-red-500/40' : 
                      options.type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 hover:shadow-orange-500/40' : 
                      'bg-primary hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/40'
                    }`}
                  >
                    {options.confirmText || 'Confirmar'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};
