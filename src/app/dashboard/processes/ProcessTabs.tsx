"use client";

import { useState } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { createProcessAction, deleteProcessAction } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

const MACHINES = [
  { id: "FIBRA", name: "Fibra Óptica" },
  { id: "CO2", name: "CO2" },
  { id: "UV", name: "UV" },
  { id: "XTOOL", name: "xTool" },
];

export default function ProcessTabs({ initialProcesses }: { initialProcesses: any[] }) {
  const [activeTab, setActiveTab] = useState("FIBRA");
  const [isAdding, setIsAdding] = useState(false);

  const filteredProcesses = initialProcesses.filter(p => p.machineName === activeTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-100 mb-6 overflow-x-auto">
        {MACHINES.map((machine) => (
          <button
            key={machine.id}
            onClick={() => {
              setActiveTab(machine.id);
              setIsAdding(false);
            }}
            className={`px-4 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
              activeTab === machine.id
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
            }`}
          >
            {machine.name}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
          Recetas de {MACHINES.find(m => m.id === activeTab)?.name}
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-sm"
        >
          {isAdding ? "Cancelar" : <><Plus className="h-4 w-4" /> Nueva Receta</>}
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <form action={async (formData) => {
            const data = {
              machineName: activeTab,
              material: formData.get("material") as string,
              engravePower: formData.get("engravePower") ? Number(formData.get("engravePower")) : undefined,
              engraveSpeed: formData.get("engraveSpeed") ? Number(formData.get("engraveSpeed")) : undefined,
              engraveFrequency: formData.get("engraveFrequency") ? Number(formData.get("engraveFrequency")) : undefined,
              waveType: formData.get("waveType") as string,
              cutPower: formData.get("cutPower") ? Number(formData.get("cutPower")) : undefined,
              cutSpeed: formData.get("cutSpeed") ? Number(formData.get("cutSpeed")) : undefined,
              notes: formData.get("notes") as string,
            };
            await createProcessAction(data);
            setIsAdding(false);
          }} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-full md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Material / Grosor</label>
                <input type="text" name="material" required placeholder="Ej: Acero Inox, Acrílico 3mm..." className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
              </div>

              {/* CO2 Fields */}
              {activeTab === "CO2" && (
                <>
                  <div className="col-span-full mt-2"><span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-1 rounded">Parámetros de Corte</span></div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vel. Corte (mm/s)</label>
                    <input type="number" step="0.1" name="cutSpeed" className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pot. Corte (%)</label>
                    <input type="number" step="0.1" name="cutPower" className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
                  </div>
                </>
              )}

              {/* Engrave Fields (All Machines) */}
              <div className="col-span-full mt-2"><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Parámetros de Grabado</span></div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Velocidad (mm/s)</label>
                <input type="number" step="0.1" name="engraveSpeed" required className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Potencia (%)</label>
                <input type="number" step="0.1" name="engravePower" required className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
              </div>

              {(activeTab === "FIBRA" || activeTab === "UV" || activeTab === "XTOOL") && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Frecuencia (kHz)</label>
                  <input type="number" step="0.1" name="engraveFrequency" className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
                </div>
              )}

              {(activeTab === "UV" || activeTab === "XTOOL") && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo de Onda</label>
                  <input type="text" name="waveType" className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
                </div>
              )}

              <div className="col-span-full">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notas / Observaciones</label>
                <input type="text" name="notes" className="w-full text-sm font-medium border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <SubmitButton className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-red-700">
                Guardar Receta
              </SubmitButton>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-l-xl">Material</th>
              {activeTab === "CO2" && (
                <th className="px-6 py-4 text-[10px] font-black text-red-400 uppercase tracking-widest">Corte (Vel / Pot)</th>
              )}
              <th className="px-6 py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest">Grabado (Vel / Pot)</th>
              {(activeTab === "FIBRA" || activeTab === "UV" || activeTab === "XTOOL") && (
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Frecuencia</th>
              )}
              {(activeTab === "UV" || activeTab === "XTOOL") && (
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Onda</th>
              )}
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-r-xl"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProcesses.map((process) => (
              <tr key={process.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-black text-gray-900">{process.material}</td>
                
                {activeTab === "CO2" && (
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-600 bg-red-50/50 px-2 py-1 rounded">
                      {process.cutSpeed || '-'} mm/s / {process.cutPower || '-'} %
                    </span>
                  </td>
                )}
                
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-gray-600 bg-blue-50/50 px-2 py-1 rounded">
                    {process.engraveSpeed || '-'} mm/s / {process.engravePower || '-'} %
                  </span>
                </td>
                
                {(activeTab === "FIBRA" || activeTab === "UV" || activeTab === "XTOOL") && (
                  <td className="px-6 py-4 text-xs font-bold text-gray-600">{process.engraveFrequency ? `${process.engraveFrequency} kHz` : '-'}</td>
                )}
                
                {(activeTab === "UV" || activeTab === "XTOOL") && (
                  <td className="px-6 py-4 text-xs font-bold text-gray-600">{process.waveType || '-'}</td>
                )}
                
                <td className="px-6 py-4 text-[11px] font-medium text-gray-500 max-w-xs truncate" title={process.notes}>
                  {process.notes || '-'}
                </td>
                
                <td className="px-6 py-4 text-right">
                  <form action={deleteProcessAction}>
                    <input type="hidden" name="id" value={process.id} />
                    <SubmitButton variant="danger" className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {filteredProcesses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <Settings2 className="h-6 w-6 text-gray-200 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No hay recetas configuradas para esta máquina</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
