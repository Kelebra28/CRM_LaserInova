import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Users, Mail, Phone, Briefcase, ChevronRight } from "lucide-react";
import ClientActions from "@/components/clients/ClientActions";
import SearchInput from "@/components/ui/SearchInput";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const clients = await prisma.client.findMany({
    where: {
      active: true,
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { company: { contains: search } },
          { rfc: { contains: search } },
          { email: { contains: search } },
        ]
      } : {}),
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-red-600" />
            CLIENTES
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Directorio de clientes y prospectos de Laser Inova
          </p>
        </div>
        
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/20 text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 relative">
        <div className="px-6 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="w-full max-w-md">
            <SearchInput placeholder="Buscar por nombre, empresa o RFC..." />
          </div>
        </div>

        <ul role="list" className="divide-y divide-gray-50">
          {clients.length === 0 ? (
            <li className="px-6 py-20 text-center">
              <Users className="h-8 w-8 text-gray-200 mx-auto mb-3" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No se encontraron clientes</p>
            </li>
          ) : (
            clients.map((client) => (
              <li key={client.id} className="group hover:bg-gray-50/50 transition-colors">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 font-black text-lg shrink-0 border border-red-100 group-hover:scale-105 transition-transform">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-gray-900 group-hover:text-red-600 transition-colors">
                          {client.name}
                        </p>
                        {client.company && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            <Briefcase className="h-3 w-3" />
                            {client.company}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ClientActions clientId={client.id} clientName={client.name} />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
