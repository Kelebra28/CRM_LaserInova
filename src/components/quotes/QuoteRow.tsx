"use client";

import { useState } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface QuoteRowProps {
  quote: any;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

export default function QuoteRow({ quote, statusColors, statusLabels }: QuoteRowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNavigate = () => {
    setIsLoading(true);
    router.push(`/dashboard/quotes/${quote.id}`);
  };

  return (
    <tr
      onClick={handleNavigate}
      className={`hover:bg-gray-50 transition-colors cursor-pointer group ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Folio */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-600">
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          {quote.folio}
        </div>
      </td>

      {/* Cliente */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        {quote.client?.name || quote.prospectName || "Sin cliente"}
      </td>

      {/* Proyecto */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
        {quote.project}
      </td>

      {/* Total */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
        ${quote.total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* Estatus */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-full ${statusColors[quote.status]}`}>
          {statusLabels[quote.status]}
        </span>
      </td>

      {/* Fecha */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
        {new Date(quote.createdAt).toLocaleDateString("es-MX")}
      </td>

      {/* Creado por — Ahora con RI/RA y colores fijos */}
      <td className="px-6 py-4 whitespace-nowrap">
        {quote.user ? (
          <div className="flex items-center gap-2">
            <UserAvatar name={quote.user.name} size="xs" />
            <span className="text-xs font-bold text-gray-600 hidden sm:block">
              {quote.user.name.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-300 font-bold">—</span>
        )}
      </td>

      {/* Arrow */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end text-gray-300 group-hover:text-red-600 transition-colors">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </td>
    </tr>
  );
}
