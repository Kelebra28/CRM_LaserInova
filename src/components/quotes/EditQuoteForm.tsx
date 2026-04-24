"use client";

import { useState, useMemo, useEffect } from "react";
import { Calculator, Save, Trash2, Info, DollarSign } from "lucide-react";
import Link from "next/link";
import SubmitButton from "@/components/ui/SubmitButton";
import { calculateConcept, CalculationInput, GlobalCosts, MaterialData } from "@/lib/calculations";
import { updateQuoteAction } from "@/app/dashboard/quotes/actions";
import MaterialSelector from "@/components/quotes/MaterialSelector";
import ClientSelector from "@/components/quotes/ClientSelector";
import CalculationAudit from "@/components/quotes/CalculationAudit";


interface EditQuoteFormProps {
  quote: any;
  clients: any[];
  materials: any[];
  globalCosts: GlobalCosts;
}

export default function EditQuoteForm({ quote, clients, materials, globalCosts }: EditQuoteFormProps) {
  const [clientId, setClientId] = useState(quote.clientId || "");
  const [project, setProject] = useState(quote.project || "");
  const [description, setDescription] = useState(quote.description || "");
  const [isWholesale, setIsWholesale] = useState(false); // Podríamos guardarlo en DB pero por ahora default false
  const [margin, setMargin] = useState(globalCosts.margen_default || 35);

  // Mapear conceptos de DB a estado del form
  const [concepts, setConcepts] = useState<any[]>(
    quote.concepts.map((c: any) => ({
      id: c.id,
      type: c.conceptType,
      description: c.description,
      quantity: c.quantity,
      materialId: c.materialId,
      partWidth: c.width,
      partHeight: c.height,
      timeMin: c.cutTime,
      clientProvidesMaterial: c.clientProvidesMaterial,
      unitPrice: c.finalUnitPrice,
      totalAmount: c.totalAmount,
      realCost: c.realCost,
      utility: c.utility || (c.totalAmount - c.realCost),
      finalUnitPrice: c.finalUnitPrice,
      calculated: {
        finalUnitPrice: c.finalUnitPrice,
        totalAmount: c.totalAmount,
        realCost: c.realCost,
        suggestedPrice: c.suggestedPrice,
        materialCost: c.materialCost,
        productionCost: c.productionCost,
        utility: c.utility || (c.totalAmount - c.realCost),
      }
    }))
  );


  // Recalcular conceptos si cambian materiales o parámetros
  const updateConcept = (id: string, field: string, value: any) => {
    setConcepts(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        
        // Si el campo afecta el cálculo, recalcular
        if (["type", "quantity", "materialId", "partWidth", "partHeight", "timeMin", "clientProvidesMaterial"].includes(field)) {
          const mat = materials.find(m => m.id === (field === "materialId" ? value : updated.materialId));
          const result = calculateConcept(
            {
              type: updated.type,
              quantity: Number(updated.quantity),
              material: mat ? {
                length: mat.length,
                width: mat.width,
                sheetPrice: mat.sheetPrice,
                guardPercentage: mat.guardPercentage,
                pricePerCm2: mat.pricePerCm2,
              } : undefined,
              partWidth: Number(updated.partWidth),
              partHeight: Number(updated.partHeight),
              timeMin: Number(updated.timeMin),
              clientProvidesMaterial: updated.clientProvidesMaterial,
              isWholesale: isWholesale
            },
            { ...globalCosts, margen_default: margin } // Usar el margen actual
          );

          const suggestedUnit = result.suggestedPrice / (Number(updated.quantity) || 1);
          const finalUnit = updated.finalUnitPrice && updated.finalUnitPrice > 0 ? updated.finalUnitPrice : suggestedUnit;
          const totalAmount = finalUnit * (Number(updated.quantity) || 1);
          return { ...updated, calculated: result, finalUnitPrice: finalUnit, totalAmount: totalAmount };
        }
        
        // Si se cambia el precio final manualmente
        if (field === "finalUnitPrice") {
          const finalPrice = Number(parseFloat(value)) || 0;
          const totalAmount = finalPrice * Number(updated.quantity || 0);
          const utility = totalAmount - (Number(updated.calculated?.realCost) || 0);
          return { ...updated, finalUnitPrice: finalPrice, totalAmount, calculated: { ...updated.calculated, finalUnitPrice: finalPrice, totalAmount, utility } };
        }

        return updated;
      }
      return c;
    }));
  };

  // Recalcular todo si cambia el margen o el tipo de venta
  useEffect(() => {
    setConcepts(prev => prev.map(c => {
      const mat = materials.find(m => m.id === c.materialId);
      const result = calculateConcept(
        {
          type: c.type,
          quantity: Number(c.quantity),
          material: mat ? {
            length: mat.length,
            width: mat.width,
            sheetPrice: mat.sheetPrice,
            guardPercentage: mat.guardPercentage,
            pricePerCm2: mat.pricePerCm2,
          } : undefined,
          partWidth: Number(c.partWidth),
          partHeight: Number(c.partHeight),
          timeMin: Number(c.timeMin),
          clientProvidesMaterial: c.clientProvidesMaterial,
          isWholesale: isWholesale
        },
        { ...globalCosts, margen_default: margin }
      );
      const suggestedUnit = result.suggestedPrice / (Number(c.quantity) || 1);
      const finalUnit = c.finalUnitPrice && c.finalUnitPrice > 0 ? c.finalUnitPrice : suggestedUnit;
      const totalAmount = finalUnit * (Number(c.quantity) || 1);
      return { ...c, calculated: result, finalUnitPrice: finalUnit, totalAmount: totalAmount };
    }));
  }, [margin, isWholesale, globalCosts, materials]);

  const addConcept = (type: "CORTE" | "GRABADO" | "IMPRESION" | "PRODUCTO" | "OTRO") => {
    const newId = crypto.randomUUID();
    setConcepts([
      ...concepts,
      {
        id: newId,
        type,
        description: "",
        quantity: 1,
        materialId: "",
        partWidth: 0,
        partHeight: 0,
        timeMin: 0,
        clientProvidesMaterial: false,
        finalUnitPrice: 0,
        totalAmount: 0,
        calculated: null
      }
    ]);
  };

  const removeConcept = (id: string) => {
    setConcepts(concepts.filter(c => c.id !== id));
  };

  const { subtotal, iva, total, costoReal, utilidad } = useMemo(() => {
    const totalFinal = concepts.reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
    const real = concepts.reduce((sum, c) => sum + (Number(c.calculated?.realCost) || 0), 0);
    
    const ivaPercentage = Number(globalCosts?.porcentaje_iva) || 16;
    const subtotalNeto = totalFinal / (1 + (ivaPercentage / 100));
    const tax = totalFinal - subtotalNeto;
    
    // La utilidad se calcula sobre la diferencia bruta desglosando el IVA al final
    const util = (totalFinal - real) / (1 + (ivaPercentage / 100));

    return { subtotal: subtotalNeto, iva: tax, total: totalFinal, costoReal: real, utilidad: util };

  }, [concepts, globalCosts, isWholesale, margin]); // Agregar margin a dependencias



  return (
    <form action={updateQuoteAction} className="space-y-8">
      <input type="hidden" name="quoteId" value={quote.id} />
      <input type="hidden" name="userId" value={quote.userId} />
      <input type="hidden" name="subtotal" value={subtotal} />
      <input type="hidden" name="tax" value={iva} />
      <input type="hidden" name="total" value={total} />
      <input type="hidden" name="realCostTotal" value={costoReal} />
      <input type="hidden" name="estimatedUtility" value={utilidad} />
      <input type="hidden" name="concepts" value={JSON.stringify(concepts)} />

      {/* 1. Información General */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-medium text-gray-900">Información General</h2>
        </div>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <ClientSelector 
              clients={clients} 
              value={clientId} 
              onChange={setClientId} 
            />
            <input type="hidden" name="clientId" value={clientId} />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              name="project"
              id="project"
              required
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border text-gray-900"
            />
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Notas Internas
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 border text-gray-900"
            />
          </div>

          <div className="sm:col-span-6 flex flex-wrap items-center gap-6">
            <div className="flex items-center">
              <input
                id="isWholesale"
                type="checkbox"
                checked={isWholesale}
                onChange={(e) => setIsWholesale(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="isWholesale" className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer">
                Aplicar precio de Mayoreo
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="margin" className="block text-sm font-medium text-gray-700">
                Margen de Utilidad:
              </label>
              <div className="relative rounded-md shadow-sm w-24">
                <input
                  type="number"
                  id="margin"
                  value={margin === 0 && String(margin) !== "0" ? "" : margin}
                  onChange={(e) => setMargin(e.target.value === "" ? ("" as any) : Number(e.target.value))}
                  className="focus:ring-red-500 focus:border-red-500 block w-full pr-7 sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border font-bold text-red-600"
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">(Divisor: {( (100-margin)/100 ).toFixed(2)})</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Conceptos */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-medium text-gray-900">Conceptos</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addConcept("CORTE")} className="text-xs bg-gray-100 hover:bg-red-600 hover:text-white text-gray-800 py-2 px-4 rounded-lg font-bold transition-all uppercase tracking-wider">
              + Corte
            </button>
            <button type="button" onClick={() => addConcept("GRABADO")} className="text-xs bg-gray-100 hover:bg-orange-600 hover:text-white text-gray-800 py-2 px-4 rounded-lg font-bold transition-all uppercase tracking-wider">
              + Grabado
            </button>
            <button type="button" onClick={() => addConcept("IMPRESION")} className="text-xs bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-800 py-2 px-4 rounded-lg font-bold transition-all uppercase tracking-wider">
              + Impresión
            </button>
            <button type="button" onClick={() => addConcept("PRODUCTO")} className="text-xs bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-800 py-2 px-4 rounded-lg font-bold transition-all uppercase tracking-wider">
              + Producto
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {concepts.map((concept, index) => (
            <div key={concept.id} className="border border-gray-100 rounded-xl p-6 bg-gray-50/50 relative group">
              <button
                type="button"
                onClick={() => removeConcept(concept.id)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <span className={`text-[10px] font-black px-2 py-1 rounded-md text-white uppercase tracking-widest ${
                  concept.type === "CORTE" ? "bg-red-600" :
                  concept.type === "GRABADO" ? "bg-orange-600" :
                  concept.type === "IMPRESION" ? "bg-blue-600" :
                  concept.type === "PRODUCTO" ? "bg-emerald-600" : "bg-gray-600"
                }`}>
                  {concept.type}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Concepto #{index + 1}</span>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                  <input
                    type="text"
                    value={concept.description}
                    onChange={e => updateConcept(concept.id, "description", e.target.value)}
                    placeholder="Ej. Letrero de acrílico..."
                    className="w-full text-sm font-medium border-gray-200 rounded-lg p-2.5 border bg-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={concept.quantity === 0 && String(concept.quantity) !== "0" ? "" : concept.quantity}
                    onChange={e => updateConcept(concept.id, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full text-sm font-bold border-gray-200 rounded-lg p-2.5 border bg-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-6">
                  <MaterialSelector 
                    materials={materials} 
                    value={concept.materialId}
                    onChange={(id) => updateConcept(concept.id, "materialId", id)}
                  />
                </div>

                {/* Parámetros según tipo */}
                {concept.type === "CORTE" && (
                  <>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ancho (cm)</label>
                      <input type="number" step="0.1" value={concept.partWidth === 0 && String(concept.partWidth) !== "0" ? "" : concept.partWidth} onChange={e => updateConcept(concept.id, "partWidth", e.target.value === "" ? "" : Number(e.target.value))} className="w-full text-sm border-gray-200 rounded-lg p-2.5 border" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alto (cm)</label>
                      <input type="number" step="0.1" value={concept.partHeight === 0 && String(concept.partHeight) !== "0" ? "" : concept.partHeight} onChange={e => updateConcept(concept.id, "partHeight", e.target.value === "" ? "" : Number(e.target.value))} className="w-full text-sm border-gray-200 rounded-lg p-2.5 border" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiempo (min)</label>
                      <input type="number" step="1" value={concept.timeMin === 0 && String(concept.timeMin) !== "0" ? "" : concept.timeMin} onChange={e => updateConcept(concept.id, "timeMin", e.target.value === "" ? "" : Number(e.target.value))} className="w-full text-sm border-gray-200 rounded-lg p-2.5 border" />
                    </div>
                    <div className="sm:col-span-3 flex items-center pt-4">
                      <input type="checkbox" checked={concept.clientProvidesMaterial} onChange={e => updateConcept(concept.id, "clientProvidesMaterial", e.target.checked)} className="h-4 w-4 text-red-600 rounded" />
                      <label className="ml-2 text-[10px] font-bold text-gray-400 uppercase">Cliente trae material</label>
                    </div>
                  </>
                )}

                {/* Cálculo Final */}
                <div className="sm:col-span-12 mt-4 pt-4 border-t border-gray-200/50 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex gap-8">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Precio Unitario</span>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-1">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={concept.finalUnitPrice === 0 && String(concept.finalUnitPrice) !== "0" ? "" : concept.finalUnitPrice}
                          onChange={e => updateConcept(concept.id, "finalUnitPrice", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-24 text-sm font-black text-gray-900 border-none p-0 focus:ring-0 bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sugerido</span>
                      <span className="text-xs font-bold text-gray-400 italic">${concept.calculated?.suggestedPrice?.toFixed(2) || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Costo Real</span>
                      <span className="text-xs font-bold text-gray-400">${concept.calculated?.realCost?.toFixed(2) || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Utilidad</span>
                      <span className={`text-xs font-bold ${concept.calculated?.utility! < 0 ? "text-red-500" : "text-emerald-500"}`}>
                        ${concept.calculated?.utility?.toFixed(2) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Subtotal Concepto</span>
                    <span className="text-lg font-black text-gray-900">
                      ${(Number(concept.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Resumen */}
      <div className="bg-gray-900 text-white rounded-xl p-6 md:p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Calculator className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Análisis Interno</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm group">
                <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors">Costo Total de Operación:</span>
                <span className="font-mono font-bold text-gray-100">
                  ${costoReal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Desglose Operativo */}
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-700/50">
                <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-gray-500">
                  <span>Material Neto:</span>
                  <span className="font-mono text-gray-300">${concepts.reduce((sum, c) => sum + (Number(c.calculated?.materialBaseCost) || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-gray-500">
                  <span>Merma (50%):</span>
                  <span className="font-mono text-gray-300">${concepts.reduce((sum, c) => sum + (Number(c.calculated?.materialWastageCost) || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-gray-500">
                  <span>Costo Máquina/MO:</span>
                  <span className="font-mono text-gray-300">${concepts.reduce((sum, c) => sum + (Number(c.calculated?.productionCost) || 0), 0).toFixed(2)}</span>
                </div>
              </div>

              
              <div className="flex justify-between items-end group">
                <div>
                  <span className="text-gray-400 font-medium text-sm group-hover:text-gray-300 transition-colors block">Utilidad Proyectada:</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Neto: ${utilidad.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-black block leading-none ${utilidad < 0 ? "text-red-500" : "text-emerald-400"}`}>
                    ${(utilidad * (1 + (Number(globalCosts?.porcentaje_iva || 16) / 100))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Utilidad Bruta (C/IVA)</span>
                </div>
              </div>

              
              <div className="pt-4 border-t border-gray-800 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Margen sobre Venta</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-12 rounded-full overflow-hidden bg-gray-800`}>
                      <div 
                        className={`h-full transition-all duration-500 ${utilidad < 0 ? "bg-red-500" : "bg-emerald-500"}`} 
                        style={{ width: `${Math.min(Math.max(subtotal > 0 ? (utilidad / subtotal) * 100 : 0, 0), 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-black ${utilidad < 0 ? "text-red-500" : "text-emerald-400"}`}>
                      {subtotal > 0 ? ((utilidad / subtotal) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Auditoría de Fórmulas */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <CalculationAudit concepts={concepts} margin={margin} />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white">Resumen de Venta</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm group">
                  <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors">Subtotal:</span>
                  <span className="font-mono font-bold text-gray-100">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm group">
                  <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors">IVA ({globalCosts?.porcentaje_iva || 16}%):</span>
                  <span className="font-mono font-bold text-gray-100">${iva.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-800">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">Total a Pagar</span>
                    <div className="text-right">
                      <span className="text-4xl font-black text-red-500 block leading-none">
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 block">Pesos Mexicanos (MXN)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-end gap-4">
              <Link
                href={`/dashboard/quotes/${quote.id}`}
                className="inline-flex items-center justify-center py-3 px-8 border border-gray-700 text-gray-400 text-sm font-bold rounded-lg hover:bg-gray-800 transition-all active:scale-95"
              >
                Cancelar
              </Link>
              <SubmitButton
                variant="primary"
                loadingText="Actualizando..."
                className="py-3 px-12 text-sm font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-900/20"
              >
                <Save className="mr-2 h-5 w-5" />
                Guardar Cambios
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
