"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
}: ConfirmationModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) return null;

  const variants = {
    danger: {
      icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
      iconBg: "bg-red-100",
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white shadow-red-200",
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
      iconBg: "bg-orange-100",
      confirmBtn: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200",
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
      iconBg: "bg-blue-100",
      confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200",
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-8">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${currentVariant.iconBg}`}>
              {currentVariant.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{title}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50/50 p-6 flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg ${currentVariant.confirmBtn}`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-gray-100 transition-all border border-gray-100"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
