"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Constants ─────────────────────────────────────────────
export const TRANSACTION_TYPES = [
  { value: "GASTO_OPERATIVO", label: "Gasto Operativo", color: "red" },
  { value: "GASTO_PROYECTO",  label: "Gasto de Proyecto", color: "orange" },
  { value: "INGRESO",         label: "Ingreso", color: "emerald" },
  { value: "ANTICIPO",        label: "Anticipo", color: "blue" },
  { value: "LIQUIDACION",     label: "Liquidación", color: "teal" },
  { value: "AJUSTE",          label: "Ajuste Manual", color: "gray" },
];

export const EXPENSE_CATEGORIES = [
  "Materiales",
  "Mantenimiento",
  "Nómina / Salarios",
  "Viáticos",
  "Gasolina",
  "Paquetería / Envíos",
  "Herramientas",
  "Software / Suscripciones",
  "Internet / Telecomunicaciones",
  "Luz / Servicios",
  "Renta",
  "Marketing / Publicidad",
  "Impuestos / Contabilidad",
  "Otros",
];

export const INCOME_CATEGORIES = [
  "Anticipo de Proyecto",
  "Liquidación de Proyecto",
  "Pago Completo",
  "Devolución",
  "Ajuste / Nota de Crédito",
  "Otro Ingreso",
];

export const PAYMENT_METHODS = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta",       label: "Tarjeta" },
  { value: "deposito",      label: "Depósito" },
  { value: "otro",          label: "Otro" },
];

// ─── Create ────────────────────────────────────────────────
export async function createTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const type          = formData.get("type") as string;
  const category      = formData.get("category") as string;
  const amount        = parseFloat(formData.get("amount") as string);
  const taxAmount     = parseFloat(formData.get("taxAmount") as string) || 0;
  const description   = formData.get("description") as string;
  const notes         = formData.get("notes") as string | null;
  const dateStr       = formData.get("date") as string;
  const paymentMethod = formData.get("paymentMethod") as string | null;
  const provider      = formData.get("provider") as string | null;
  const quoteId       = formData.get("quoteId") as string | null;
  const clientId      = formData.get("clientId") as string | null;

  if (!type || !category || !amount || !description || !dateStr) {
    throw new Error("Faltan campos obligatorios");
  }

  const date = new Date(dateStr + "T12:00:00");

  await prisma.financialTransaction.create({
    data: {
      type,
      category,
      amount,
      taxAmount,
      description,
      notes:         notes || null,
      date,
      paymentMethod: paymentMethod || null,
      provider:      provider || null,
      quoteId:       quoteId || null,
      clientId:      clientId || null,
      createdById:   userId || null,
      status:        "ACTIVO",
    },
  });

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// ─── Update ────────────────────────────────────────────────
export async function updateTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const id            = formData.get("id") as string;
  const type          = formData.get("type") as string;
  const category      = formData.get("category") as string;
  const amount        = parseFloat(formData.get("amount") as string);
  const taxAmount     = parseFloat(formData.get("taxAmount") as string) || 0;
  const description   = formData.get("description") as string;
  const notes         = formData.get("notes") as string | null;
  const dateStr       = formData.get("date") as string;
  const paymentMethod = formData.get("paymentMethod") as string | null;
  const provider      = formData.get("provider") as string | null;
  const quoteId       = formData.get("quoteId") as string | null;
  const clientId      = formData.get("clientId") as string | null;

  if (!id) throw new Error("Falta ID del movimiento");

  const date = new Date(dateStr + "T12:00:00");

  await prisma.financialTransaction.update({
    where: { id },
    data: {
      type,
      category,
      amount,
      taxAmount,
      description,
      notes:         notes || null,
      date,
      paymentMethod: paymentMethod || null,
      provider:      provider || null,
      quoteId:       quoteId || null,
      clientId:      clientId || null,
      updatedById:   userId || null,
    },
  });

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// ─── Soft Delete ───────────────────────────────────────────
export async function softDeleteTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const id     = formData.get("id") as string;
  const reason = formData.get("reason") as string | null;

  if (!id) throw new Error("Falta ID del movimiento");

  await prisma.financialTransaction.update({
    where: { id },
    data: {
      isDeleted:    true,
      deletedAt:    new Date(),
      deletedById:  userId || null,
      deleteReason: reason || null,
      status:       "ANULADO",
    },
  });

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// ─── Restore (undo delete) ─────────────────────────────────
export async function restoreTransaction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) throw new Error("Falta ID del movimiento");

  await prisma.financialTransaction.update({
    where: { id },
    data: {
      isDeleted:    false,
      deletedAt:    null,
      deletedById:  null,
      deleteReason: null,
      status:       "ACTIVO",
    },
  });

  revalidatePath("/dashboard/finance");
}

// ─── Helpers ───────────────────────────────────────────────

/** KPIs financieros del periodo dado. Sólo incluye movimientos activos (no eliminados). */
export async function getFinancialKPIs(startDate: Date, endDate: Date) {
  const transactions = await prisma.financialTransaction.findMany({
    where: {
      isDeleted: false,
      date: { gte: startDate, lte: endDate },
    },
  });

  const sum = (type: string | string[]) =>
    transactions
      .filter(t => Array.isArray(type) ? type.includes(t.type) : t.type === type)
      .reduce((s, t) => s + t.amount, 0);

  const totalIncome        = sum(["INGRESO", "ANTICIPO", "LIQUIDACION"]);
  const totalOpExpenses    = sum("GASTO_OPERATIVO");
  const totalProjectCosts  = sum("GASTO_PROYECTO");
  const grossProfit        = totalIncome - totalProjectCosts;
  const netProfit          = grossProfit - totalOpExpenses;
  const totalTaxCollected  = transactions
    .filter(t => ["INGRESO", "ANTICIPO", "LIQUIDACION"].includes(t.type))
    .reduce((s, t) => s + t.taxAmount, 0);

  return {
    totalIncome,
    totalOpExpenses,
    totalProjectCosts,
    grossProfit,
    netProfit,
    totalTaxCollected,
    transactions,
  };
}
