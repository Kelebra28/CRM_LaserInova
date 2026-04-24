"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface ClientSelectorProps {
  clients: any[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export default function ClientSelector({ clients, value, onChange, disabled }: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
             (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [clients, searchTerm]);

  const selectedClient = clients.find(c => c.id === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`mt-1 flex items-center justify-between w-full text-base sm:text-sm border-gray-300 rounded-md py-2 px-3 border bg-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-50"
        }`}
      >
        <span className="truncate">
          {selectedClient ? selectedClient.name : "Seleccionar cliente..."}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
      </button>

      {/* Hidden input to ensure the form submission still gets the value */}
      <input type="hidden" name="clientId" value={value} required />

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-xl rounded-md border border-gray-200 overflow-hidden" style={{ minWidth: "250px" }}>
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                autoFocus
                className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Buscar por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto py-1 text-sm text-gray-700">
            {filteredClients.length === 0 ? (
              <li className="px-3 py-4 text-center text-gray-500 text-sm">No se encontraron clientes</li>
            ) : (
              filteredClients.map((c) => (
                <li
                  key={c.id}
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors ${
                    value === c.id ? "bg-red-50 text-red-900 font-medium" : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    {(c.email || c.company) && (
                      <span className="text-xs text-gray-500 mt-0.5">
                        {c.company ? `${c.company} ` : ''}{c.company && c.email ? '• ' : ''}{c.email}
                      </span>
                    )}
                  </div>
                  {value === c.id && <Check className="h-4 w-4 text-red-600" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
