"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMaterial(formData: FormData) {
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as string;
  const family = formData.get("family") as string;
  const color = formData.get("color") as string;
  const thickness = formData.get("thickness") ? parseFloat(formData.get("thickness") as string) : null;
  const length = formData.get("length") ? parseFloat(formData.get("length") as string) : null;
  const width = formData.get("width") ? parseFloat(formData.get("width") as string) : null;
  const sheetPrice = formData.get("sheetPrice") ? parseFloat(formData.get("sheetPrice") as string) : null;
  const guardPercentage = formData.get("guardPercentage") ? parseFloat(formData.get("guardPercentage") as string) : null;
  const productionPrice = formData.get("productionPrice") ? parseFloat(formData.get("productionPrice") as string) : null;
  const pricePerCm2 = formData.get("pricePerCm2") ? parseFloat(formData.get("pricePerCm2") as string) : null;
  const notes = formData.get("notes") as string;

  if (!name || !categoryId) {
    throw new Error("Nombre y categoría son requeridos");
  }

  await prisma.material.create({
    data: {
      categoryId,
      name,
      brand: brand || null,
      family: family || null,
      color: color || null,
      thickness,
      length,
      width,
      sheetPrice,
      guardPercentage,
      productionPrice,
      pricePerCm2,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard/materials");
  redirect("/dashboard/materials");
}

export async function deleteMaterial(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.material.delete({
    where: { id },
  });

  revalidatePath("/dashboard/materials");
}

export async function updateMaterial(formData: FormData) {
  const id = formData.get("id") as string;
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as string;
  const color = formData.get("color") as string;
  const length = formData.get("length") ? parseFloat(formData.get("length") as string) : null;
  const width = formData.get("width") ? parseFloat(formData.get("width") as string) : null;
  const thickness = formData.get("thickness") ? parseFloat(formData.get("thickness") as string) : null;
  const sheetPrice = formData.get("sheetPrice") ? parseFloat(formData.get("sheetPrice") as string) : null;
  
  if (!id || !name || !categoryId) return;

  // Si envían sheetPrice, tratar de recalcular pricePerCm2
  let pricePerCm2 = null;
  if (sheetPrice !== null && length && width && length > 0 && width > 0) {
    // Buscar factor de guarda actual o default
    const mat = await prisma.material.findUnique({ where: { id }});
    const guard = mat?.guardPercentage || 1.2;
    const productionPrice = sheetPrice * guard;
    const area = length * width;
    pricePerCm2 = productionPrice / area;
  }

  const updateData: any = {
    categoryId,
    name,
    brand: brand || null,
    color: color || null,
    length,
    width,
    thickness,
    sheetPrice,
  };

  if (pricePerCm2 !== null) {
    updateData.pricePerCm2 = pricePerCm2;
    const mat = await prisma.material.findUnique({ where: { id }});
    updateData.productionPrice = (sheetPrice || 0) * (mat?.guardPercentage || 1.2);
  }

  await prisma.material.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/dashboard/materials");
}
