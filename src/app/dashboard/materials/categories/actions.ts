"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  if (!name) {
    throw new Error("El nombre de la categoría es requerido");
  }

  await prisma.materialCategory.create({
    data: {
      name,
      slug,
    },
  });

  revalidatePath("/dashboard/materials/categories");
  redirect("/dashboard/materials/categories");
}
