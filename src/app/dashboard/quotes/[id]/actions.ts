"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QuoteStatus } from "@/types/prisma";

export async function updateQuoteStatus(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  const status = formData.get("status") as QuoteStatus;

  if (!quoteId || !status) return;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
  });

  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath(`/dashboard/quotes`);
}
export async function updateQuoteConsiderations(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  const visibleConsiderations = formData.get("visibleConsiderations") as string;

  if (!quoteId) return;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { visibleConsiderations },
  });

  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

export async function updateQuotePayment(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  const realAmountCollected = parseFloat(formData.get("realAmountCollected") as string) || 0;
  const paymentStatus = formData.get("paymentStatus") as string;

  if (!quoteId) return;

  // Actualizar monto cobrado y estatus de pago
  // También calculamos la utilidad real si ya se cobró algo
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return;

  // Calcular la proporción de IVA en lo recolectado
  const taxPortion = quote.total > 0 ? (realAmountCollected * (quote.tax / quote.total)) : 0;
  const netCollected = realAmountCollected - taxPortion;
  const realUtilityTotal = netCollected - quote.realCostTotal;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { 
      realAmountCollected,
      paymentStatus,
      realUtilityTotal,
    },
  });


  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath(`/dashboard/`);
}

export async function deleteQuote(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  if (!quoteId) return;

  await prisma.quote.delete({
    where: { id: quoteId }
  });

  revalidatePath(`/dashboard/quotes`);
  redirect(`/dashboard/quotes`);
}
