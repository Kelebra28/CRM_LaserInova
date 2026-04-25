"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createQuoteAction(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const project = formData.get("project") as string;
  const description = formData.get("description") as string;
  const userId = formData.get("userId") as string;
  
  const subtotal = parseFloat(formData.get("subtotal") as string) || 0;
  const tax = parseFloat(formData.get("iva") as string) || 0;
  const total = parseFloat(formData.get("total") as string) || 0;
  const realCostTotal = parseFloat(formData.get("realCostTotal") as string) || 0;
  const estimatedUtility = parseFloat(formData.get("estimatedUtility") as string) || 0;

  const conceptsDataStr = formData.get("conceptsData") as string;
  const globalCostsSnapshotStr = formData.get("globalCostsSnapshot") as string;

  const visibleConsiderations = formData.get("visibleConsiderations") as string;

  if (!project || !conceptsDataStr) {
    throw new Error("Faltan datos requeridos (Proyecto y Conceptos)");
  }

  const conceptsData = JSON.parse(conceptsDataStr);
  
  // Generar folio (ej: LI-2026-0001)
  const count = await prisma.quote.count();
  const year = new Date().getFullYear();
  const folioNumber = String(count + 1).padStart(4, '0');
  const folio = `LI-${year}-${folioNumber}`;

  const quote = await prisma.quote.create({
    data: {
      folio,
      clientId: clientId || null,
      userId,
      project,
      description,
      visibleConsiderations,
      status: "CALCULATED",
      subtotal,
      tax,
      total,
      realCostTotal,
      estimatedUtility,
      concepts: {
        create: conceptsData.map((c: any, index: number) => ({
          conceptType: c.type,
          description: c.description || `Concepto ${index + 1}`,
          quantity: Number(c.quantity) || 1,
          ...(c.materialId ? { material: { connect: { id: c.materialId } } } : {}),
          clientProvidesMaterial: Boolean(c.clientProvidesMaterial),
          width: Number(c.partWidth) || null,
          height: Number(c.partHeight) || null,
          cutTime: Number(c.timeMin) || null,
          engraveTime: null,
          finalUnitPrice: Number(c.finalUnitPrice || c.calculated?.finalUnitPrice || 0),
          totalAmount: Number(c.calculated?.totalAmount || 0),
          realCost: Number(c.calculated?.realCost || 0),
          suggestedPrice: Number(c.calculated?.suggestedPrice || 0),
          materialCost: Number(c.calculated?.materialCost || 0),
          productionCost: Number(c.calculated?.productionCost || 0),
          order: index,
        })),
      },
      snapshot: {
        create: {
          globalValues: JSON.parse(globalCostsSnapshotStr || "{}"),
          factors: {}, // Aquí se guardarían los custom margins de cada concepto
        }
      }
    },
  });

  revalidatePath("/dashboard/quotes");
  redirect(`/dashboard/quotes/${quote.id}`);
}

export async function updateQuoteAction(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  const clientId = formData.get("clientId") as string || null;
  const userId = formData.get("userId") as string;
  const project = formData.get("project") as string;
  const description = formData.get("description") as string;
  const subtotal = parseFloat(formData.get("subtotal") as string);
  const tax = parseFloat(formData.get("tax") as string);
  const total = parseFloat(formData.get("total") as string);
  const realCostTotal = parseFloat(formData.get("realCostTotal") as string);
  const estimatedUtility = parseFloat(formData.get("estimatedUtility") as string);
  
  const conceptsData = JSON.parse(formData.get("concepts") as string);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      clientId,
      userId,
      project,
      description,
      subtotal,
      tax,
      total,
      realCostTotal,
      estimatedUtility,
      concepts: {
        deleteMany: {},
        create: conceptsData.map((c: any, index: number) => ({
          conceptType: c.type,
          description: c.description || `Concepto ${index + 1}`,
          quantity: Number(c.quantity) || 1,
          ...(c.materialId ? { material: { connect: { id: c.materialId } } } : {}),
          clientProvidesMaterial: Boolean(c.clientProvidesMaterial),
          width: Number(c.partWidth) || null,
          height: Number(c.partHeight) || null,
          cutTime: Number(c.timeMin) || null,
          engraveTime: null,
          finalUnitPrice: Number(c.finalUnitPrice || c.calculated?.finalUnitPrice || 0),
          totalAmount: Number(c.totalAmount || c.calculated?.totalAmount || 0),
          realCost: Number(c.realCost || c.calculated?.realCost || 0),
          suggestedPrice: Number(c.suggestedPrice || c.calculated?.suggestedPrice || 0),
          materialCost: Number(c.materialCost || c.calculated?.materialCost || 0),
          productionCost: Number(c.productionCost || c.calculated?.productionCost || 0),
          order: index,
        })),
      }
    }
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  redirect(`/dashboard/quotes/${quoteId}`);
}

export async function updateQuoteStatusAction(quoteId: string, newStatus: string) {
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: newStatus }
  });
  
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

export async function updateQuotePaymentAction(quoteId: string, type: 'unpaid' | 'partial' | 'paid') {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { total: true }
  });

  if (!quote) return;

  let data: any = {};
  if (type === 'unpaid') {
    data = { paymentStatus: 'PENDING', realAmountCollected: 0 };
  } else if (type === 'paid') {
    data = { paymentStatus: 'PAID', realAmountCollected: quote.total };
  } else if (type === 'partial') {
    // Si viene de estar pagada, le ponemos un 50% por defecto para que no desaparezca
    const currentQuote = await prisma.quote.findUnique({ where: { id: quoteId } });
    const isCurrentlyPaid = currentQuote && (currentQuote.realAmountCollected || 0) >= (currentQuote.total - 0.01);
    const isCurrentlyUnpaid = currentQuote && (currentQuote.realAmountCollected || 0) === 0;
    
    data = { 
      paymentStatus: 'PARTIAL',
      realAmountCollected: isCurrentlyPaid ? (quote.total / 2) : (isCurrentlyUnpaid ? (quote.total / 2) : undefined)
    };
  }


  await prisma.quote.update({
    where: { id: quoteId },
    data
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

export async function saveQuickQuoteAction(mockQuote: any, userId: string) {
  // 1. Manejar cliente
  let finalClientId = null;
  if (mockQuote.client.name) {
    const existingClient = await prisma.client.findFirst({
      where: { name: mockQuote.client.name }
    });

    if (existingClient) {
      finalClientId = existingClient.id;
    } else {
      const newClient = await prisma.client.create({
        data: {
          name: mockQuote.client.name,
          company: mockQuote.client.company || null,
        }
      });
      finalClientId = newClient.id;
    }
  }

  const count = await prisma.quote.count();
  const year = new Date().getFullYear();
  const folioNumber = String(count + 1).padStart(4, '0');
  const folio = `LI-${year}-${folioNumber}`;

  const quote = await prisma.quote.create({
    data: {
      folio,
      clientId: finalClientId,
      userId,
      project: mockQuote.project || "Cotización Libre",
      description: mockQuote.description,
      status: "APPROVED",
      subtotal: mockQuote.subtotal,
      tax: mockQuote.tax,
      total: mockQuote.total,
      realCostTotal: mockQuote.concepts.reduce((sum: number, c: any) => {
        const price = (Number(c.quantity) || 0) * (Number(c.unitPrice) || 0);
        const margin = (Number(c.margin) || 0) / 100;
        const cost = price * (1 - margin);
        return sum + cost;
      }, 0),
      estimatedUtility: mockQuote.concepts.reduce((sum: number, c: any) => {
        const price = (Number(c.quantity) || 0) * (Number(c.unitPrice) || 0);
        const margin = (Number(c.margin) || 0) / 100;
        return sum + (price * margin);
      }, 0),
      concepts: {
        create: mockQuote.concepts.map((c: any, index: number) => ({
          conceptType: "OTRO",
          description: c.description || `Concepto Libre ${index + 1}`,
          quantity: Number(c.quantity) || 1,
          finalUnitPrice: Number(c.unitPrice) || 0,
          totalAmount: Number(c.totalAmount) || 0,
          margin: Number(c.margin) || 0,
          realCost: (Number(c.totalAmount) || 0) * (1 - (Number(c.margin) || 0) / 100),
          suggestedPrice: Number(c.totalAmount) || 0,
          order: index,
        })),
      },
      snapshot: {
        create: {
          globalValues: {},
          factors: {},
        }
      }
    },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/finance");
  
  return { success: true, quoteId: quote.id };
}


