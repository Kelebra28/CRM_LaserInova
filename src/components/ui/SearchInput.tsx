"use client";

import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchInput({ 
  placeholder = "Buscar...", 
  value: controlledValue, 
  onChange: controlledOnChange 
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(searchParams.get("search") || "");

  // Use controlled value if provided, otherwise internal state
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    // Only sync with URL if NOT in controlled mode
    if (isControlled) return;

    const currentSearch = searchParams.get("search") || "";
    if (currentSearch === value) return;

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    const timeoutId = setTimeout(() => {
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, pathname, router, searchParams, isControlled]);

  const handleChange = (newValue: string) => {
    if (isControlled && controlledOnChange) {
      controlledOnChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <div className="relative rounded-xl shadow-sm max-w-md w-full group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 transition-colors ${isPending && !isControlled ? 'text-red-500 animate-pulse' : 'text-gray-400 group-focus-within:text-red-500'}`} aria-hidden="true" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="block w-full pl-11 pr-10 sm:text-sm border-gray-200 rounded-xl py-3 border bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all text-gray-900 placeholder-gray-400 font-medium"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
