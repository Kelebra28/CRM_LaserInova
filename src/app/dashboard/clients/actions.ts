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
