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

export async function deleteCategory(id: string) {
  // Verificar si tiene materiales
  const materialsCount = await prisma.material.count({
    where: { categoryId: id },
  });

  if (materialsCount > 0) {
    return { error: "No se puede eliminar una categoría que tiene materiales asociados. Mueve o elimina los materiales primero." };
  }

  await prisma.materialCategory.delete({
    where: { id },
  });

  revalidatePath("/dashboard/materials/categories");
}
