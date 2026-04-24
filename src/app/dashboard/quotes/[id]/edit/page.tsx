import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditQuoteForm from "@/components/quotes/EditQuoteForm";

export default async function EditQuotePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const quoteId = params.id;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      concepts: {
        include: { material: true }
      }
    }
  });

  if (!quote) {
    notFound();
  }

  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { name: "asc" }
  });

  const materials = await prisma.material.findMany({
    where: { active: true },
    orderBy: { name: "asc" }
  });

  const globalCosts = await prisma.costConfiguration.findMany({
    where: { active: true }
  });

  const globalCostsObj: Record<string, number> = {};
  globalCosts.forEach(c => {
    globalCostsObj[c.key] = c.value;
  });

  const safeGlobals = {
    costo_minuto_mayoreo: globalCostsObj["costo_minuto_mayoreo"] || 8.5,
    costo_minuto_menudeo: globalCostsObj["costo_minuto_menudeo"] || 10,
    porcentaje_iva: globalCostsObj["porcentaje_iva"] || 16,
    factor_guarda_default: globalCostsObj["factor_guarda_default"] || 1.2,
    margen_default: globalCostsObj["margen_default"] || 50,
    factor_produccion_default: globalCostsObj["factor_produccion_default"] || 3,
    precio_tubo: globalCostsObj["precio_tubo"] || 250000,
    vida_util_tubo: globalCostsObj["vida_util_tubo"] || 6000,
    factor_miedo: globalCostsObj["factor_miedo"] || 2,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Editar Cotización <span className="text-red-600">{quote.folio}</span></h1>
      </div>
      
      <EditQuoteForm 
        quote={quote} 
        clients={clients} 
        materials={materials} 
        globalCosts={safeGlobals} 
      />
    </div>
  );
}
