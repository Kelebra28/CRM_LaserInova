import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import ClientActions from "@/components/clients/ClientActions";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nuevo Cliente
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Buscar por nombre, empresa o RFC..."
            />
          </div>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {clients.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              No hay clientes registrados.
            </li>
          ) : (
            clients.map((client) => (
              <li key={client.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-600 truncate">
                        {client.name}
                      </p>
                      <p className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="truncate">{client.company || "Sin empresa"}</span>
                      </p>
                    </div>
                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                      <div className="flex space-x-2 text-sm text-gray-500">
                        {client.email && <span>{client.email}</span>}
                        {client.email && client.phone && <span>&bull;</span>}
                        {client.phone && <span>{client.phone}</span>}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <ClientActions clientId={client.id} clientName={client.name} />
                    </div>
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
