import { prisma } from "@/lib/prisma";
import QuickQuoteForm from "@/components/quotes/QuickQuoteForm";

export default async function QuickQuotePage() {
  // Buscar el margen por defecto en la configuración
  const config = await prisma.costConfiguration.findUnique({
    where: { key: "margen_default" }
  });

  // Si no existe, usamos 50 como respaldo
  const defaultMargin = config ? config.value : 50;

  return <QuickQuoteForm defaultMargin={defaultMargin} />;
}
