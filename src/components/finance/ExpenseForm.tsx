"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
// NOTE: This component is deprecated. Use TransactionForm instead.
// Kept for backward compatibility only.
import { createTransaction as createExpense } from "@/app/dashboard/finance/actions";
import SubmitButton from "@/components/ui/SubmitButton";

const categories = [
  "Salarios",
  "Renta",
  "Insumos",
  "Mantenimiento",
  "Publicidad",
  "Servicios (Luz, Agua)",
  "Otro",
];

export default function ExpenseForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Registrar Gasto
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Nuevo Gasto</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Registra egresos de operación</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={async (formData) => {
              await createExpense(formData);
              setIsOpen(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descripción</label>
                <input
                  name="description"
                  type="text"
                  required
                  placeholder="Ej: Salario Operador Semana 1"
                  className="w-full text-xs font-bold p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Monto ($)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full text-xs font-bold p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Categoría</label>
                  <select
                    name="category"
                    required
                    className="w-full text-xs font-bold p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Fecha</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full text-xs font-bold p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Notas</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full text-xs font-bold p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4">
                <SubmitButton
                  variant="primary"
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-red-900/20"
                >
                  Guardar Egreso
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
