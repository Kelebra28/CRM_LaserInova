"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

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
      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-600">
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          {quote.folio}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        {quote.client?.name || "Sin cliente"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
        {quote.project}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
        ${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-full ${statusColors[quote.status]}`}>
          {statusLabels[quote.status]}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
        {new Date(quote.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end text-gray-300 group-hover:text-red-600 transition-colors">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </td>
    </tr>
  );
}
