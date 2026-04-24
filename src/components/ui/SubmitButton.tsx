"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "dark" | "outline";
}

export default function SubmitButton({ 
  children, 
  className = "", 
  loadingText = "Cargando...",
  variant = "primary"
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
    dark: "bg-gray-900 text-white hover:bg-black",
    outline: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
