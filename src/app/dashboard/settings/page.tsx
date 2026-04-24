import { prisma } from "@/lib/prisma";
import { updateCostConfigurations } from "./actions";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Save } from "lucide-react";

const DEFAULT_CONFIGS = [
  { key: "costo_minuto_mayoreo", name: "Costo por minuto (Mayoreo)", default: 8.5, unit: "$" },
  { key: "costo_minuto_menudeo", name: "Costo por minuto (Menudeo)", default: 10, unit: "$" },
  { key: "precio_tubo", name: "Precio del Tubo/Láser", default: 250000, unit: "$" },
  { key: "vida_util_tubo", name: "Vida útil Tubo (Horas)", default: 6000, unit: "hrs" },
  { key: "factor_miedo", name: "Factor de Miedo", default: 2, unit: "x" },
  { key: "factor_produccion_default", name: "Factor de Producción (Gral)", default: 3, unit: "x" },
  { key: "porcentaje_iva", name: "Porcentaje de IVA", default: 16, unit: "%" },
  { key: "factor_guarda_default", name: "Factor de Guarda Global (Merma)", default: 1.5, unit: "x" },
  { key: "margen_default", name: "Margen de Ganancia Global", default: 50, unit: "%" },
  { key: "dias_laborables_mes", name: "Días Laborables al Mes", default: 22, unit: "días" },
  { key: "horas_maquina_dia", name: "Horas Máquina al Día", default: 8, unit: "horas" },
];


export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const savedConfigs = await prisma.costConfiguration.findMany();
  const configMap = new Map(savedConfigs.map((c) => [c.key, c.value]));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Costos y Sistema</h1>
      </div>

      <form action={updateCostConfigurations} className="bg-white shadow-sm border border-gray-100 rounded-lg p-6 space-y-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Costos Operativos Base</h3>
            <p className="mt-1 text-sm text-gray-500">
              Estos valores se usarán como predeterminados en la calculadora de cotizaciones. Solo el administrador puede modificarlos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_CONFIGS.map((config) => {
              const value = configMap.has(config.key) ? configMap.get(config.key) : config.default;
              return (
                <div key={config.key}>
                  <label htmlFor={config.key} className="block text-sm font-medium text-gray-700">
                    {config.name}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step="0.01"
                      name={config.key}
                      id={config.key}
                      defaultValue={value}
                      className="focus:ring-red-500 focus:border-red-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900 font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{config.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Save className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
