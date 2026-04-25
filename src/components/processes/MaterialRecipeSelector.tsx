"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface MaterialRecipeSelectorProps {
  options: { label: string, category: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MaterialRecipeSelector({ options, value, onChange, placeholder = "Seleccionar material..." }: MaterialRecipeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(options.map(o => o.category));
    return ["Todos", ...Array.from(cats)].sort();
  }, [options]);

  // Filter options based on search and category
  const filteredOptions = useMemo(() => {
    return options.filter(opt => {
      const matchesSearch = opt.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || opt.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [options, searchTerm, selectedCategory]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full text-sm font-black border rounded-2xl px-5 py-4 transition-all text-left shadow-sm hover:shadow-md ${
          value 
            ? "bg-gray-900 text-white border-gray-900" 
            : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className="truncate uppercase tracking-wider">
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${value ? 'text-red-500' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 border-b border-gray-50 bg-gray-50/50 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                placeholder="Buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full transition-all border ${
                    selectedCategory === cat 
                      ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20" 
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto py-2">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-6 text-center">
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No hay resultados</p>
              </li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.label}
                  onClick={() => {
                    onChange(opt.label);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-red-50 transition-colors ${
                    value === opt.label ? "bg-red-50 text-red-900" : "text-gray-700"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{opt.category}</span>
                  </div>
                  {value === opt.label && <Check className="h-4 w-4 text-red-600" />}
                </li>
              ))
            )}
            
            <div className="border-t border-gray-50 mt-2 pt-2">
              <li
                onClick={() => {
                  onChange("OTRO");
                  setIsOpen(false);
                }}
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest text-center"
              >
                + Otro (Especificar en notas)
              </li>
            </div>
          </ul>
        </div>
      )}
    </div>
  );
}
