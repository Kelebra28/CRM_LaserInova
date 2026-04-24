"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface StatusGridButtonProps {
  label: string;
  isActive: boolean;
  colorClass: string;
}

export default function StatusGridButton({ label, isActive, colorClass }: StatusGridButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || isActive}
      className={`w-full group relative flex items-center justify-between px-4 py-3 text-xs font-bold rounded-xl border transition-all ${
        isActive
          ? `${colorClass} ring-2 ring-offset-2 ring-gray-200 scale-[1.02] z-10 opacity-100`
          : "bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
      } ${pending ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center">
        {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        <span>{label}</span>
      </div>
      {isActive && !pending && <div className="h-2 w-2 rounded-full bg-current animate-pulse" />}
      {!isActive && !pending && (
        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[8px] bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase">
          Cambiar
        </div>
      )}
    </button>
  );
}
