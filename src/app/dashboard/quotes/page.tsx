import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, LayoutGrid } from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import QuoteRow from "@/components/quotes/QuoteRow";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CALCULATED: "bg-blue-100 text-blue-800",
  SENT: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  IN_PRODUCTION: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-gray-200 text-gray-600",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  CALCULATED: "Calculada",
  SENT: "Enviada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  IN_PRODUCTION: "En Producción",
  DELIVERED: "Entregada",
  CANCELLED: "Cancelada",
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const quotes = await prisma.quote.findMany({
    where: {
      ...(search ? {
        OR: [
          { folio: { contains: search } },
          { client: { name: { contains: search } } },
          { client: { company: { contains: search } } },
          { project: { contains: search } },
        ]
      } : {}),
    },
    include: {
      client: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-red-600" />
            COTIZACIONES
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Gestión de presupuestos y seguimiento de proyectos
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/quotes/quick"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-200 shadow-sm text-[10px] font-black uppercase tracking-widest rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-all active:scale-95"
          >
            <FileText className="-ml-1 mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />
            Cotización Libre
          </Link>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/20 text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
            Nueva Cotización
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="px-6 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="w-full max-w-md">
            <SearchInput placeholder="Buscar por folio, cliente o proyecto..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Proyecto</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No hay cotizaciones registradas</p>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <QuoteRow 
                    key={quote.id} 
                    quote={quote} 
                    statusColors={statusColors} 
                    statusLabels={statusLabels} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
