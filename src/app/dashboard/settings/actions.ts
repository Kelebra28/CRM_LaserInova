"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCostConfigurations(formData: FormData) {
  const entries = Array.from(formData.entries());
  
  // Exclude hidden fields or next.js internals if any, though standard formData doesn't have them
  const configEntries = entries.filter(([key]) => key !== "submit");

  for (const [key, value] of configEntries) {
    if (!value) continue;
    
    const parsedValue = parseFloat(value as string);
    if (isNaN(parsedValue)) continue;

    // We assume the name of the config is a human readable version of the key
    const name = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    await prisma.costConfiguration.upsert({
      where: { key },
      update: { value: parsedValue },
      create: {
        key,
        name,
        value: parsedValue,
      },
    });
  }

  revalidatePath("/dashboard/settings");
}
