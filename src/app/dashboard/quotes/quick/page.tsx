"use client";

import { useState } from "react";
import { FileText, Plus, Trash2, Download, RefreshCw, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { saveQuickQuoteAction } from "@/app/dashboard/quotes/actions";
import { useRouter } from "next/navigation";

export default function QuickQuotePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [folio, setFolio] = useState(`LI-${new Date().getFullYear()}-ESP-${Math.floor(Math.random() * 1000)}`);
  
  const [concepts, setConcepts] = useState([
    { id: crypto.randomUUID(), description: "Activación especial / Evento", quantity: 1 as number | string, unitPrice: 0 as number | string }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addConcept = () => {
    setConcepts([...concepts, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeConcept = (id: string) => {
    setConcepts(concepts.filter(c => c.id !== id));
  };

  const updateConcept = (id: string, field: string, value: any) => {
    setConcepts(concepts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const subtotal = concepts.reduce((sum, c) => sum + ((Number(c.quantity) || 0) * (Number(c.unitPrice) || 0)), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleDownload = async () => {
    setIsGenerating(true);
    
    // Construir el objeto falso (mock) que espera el generador de PDF
    const mockQuote = {
      folio,
      createdAt: new Date(),
      client: { name: clientName, company },
      project,
      description,
      subtotal,
      tax,
      total,
      concepts: concepts.map(c => ({
        description: c.description,
        quantity: c.quantity,
        details: "Servicio especial (Cotización Libre)",
        finalUnitPrice: c.unitPrice,
        totalAmount: (Number(c.quantity) || 0) * (Number(c.unitPrice) || 0),
        conceptType: "OTRO"
      }))
    };

    try {
      const response = await fetch('/api/quotes/quick/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockQuote)
      });
      
      if (!response.ok) throw new Error("Error generating PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cotizacion_Especial_${folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!(session?.user as any)?.id) {
      alert("Debes estar logueado para guardar.");
      return;
    }
    
    setIsSaving(true);
    
    const mockQuote = {
      client: { name: clientName, company },
      project,
      description,
      subtotal,
      tax,
      total,
      concepts: concepts.map(c => ({
        description: c.description,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        totalAmount: (Number(c.quantity) || 0) * (Number(c.unitPrice) || 0)
      }))
    };

    try {
      const result = await saveQuickQuoteAction(mockQuote, (session.user as any).id);
      if (result.success) {
        alert("Cotización guardada con éxito!");
        router.push(`/dashboard/quotes/${result.quoteId}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error al guardar la cotización.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-red-600" />
          COTIZACIÓN LIBRE / ESPECIAL
        </h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
          Generador rápido de PDF sin registro en base de datos
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
        
        {/* Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre del Cliente / Empresa</label>
            <input 
              type="text" 
              value={clientName} 
              onChange={e => setClientName(e.target.value)}
              placeholder="Ej. Juan Pérez / Empresa S.A." 
              className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre del Proyecto / Evento</label>
            <input 
              type="text" 
              value={project} 
              onChange={e => setProject(e.target.value)}
              placeholder="Ej. Activación 10 días en Expo" 
              className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
            />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descripción General (Opcional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalles generales que aparecerán en el encabezado del PDF..." 
              className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
              rows={2}
            />
          </div>
        </div>

        {/* Conceptos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Conceptos a Cobrar</h3>
            <button 
              onClick={addConcept}
              className="flex items-center gap-1 text-[10px] font-black text-red-600 uppercase tracking-widest hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg"
            >
              <Plus className="h-3 w-3" /> Agregar Fila
            </button>
          </div>

          <div className="space-y-4">
            {concepts.map((concept, idx) => (
              <div key={concept.id} className="relative p-4 md:p-5 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:border-red-100 hover:bg-white">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-6">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Descripción del Concepto</label>
                    <input 
                      type="text" 
                      value={concept.description} 
                      onChange={e => updateConcept(concept.id, 'description', e.target.value)}
                      placeholder="Ej. Servicio de Corte Laser" 
                      className="w-full text-sm font-bold border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/10"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-1 md:col-span-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Cant.</label>
                      <input 
                        type="number" 
                        min="1"
                        value={concept.quantity === 0 && String(concept.quantity) !== "0" ? "" : concept.quantity} 
                        onChange={e => updateConcept(concept.id, 'quantity', e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full text-sm font-bold border-gray-200 rounded-xl px-4 py-2.5 bg-white text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Precio U.</label>
                      <input 
                        type="number" 
                        value={concept.unitPrice === 0 && String(concept.unitPrice) !== "0" ? "" : concept.unitPrice} 
                        onChange={e => updateConcept(concept.id, 'unitPrice', e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full text-sm font-black border-gray-200 rounded-xl px-4 py-2.5 bg-white text-red-600"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-3 text-right">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-right">Subtotal</label>
                    <div className="text-base font-black text-gray-900 px-2 py-2">
                      ${((Number(concept.quantity) || 0) * (Number(concept.unitPrice) || 0)).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    {concepts.length > 1 && (
                      <button 
                        onClick={() => removeConcept(concept.id)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="flex flex-col items-end border-t border-gray-100 pt-6">
          <div className="w-full md:w-64 space-y-3">
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>IVA (16%)</span>
              <span>${tax.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-gray-100">
              <span>Total</span>
              <span>${total.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={isSaving || isGenerating || concepts.length === 0 || subtotal === 0 || !clientName || !project}
            className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSaving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {isSaving ? "Guardando..." : "Guardar en Sistema"}
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isGenerating || isSaving || concepts.length === 0 || subtotal === 0}
            className="flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isGenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            {isGenerating ? "Generando PDF..." : "Descargar PDF"}
          </button>
        </div>

      </div>
    </div>
  );
}
