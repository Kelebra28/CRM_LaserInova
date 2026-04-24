"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProcessAction(data: {
  machineName: string;
  material: string;
  engravePower?: number;
  engraveSpeed?: number;
  engraveFrequency?: number;
  waveType?: string;
  cutPower?: number;
  cutSpeed?: number;
  notes?: string;
}) {
  await prisma.machineProcess.create({
    data: {
      machineName: data.machineName,
      material: data.material,
      engravePower: data.engravePower || null,
      engraveSpeed: data.engraveSpeed || null,
      engraveFrequency: data.engraveFrequency || null,
      waveType: data.waveType || null,
      cutPower: data.cutPower || null,
      cutSpeed: data.cutSpeed || null,
      notes: data.notes || null,
    }
  });

  revalidatePath("/dashboard/processes");
}

export async function updateProcessAction(id: string, data: {
  material?: string;
  engravePower?: number;
  engraveSpeed?: number;
  engraveFrequency?: number;
  waveType?: string;
  cutPower?: number;
  cutSpeed?: number;
  notes?: string;
}) {
  // Solo actualiza los campos proporcionados
  await prisma.machineProcess.update({
    where: { id },
    data: {
      material: data.material,
      engravePower: data.engravePower,
      engraveSpeed: data.engraveSpeed,
      engraveFrequency: data.engraveFrequency,
      waveType: data.waveType,
      cutPower: data.cutPower,
      cutSpeed: data.cutSpeed,
      notes: data.notes,
    }
  });

  revalidatePath("/dashboard/processes");
}

export async function deleteProcessAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.machineProcess.delete({
    where: { id }
  });

  revalidatePath("/dashboard/processes");
}
