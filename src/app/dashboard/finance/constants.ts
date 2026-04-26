// Constantes del módulo financiero
// Separadas de actions.ts para poder ser importadas por Client Components

export const TRANSACTION_TYPES = [
  { value: "GASTO_OPERATIVO", label: "Gasto Operativo",   color: "red"     },
  { value: "GASTO_PROYECTO",  label: "Gasto de Proyecto", color: "orange"  },
  { value: "INGRESO",         label: "Ingreso",           color: "emerald" },
  { value: "ANTICIPO",        label: "Anticipo",          color: "blue"    },
  { value: "LIQUIDACION",     label: "Liquidación",       color: "teal"    },
  { value: "AJUSTE",          label: "Ajuste Manual",     color: "gray"    },
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
  { value: "efectivo",      label: "Efectivo"       },
  { value: "transferencia", label: "Transferencia"  },
  { value: "tarjeta",       label: "Tarjeta"        },
  { value: "deposito",      label: "Depósito"       },
  { value: "otro",          label: "Otro"           },
];
