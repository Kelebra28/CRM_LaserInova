// Tipos de cálculo soportados
export type CalculationType = "CORTE" | "GRABADO" | "IMPRESION" | "PRODUCTO" | "OTRO" | "RESALE";

export interface GlobalCosts {
  costo_minuto_mayoreo: number;
  costo_minuto_menudeo: number;
  precio_tubo: number;
  vida_util_tubo: number;
  factor_miedo: number;
  porcentaje_iva: number;
  factor_guarda_default: number;
  margen_default: number;
  factor_produccion_default: number;
  [key: string]: number;
}

export interface MaterialData {
  length?: number | null;
  width?: number | null;
  sheetPrice?: number | null;
  guardPercentage?: number | null;
  pricePerCm2?: number | null;
}

export interface CalculationInput {
  type: CalculationType;
  quantity: number;
  
  // Para CORTE, GRABADO
  material?: MaterialData;
  clientProvidesMaterial?: boolean;
  partWidth?: number;
  partHeight?: number;
  timeMin?: number;
  isWholesale?: boolean; // Mayoreo o menudeo
  
  // Para IMPRESION, PRODUCTO, OTRO, RESALE
  manualUnitPrice?: number;
  manualCost?: number;
}

export interface CalculationResult {
  materialBaseCost: number; // Costo sin merma
  materialWastageCost: number; // Solo el 50% de merma
  materialCost: number; // Total material (base + merma)
  productionCost: number; // Costo de máquina
  realCost: number; // Total (materialCost + productionCost)
  suggestedPrice: number;
}


export function calculateConcept(input: CalculationInput, globals: GlobalCosts): CalculationResult {
  let materialBaseCost = 0;
  let materialWastageCost = 0;
  let materialCost = 0;
  let productionCost = 0;
  let realCost = 0;
  let suggestedPrice = 0;

  // Parámetros para la nueva fórmula de máquina
  const tubePrice = globals.precio_tubo || 250000;
  const tubeLifeHours = globals.vida_util_tubo || 6000;
  const fearFactor = globals.factor_miedo || 2;
  const prodFactor = globals.factor_produccion_default || 3;

  // 1. Calcular costo de material si aplica (CORTE o GRABADO)
  if ((input.type === "CORTE" || input.type === "GRABADO") && input.material && input.partWidth && input.partHeight) {
    if (!input.clientProvidesMaterial) {
      let priceCm2 = input.material.pricePerCm2;
      
      // Si no tenemos precio por cm2 directo, calcularlo
      if (!priceCm2 && input.material.sheetPrice && input.material.length && input.material.width) {
        // El usuario solicitó 1.5 por la merma. Usamos el factor de guarda con un fallback de 1.5
        const guardFactor = input.material.guardPercentage || globals.factor_guarda_default || 1.5;
        const priceWithGuard = input.material.sheetPrice * guardFactor;
        const areaHoja = input.material.length * input.material.width;
        priceCm2 = priceWithGuard / areaHoja;
      }
      
      if (priceCm2) {
        const areaPieza = input.partWidth * input.partHeight;
        materialBaseCost = areaPieza * priceCm2;
        materialWastageCost = materialBaseCost * 0.5; // El 50% de merma solicitado
        materialCost = materialBaseCost + materialWastageCost;
      }
    }
  }

  // 2. Calcular según el tipo
  switch (input.type) {
    case "CORTE":
    case "GRABADO":
      const totalTime = input.timeMin || 0;

      // --- NUEVA FÓRMULA DE MÁQUINA ---
      // 1. Costo base por minuto (vida del tubo)
      // (Precio Tubo / Horas Vida) / 60 min
      const baseMinCost = (tubePrice / tubeLifeHours) / 60;
      
      // 2. Costo puro del corte para esta pieza
      const pureCutCost = totalTime * baseMinCost;
      
      // 3. Aplicar Factor de Miedo (duplicar) y Factor de Producción (triplicar)
      productionCost = pureCutCost * fearFactor * prodFactor;
      
      // Costo Real = Costo Material + Costo Producción (Operación)
      realCost = materialCost + productionCost; 
      
      // El usuario solicitó Precio Sugerido = Costo Total / (1 - Margen)
      const marginFactor = (100 - (globals.margen_default || 50)) / 100;
      suggestedPrice = realCost / marginFactor;
      break;

    case "RESALE":
      // Para reventa pura, el costo real es el costo manual ingresado
      realCost = input.manualCost || 0;
      suggestedPrice = input.manualUnitPrice || 0;
      break;

    case "IMPRESION":
    case "PRODUCTO":
    case "OTRO":
      realCost = 0; 
      // Para manuales, si hay un precio unitario manual, lo respetamos como sugerido
      suggestedPrice = input.manualUnitPrice || 0;
      break;

  }


  // Multiplicar por cantidad
  return {
    materialBaseCost: Number((materialBaseCost * input.quantity).toFixed(2)),
    materialWastageCost: Number((materialWastageCost * input.quantity).toFixed(2)),
    materialCost: Number((materialCost * input.quantity).toFixed(2)),
    productionCost: Number((productionCost * input.quantity).toFixed(2)),
    realCost: Number((realCost * input.quantity).toFixed(2)),
    suggestedPrice: Number((suggestedPrice * input.quantity).toFixed(2)),
  };
}


