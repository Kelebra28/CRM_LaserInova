"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface MaterialSelectorProps {
  materials: any[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export default function MaterialSelector({ materials, value, onChange, disabled }: MaterialSelectorProps) {
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
    const cats = new Set(materials.map(m => m.category?.name || "Otros"));
    return ["Todos", ...Array.from(cats)].sort();
  }, [materials]);

  // Filter materials based on search and category
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (m.brand && m.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "Todos" || (m.category?.name || "Otros") === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchTerm, selectedCategory]);

  const selectedMaterial = materials.find(m => m.id === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`mt-1 flex items-center justify-between w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-3 border bg-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-50"
        }`}
      >
        <span className="truncate">
          {selectedMaterial ? `${selectedMaterial.name} ${selectedMaterial.brand ? `(${selectedMaterial.brand})` : ''}` : "Seleccionar material..."}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-xl rounded-md border border-gray-200 overflow-hidden" style={{ minWidth: "300px" }}>
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            {/* Search Input */}
            <div className="relative mb-2">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                autoFocus
                className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors ${
                    selectedCategory === cat 
                      ? "bg-red-100 text-red-800 border border-red-200" 
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto py-1 text-sm text-gray-700">
            {filteredMaterials.length === 0 ? (
              <li className="px-3 py-4 text-center text-gray-500 text-sm">No se encontraron materiales</li>
            ) : (
              filteredMaterials.map((m) => (
                <li
                  key={m.id}
                  onClick={() => {
                    onChange(m.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors ${
                    value === m.id ? "bg-red-50 text-red-900 font-medium" : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{m.name} {m.brand && <span className="text-gray-400 text-xs ml-1">({m.brand})</span>}</span>
                    <span className="text-xs text-gray-500">${(m.pricePerCm2 * 10000).toFixed(2)}/m²</span>
                  </div>
                  {value === m.id && <Check className="h-4 w-4 text-red-600" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
