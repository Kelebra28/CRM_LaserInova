"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string;
  const date = formData.get("date") ? new Date(formData.get("date") as string) : new Date();
  const notes = formData.get("notes") as string;

  if (!description || !amount || !category) {
    throw new Error("Faltan campos obligatorios");
  }

  await prisma.expense.create({
    data: {
      description,
      amount,
      category,
      date,
      notes,
    },
  });

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

export async function deleteExpense(formData: FormData) {
  const id = formData.get("id") as string;

  await prisma.expense.update({
    where: { id },
    data: { active: false },
  });

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}
