import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { updateCostConfigurations } from "./actions";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { UsersPanel } from "@/components/settings/UsersPanel";
import { Save, Settings2, User, Users, SlidersHorizontal } from "lucide-react";

const DEFAULT_CONFIGS = [
  { key: "costo_minuto_mayoreo",      name: "Costo por minuto (Mayoreo)",          default: 8.5,    unit: "$"    },
  { key: "costo_minuto_menudeo",      name: "Costo por minuto (Menudeo)",          default: 10,     unit: "$"    },
  { key: "precio_tubo",               name: "Precio del Tubo/Láser",               default: 250000, unit: "$"    },
  { key: "vida_util_tubo",            name: "Vida útil Tubo (Horas)",              default: 6000,   unit: "hrs"  },
  { key: "factor_miedo",              name: "Factor de Miedo",                     default: 2,      unit: "x"    },
  { key: "factor_produccion_default", name: "Factor de Producción (Gral)",         default: 3,      unit: "x"    },
  { key: "porcentaje_iva",            name: "Porcentaje de IVA",                   default: 16,     unit: "%"    },
  { key: "factor_guarda_default",     name: "Factor de Guarda Global (Merma)",     default: 1.5,    unit: "x"    },
  { key: "margen_default",            name: "Margen de Ganancia Global",           default: 50,     unit: "%"    },
  { key: "gastos_fijos_mensuales",    name: "Gastos Fijos Mensuales (Overhead)",   default: 3910,   unit: "$"    },
  { key: "dias_laborables_mes",       name: "Días Laborables al Mes",              default: 22,     unit: "días" },
  { key: "horas_maquina_dia",         name: "Horas Máquina al Día",               default: 8,      unit: "horas"},
];

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  if (!currentUser) redirect("/login");

  const isAdmin = currentUser.role === "ADMIN";
  if (!isAdmin) redirect("/dashboard");

  const [savedConfigs, users, me] = await Promise.all([
    prisma.costConfiguration.findMany(),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  const configMap = new Map(savedConfigs.map((c) => [c.key, c.value]));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-md">
          <Settings2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Configuración</h1>
          <p className="text-xs text-gray-400 mt-0.5">Sistema, usuarios y perfil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN: Profile + Users ───────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Profile card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="p-1.5 rounded-xl bg-red-50">
                <User className="w-4 h-4 text-red-600" />
              </div>
              <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Mi Perfil</h2>
            </div>
            <div className="p-5">
              {me ? (
                <ProfileForm user={me} />
              ) : (
                <p className="text-sm text-gray-400">No se pudo cargar el perfil.</p>
              )}
            </div>
          </div>

          {/* Users panel */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="p-1.5 rounded-xl bg-violet-50">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Equipo</h2>
            </div>
            <div className="p-5">
              <UsersPanel users={users} currentUserId={currentUser.id} />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Cost configs ─────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="p-1.5 rounded-xl bg-amber-50">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Costos Operativos</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Valores base para el cálculo de cotizaciones</p>
              </div>
            </div>

            <form action={updateCostConfigurations} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEFAULT_CONFIGS.map((config) => {
                  const value = configMap.has(config.key) ? configMap.get(config.key) : config.default;
                  return (
                    <div key={config.key} className="space-y-1.5">
                      <label
                        htmlFor={config.key}
                        className="block text-[11px] font-black text-gray-400 uppercase tracking-widest"
                      >
                        {config.name}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          name={config.key}
                          id={config.key}
                          defaultValue={value}
                          className="w-full px-4 py-2.5 pr-12 rounded-2xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all font-medium"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                          {config.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-black shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Guardar configuración
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
