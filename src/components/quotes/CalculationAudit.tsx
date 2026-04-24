"use client";

import { Info, Calculator, Zap, Scissors, TrendingUp } from "lucide-react";

interface CalculationAuditProps {
  concepts: any[];
  margin: number;
}

export default function CalculationAudit({ concepts, margin }: CalculationAuditProps) {
  const divisor = (100 - margin) / 100;

  return (
    <div className="bg-gray-900 text-gray-100 rounded-2xl p-6 shadow-2xl border border-gray-800 space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <Calculator className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest">Auditoría de Fórmulas</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">Transparencia en el motor de cálculo</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Fórmula 1: Material */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Scissors className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-tight text-blue-400">1. Costo de Material (con Merma)</span>
          </div>
          <p className="text-xs font-mono text-gray-300 leading-relaxed">
            Formula: <span className="text-white">Área (cm²) × Precio/cm² × 1.5</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-2 italic">
            * El factor 1.5 añade automáticamente un 50% de desperdicio por merma solicitado.
          </p>
        </div>

        {/* Fórmula 2: Máquina */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-black uppercase tracking-tight text-orange-400">2. Costo de Operación (Vida de Tubo)</span>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-mono text-gray-300 leading-relaxed">
              Base: <span className="text-white">(Precio Tubo / Horas Vida) / 60</span>
            </p>
            <p className="text-[11px] font-mono text-gray-300 leading-relaxed">
              Final: <span className="text-white">CostoBase × Tiempo × F. Miedo (2) × F. Prod (3)</span>
            </p>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 italic">
            * El "Factor de Miedo" duplica el costo base y el "Factor de Producción" lo triplica para cubrir gastos indirectos.
          </p>
        </div>


        {/* Fórmula 3: Precio de Venta */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-tight text-emerald-400">3. Precio Sugerido al Cliente</span>
          </div>
          <p className="text-xs font-mono text-gray-300 leading-relaxed">
            Formula: <span className="text-white">Costo Total / {divisor.toFixed(2)}</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-2 italic">
            * El divisor {divisor.toFixed(2)} se obtiene de tu margen del {margin}%. (Costo / (1 - Margen/100))
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-800">
        <div className="flex items-start gap-2 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-400 font-medium leading-normal">
            Nota: La utilidad neta proyectada es la diferencia entre el Precio de Venta (sin IVA) y el Costo Total de Operación. El IVA es considerado un impuesto y no parte de tu ganancia.
          </p>
        </div>
      </div>
    </div>
  );
}
