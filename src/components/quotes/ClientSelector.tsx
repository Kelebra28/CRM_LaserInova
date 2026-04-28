"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, UserPlus, X } from "lucide-react";

interface ClientSelectorProps {
  clients: any[];
  value: string;
  onChange: (id: string) => void;
  onProspectNameChange?: (name: string) => void;
  prospectName?: string;
  disabled?: boolean;
}

export default function ClientSelector({
  clients,
  value,
  onChange,
  onProspectNameChange,
  prospectName = "",
  disabled,
}: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"select" | "prospect">(
    prospectName && !value ? "prospect" : "select"
  );
  const [localProspect, setLocalProspect] = useState(prospectName);
  const [saveAsClient, setSaveAsClient] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [clients, searchTerm]);

  const selectedClient = clients.find((c) => c.id === value);

  const switchToProspect = () => {
    onChange("");
    setMode("prospect");
    setIsOpen(false);
  };

  const switchToClient = () => {
    setLocalProspect("");
    setSaveAsClient(false);
    onProspectNameChange?.("");
    setMode("select");
  };

  if (mode === "prospect") {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            value={localProspect}
            onChange={(e) => {
              setLocalProspect(e.target.value);
              onProspectNameChange?.(e.target.value);
            }}
            placeholder="Nombre del prospecto / empresa..."
            className="flex-1 text-sm border-orange-300 rounded-md py-2 px-3 border bg-orange-50 text-gray-900 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={switchToClient}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-all"
            title="Buscar cliente registrado"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1 px-1">
          <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wide">
            Modo Prospecto
          </p>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={saveAsClient}
                onChange={(e) => setSaveAsClient(e.target.checked)}
                className="peer h-3.5 w-3.5 appearance-none rounded-sm border border-orange-300 bg-white checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer"
              />
              <Check className="absolute h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5" />
            </div>
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter group-hover:text-orange-700 transition-colors">
              ¿Guardar como cliente?
            </span>
          </label>
        </div>
        <input type="hidden" name="clientId" value="" />
        <input type="hidden" name="prospectName" value={localProspect} />
        <input type="hidden" name="saveAsClient" value={saveAsClient ? "true" : "false"} />
      </div>
    );
  }

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

      {/* Hidden inputs */}
      <input type="hidden" name="clientId" value={value} />
      <input type="hidden" name="prospectName" value="" />

      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full bg-white shadow-xl rounded-md border border-gray-200 overflow-hidden"
          style={{ minWidth: "260px" }}
        >
          <div className="p-2 border-b border-gray-100 bg-gray-50">
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
            {/* Clear selection */}
            {value && (
              <li
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-50"
              >
                <X className="h-3 w-3" /> Quitar selección
              </li>
            )}

            {filteredClients.length === 0 ? (
              <li className="px-3 py-4 text-center text-gray-500 text-sm">
                No se encontraron clientes
              </li>
            ) : (
              filteredClients.map((c) => (
                <li
                  key={c.id}
                  onClick={() => { onChange(c.id); setIsOpen(false); }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors ${
                    value === c.id ? "bg-red-50 text-red-900 font-medium" : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    {(c.email || c.company) && (
                      <span className="text-xs text-gray-500 mt-0.5">
                        {c.company ? `${c.company} ` : ""}
                        {c.company && c.email ? "• " : ""}
                        {c.email}
                      </span>
                    )}
                  </div>
                  {value === c.id && <Check className="h-4 w-4 text-red-600" />}
                </li>
              ))
            )}
          </ul>

          {/* Prospect mode option */}
          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={switchToProspect}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-md transition-all uppercase tracking-wider"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Agregar como Prospecto (sin registro)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
