"use client";

import { useState, useMemo } from "react";
import { Calculator, Save, Plus, Trash2, Info, DollarSign } from "lucide-react";
import SubmitButton from "@/components/ui/SubmitButton";
import { calculateConcept, CalculationInput, GlobalCosts, MaterialData } from "@/lib/calculations";
import { createQuoteAction } from "@/app/dashboard/quotes/actions";
import MaterialSelector from "@/components/quotes/MaterialSelector";
import ClientSelector from "@/components/quotes/ClientSelector";
import CalculationAudit from "@/components/quotes/CalculationAudit";


interface NewQuoteFormProps {
  clients: any[];
  materials: any[];
  globalCosts: GlobalCosts;
  userId: string;
}

export default function NewQuoteForm({ clients, materials, globalCosts, userId }: NewQuoteFormProps) {
  const [clientId, setClientId] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [isWholesale, setIsWholesale] = useState(false);
  const [taxable, setTaxable] = useState(true);
  const [margin, setMargin] = useState(globalCosts.margen_default || 35);
  
  const [concepts, setConcepts] = useState<any[]>([]);

  const addConcept = (type: "CORTE" | "GRABADO" | "IMPRESION" | "PRODUCTO" | "OTRO" | "RESALE") => {
    setConcepts([
      ...concepts,
      {
        id: crypto.randomUUID(),
        type,
        description: "",
        quantity: 1,
        materialId: "",
        clientProvidesMaterial: false,
        partWidth: "",
        partHeight: "",
        timeMin: "",
        manualUnitPrice: "",
        manualUnitCost: "",
        // Resultados calculados
        materialCost: 0,
        productionCost: 0,
        realCost: 0,
        suggestedPrice: 0,
        finalUnitPrice: 0,
        totalAmount: 0,
      }
    ]);
  };

  const removeConcept = (id: string) => {
    setConcepts(concepts.filter(c => c.id !== id));
  };

  const updateConcept = (id: string, field: string, value: any) => {
    setConcepts(concepts.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        return updated;
      }
      return c;
    }));
  };

  const calculateConceptTotals = (concept: any) => {
    const input: CalculationInput = {
      type: concept.type,
      quantity: Number(concept.quantity) || 1,
      partWidth: Number(concept.partWidth) || 0,
      partHeight: Number(concept.partHeight) || 0,
      timeMin: Number(concept.timeMin) || 0,
      clientProvidesMaterial: concept.clientProvidesMaterial,
      isWholesale: isWholesale,
      manualUnitPrice: Number(concept.manualUnitPrice) || 0,
      manualCost: (Number(concept.manualUnitCost) || 0) * (Number(concept.quantity) || 1),
    };

    if (concept.materialId) {
      const mat = materials.find(m => m.id === concept.materialId);
      if (mat) {
        input.material = {
          length: mat.length,
          width: mat.width,
          sheetPrice: mat.sheetPrice,
          guardPercentage: mat.guardPercentage,
          pricePerCm2: mat.pricePerCm2,
        };
      }
    }

    // Usar el margen configurado en el form
    const result = calculateConcept(input, { ...globalCosts, margen_default: Number(margin) || 35 });
    
    // Si no han fijado un precio unitario final manualmente, usar el precio unitario sugerido (suggestedPrice / quantity)
    const suggestedUnit = result.suggestedPrice / input.quantity;
    const finalUnit = concept.finalUnitPrice && Number(concept.finalUnitPrice) > 0 ? concept.finalUnitPrice : suggestedUnit;
    const finalUnitNum = Number(finalUnit) || 0;
    const totalAmount = finalUnitNum * input.quantity;

    updateConcept(concept.id, "calculated", {
      ...result,
      finalUnitPrice: Number(finalUnitNum.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2))
    });
  };

  const calculateAll = () => {
    concepts.forEach(c => calculateConceptTotals(c));
  };


  // Totales — respeta el toggle de IVA
  const { subtotal, iva, total, costoReal, utilidad } = useMemo(() => {
    let conceptsSum = 0;
    let real = 0;
    concepts.forEach(c => {
      conceptsSum += (Number(c.calculated?.totalAmount) || 0);
      real += (Number(c.calculated?.realCost) || 0);
    });

    const ivaPercentage = Number(globalCosts?.porcentaje_iva) || 16;

    if (!taxable) {
      return { subtotal: conceptsSum, iva: 0, total: conceptsSum, costoReal: real, utilidad: conceptsSum - real };
    }

    const totalFinal = conceptsSum;
    const subtotalNeto = totalFinal / (1 + (ivaPercentage / 100));
    const tax = totalFinal - subtotalNeto;
    const util = (totalFinal - real) / (1 + (ivaPercentage / 100));
    return { subtotal: subtotalNeto, iva: tax, total: totalFinal, costoReal: real, utilidad: util };

  }, [concepts, globalCosts, isWholesale, margin, taxable]);



  return (
    <form action={createQuoteAction} className="space-y-8">
      {/* Datos ocultos para enviar al server */}
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="subtotal" value={subtotal} />
      <input type="hidden" name="iva" value={iva} />
      <input type="hidden" name="total" value={total} />
      <input type="hidden" name="taxable" value={taxable ? "true" : "false"} />
      <input type="hidden" name="realCostTotal" value={costoReal} />
      <input type="hidden" name="estimatedUtility" value={utilidad} />
      <input type="hidden" name="conceptsData" value={JSON.stringify(concepts)} />
      <input type="hidden" name="prospectName" value={prospectName} />
      <input type="hidden" name="globalCostsSnapshot" value={JSON.stringify(globalCosts)} />

      {/* 1. Datos Generales */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Datos Generales</h2>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente (Opcional)</label>
            <ClientSelector
              clients={clients}
              value={clientId}
              onChange={(id) => setClientId(id)}
              onProspectNameChange={(name) => setProspectName(name)}
              prospectName={prospectName}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Proyecto *</label>
            <input
              type="text"
              name="project"
              value={project}
              onChange={e => setProject(e.target.value)}
              required
              placeholder="Ej. Señalética Corporativa"
              className="mt-1 shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900 placeholder-gray-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción General (Opcional)</label>
            <input
              type="text"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border py-2 px-3"
              placeholder="Ej: Servicio de personalización..."
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-6">
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
              <input type="hidden" name="isWholesale" value={isWholesale ? "true" : "false"} />
            </div>
            <div
              onClick={() => setTaxable(!taxable)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all select-none ${taxable ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
            >
              <div className={`w-9 h-5 rounded-full transition-all relative ${taxable ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${taxable ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-xs font-black uppercase tracking-wide">
                {taxable ? 'Con IVA (16%)' : 'Sin IVA / Sin Factura'}
              </span>
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
            <button type="button" onClick={() => addConcept("CORTE")} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-md font-medium transition-colors">
              + Corte
            </button>
            <button type="button" onClick={() => addConcept("GRABADO")} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-md font-medium transition-colors">
              + Grabado
            </button>
            <button type="button" onClick={() => addConcept("RESALE")} className="text-sm bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-3 rounded-md font-bold transition-colors border border-red-200">
              + Reventa
            </button>
            <button type="button" onClick={() => addConcept("IMPRESION")} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-md font-medium transition-colors">
              + Impresión
            </button>
            <button type="button" onClick={() => addConcept("PRODUCTO")} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-md font-medium transition-colors">
              + Producto
            </button>
            <button type="button" onClick={() => addConcept("OTRO")} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-md font-medium transition-colors">
              + Otro
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {concepts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Agrega conceptos a la cotización.</p>
          ) : (
            concepts.map((concept, index) => (
              <div key={concept.id} className="border border-gray-200 rounded-md p-4 bg-gray-50 relative">
                <button
                  type="button"
                  onClick={() => removeConcept(concept.id)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white ${
                    concept.type === "CORTE" ? "bg-red-600" :
                    concept.type === "GRABADO" ? "bg-orange-600" :
                    concept.type === "IMPRESION" ? "bg-blue-600" :
                    concept.type === "PRODUCTO" ? "bg-emerald-600" : 
                    concept.type === "RESALE" ? "bg-red-700" : "bg-gray-600"
                  }`}>
                    {concept.type === "RESALE" ? "REVENTA" : concept.type}
                  </span>
                  <span className="text-sm font-medium text-gray-700">Concepto #{index + 1}</span>
                </div>

                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Descripción</label>
                    <input
                      type="text"
                      value={concept.description}
                      onChange={e => updateConcept(concept.id, "description", e.target.value)}
                      className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={concept.quantity === 0 && String(concept.quantity) !== "0" ? "" : concept.quantity}
                      onChange={e => updateConcept(concept.id, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                      className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border"
                    />
                  </div>

                  {/* Campos para CORTE o GRABADO */}
                  {(concept.type === "CORTE" || concept.type === "GRABADO") && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Material</label>
                        <MaterialSelector
                          materials={materials}
                          value={concept.materialId}
                          onChange={(id) => updateConcept(concept.id, "materialId", id)}
                          disabled={concept.clientProvidesMaterial}
                        />
                        <div className="mt-2 flex items-center">
                          <input
                            type="checkbox"
                            id={`clientMaterial-${concept.id}`}
                            checked={concept.clientProvidesMaterial}
                            onChange={(e) => updateConcept(concept.id, "clientProvidesMaterial", e.target.checked)}
                            className="h-3 w-3 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`clientMaterial-${concept.id}`} className="ml-2 block text-xs text-gray-600">
                            El cliente trae el material (Costo Material $0)
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Largo (cm)</label>
                        <input
                          type="number"
                          value={concept.partWidth === 0 && String(concept.partWidth) !== "0" ? "" : concept.partWidth}
                          onChange={e => updateConcept(concept.id, "partWidth", e.target.value === "" ? "" : Number(e.target.value))}
                          disabled={concept.clientProvidesMaterial}
                          className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Ancho (cm)</label>
                        <input
                          type="number"
                          value={concept.partHeight === 0 && String(concept.partHeight) !== "0" ? "" : concept.partHeight}
                          onChange={e => updateConcept(concept.id, "partHeight", e.target.value === "" ? "" : Number(e.target.value))}
                          disabled={concept.clientProvidesMaterial}
                          className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Tiempo total (minutos)</label>
                        <input
                          type="number"
                          value={concept.timeMin === 0 && String(concept.timeMin) !== "0" ? "" : concept.timeMin}
                          onChange={e => updateConcept(concept.id, "timeMin", e.target.value === "" ? "" : Number(e.target.value))}
                          className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border"
                        />
                      </div>
                    </>
                  )}

                  {/* Campos para IMPRESION, PRODUCTO, OTRO, RESALE (Manuales) */}
                  {(concept.type === "IMPRESION" || concept.type === "PRODUCTO" || concept.type === "OTRO" || concept.type === "RESALE") && (
                    <div className={`${concept.type === "RESALE" ? "sm:col-span-1" : "sm:col-span-2"}`}>
                      <label className="block text-xs font-medium text-gray-700">Precio Unitario Venta ($)</label>
                      <input
                        type="number"
                        value={concept.manualUnitPrice === 0 && String(concept.manualUnitPrice) !== "0" ? "" : concept.manualUnitPrice}
                        onChange={e => updateConcept(concept.id, "manualUnitPrice", e.target.value === "" ? "" : Number(e.target.value))}
                        className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border font-bold text-emerald-700"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {concept.type === "RESALE" && (
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-700">Costo Unitario Compra ($)</label>
                      <input
                        type="number"
                        value={concept.manualUnitCost === 0 && String(concept.manualUnitCost) !== "0" ? "" : concept.manualUnitCost}
                        onChange={e => updateConcept(concept.id, "manualUnitCost", e.target.value === "" ? "" : Number(e.target.value))}
                        className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md py-1.5 px-2 border font-bold text-red-600 bg-red-50"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-4 mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => calculateConceptTotals(concept)}
                      className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 py-1 px-3 rounded hover:bg-blue-100"
                    >
                      <Calculator className="w-3 h-3 mr-1" />
                      Calcular Fila
                    </button>
                  </div>

                  {/* Resultados del cálculo de la fila */}
                  {concept.calculated && (
                    <div className="sm:col-span-4 bg-white p-3 rounded border border-gray-200 mt-2 text-sm grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Costo Real Total</p>
                        <p className="font-medium text-gray-900">${concept.calculated.realCost}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Precio Sugerido Total</p>
                        <p className="font-medium text-gray-900">${concept.calculated.suggestedPrice}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Precio Final Unitario</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={concept.finalUnitPrice || concept.calculated.finalUnitPrice}
                          onChange={e => {
                            updateConcept(concept.id, "finalUnitPrice", e.target.value);
                            // Recalcular total amount basado en el nuevo precio final unitario
                            const newTotal = Number(e.target.value) * concept.quantity;
                            const calc = {...concept.calculated, totalAmount: newTotal};
                            updateConcept(concept.id, "calculated", calc);
                          }}
                          className="mt-1 block w-full text-sm border-gray-300 rounded py-1 px-2 border text-blue-700 font-bold bg-blue-50"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Importe Final</p>
                        <p className="font-bold text-gray-900 text-lg">${concept.calculated.totalAmount}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {concepts.length > 0 && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={calculateAll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Calculator className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Recalcular Todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Totales y Guardar */}
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

            <div className="mt-12 flex justify-end">
              <SubmitButton
                loadingText="Guardando Cotización..."
                className="py-4 px-12 text-sm font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-900/20 bg-red-600 hover:bg-red-700 transition-all active:scale-95"
              >
                <Save className="mr-2 h-5 w-5" />
                Guardar Cotización
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
