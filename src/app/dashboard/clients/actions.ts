"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClient(formData: FormData) {
  const name = formData.get("name") as String;
  const company = formData.get("company") as String;
  const email = formData.get("email") as String;
  const phone = formData.get("phone") as String;
  const rfc = formData.get("rfc") as String;
  const address = formData.get("address") as String;
  const notes = formData.get("notes") as String;

  if (!name) {
    throw new Error("El nombre es requerido");
  }

  await prisma.client.create({
    data: {
      name: name.toString(),
      company: company?.toString() || null,
      email: email?.toString() || null,
      phone: phone?.toString() || null,
      rfc: rfc?.toString() || null,
      address: address?.toString() || null,
      notes: notes?.toString() || null,
    },
  });

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export async function updateClient(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const rfc = formData.get("rfc") as string;
  const address = formData.get("address") as string;
  const notes = formData.get("notes") as string;

  if (!name) {
    throw new Error("El nombre es requerido");
  }

  await prisma.client.update({
    where: { id },
    data: {
      name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      rfc: rfc || null,
      address: address || null,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}/edit`);
  redirect("/dashboard/clients");
}

export async function deleteClient(id: string) {
  // Verificar si tiene cotizaciones
  const quotesCount = await prisma.quote.count({
    where: { clientId: id },
  });

  if (quotesCount > 0) {
    // Borrado lógico si tiene historial
    await prisma.client.update({
      where: { id },
      data: { active: false },
    });
  } else {
    // Borrado físico si no tiene nada asociado
    await prisma.client.delete({
      where: { id },
    });
  }

  revalidatePath("/dashboard/clients");
}
