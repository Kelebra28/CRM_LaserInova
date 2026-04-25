"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error";
}

export default function StatusModal({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
}: StatusModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) return null;

  const styles = {
    success: {
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
      iconBg: "bg-emerald-100",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
    },
    error: {
      icon: <AlertCircle className="h-8 w-8 text-red-600" />,
      iconBg: "bg-red-100",
      btn: "bg-red-600 hover:bg-red-700 text-white shadow-red-200",
    },
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${currentStyle.iconBg}`}>
            {currentStyle.icon}
          </div>
          
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
            {message}
          </p>
          
          <button
            onClick={onClose}
            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg ${currentStyle.btn}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
