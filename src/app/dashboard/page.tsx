import { prisma } from "@/lib/prisma";
import { DollarSign, FileText, CheckCircle, TrendingUp, Clock, Package, CheckSquare, AlertCircle, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import KanbanBoard from "@/components/dashboard/KanbanBoard";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);

  // Fetch all quotes for this month (Created or Updated)
  const quotesThisMonth = await prisma.quote.findMany({
    where: {
      active: true,
      OR: [
        { createdAt: { gte: startDate, lte: endDate } },
        { updatedAt: { gte: startDate, lte: endDate } }
      ]
    },
    include: {
      client: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Cuentas por Cobrar (GLOBAL)
  const allPendingQuotes = await prisma.quote.findMany({
    where: {
      active: true,
      paymentStatus: { in: ["PENDING", "PARTIAL"] },
      status: { notIn: ["CANCELLED", "REJECTED"] }
    }
  });

  const totalGlobalPending = allPendingQuotes.reduce((sum, q) => {
    const balance = q.total - (q.realAmountCollected || 0);
    return sum + (balance > 0 ? balance : 0);
  }, 0);


  const totalQuotes = quotesThisMonth.length;
  
  // Categorize for Task Board (Kanban)
  const columns = [
    { id: "DRAFT", label: "Borrador", colorClass: "bg-gray-500", dotClass: "bg-gray-500", shadowClass: "shadow-[0_0_8px_rgba(107,114,128,0.5)]" },
    { id: "SENT", label: "Enviada", colorClass: "bg-blue-500", dotClass: "bg-blue-500", shadowClass: "shadow-[0_0_8px_rgba(59,130,246,0.5)]" },
    { id: "APPROVED", label: "Aprobada", colorClass: "bg-purple-500", dotClass: "bg-purple-500", shadowClass: "shadow-[0_0_8px_rgba(168,85,247,0.5)]" },
    { id: "IN_PRODUCTION", label: "En Proceso", colorClass: "bg-orange-500", dotClass: "bg-orange-500", shadowClass: "shadow-[0_0_8px_rgba(249,115,22,0.5)]" },
    { id: "DELIVERED", label: "Entregada", colorClass: "bg-emerald-500", dotClass: "bg-emerald-500", shadowClass: "shadow-[0_0_8px_rgba(16,185,129,0.5)]" },
    { id: "CANCELLED", label: "Cancelada / Rechazada", colorClass: "bg-red-500", dotClass: "bg-red-500", shadowClass: "shadow-[0_0_8px_rgba(239,68,68,0.5)]" },
  ];

  const getQuotesByStatus = (statusId: string) => {
    if (statusId === "CANCELLED") {
      return quotesThisMonth.filter(q => q.status === "CANCELLED" || q.status === "REJECTED");
    }
    return quotesThisMonth.filter(q => q.status === statusId);
  };

  const activeQuotes = quotesThisMonth.filter(q => q.status !== "CANCELLED" && q.status !== "REJECTED");
  
  const salesWithAnticipo = activeQuotes.filter(q => 
    (q.realAmountCollected && q.realAmountCollected > 0) || 
    ["PARTIAL", "PAID"].includes(q.paymentStatus)
  );

  const totalAmountWithAnticipo = salesWithAnticipo.reduce((sum, q) => sum + q.total, 0);
  
  // Traer gastos manuales del mes para el Dashboard
  const expenses = await prisma.expense.findMany({
    where: {
      active: true,
      date: { gte: startDate, lte: endDate },
    }
  });

  const totalManualExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProjectCosts = activeQuotes.reduce((sum, q) => sum + (q.realCostTotal || 0), 0);
  
  // Gasto Operativo Total = Costos de proyectos + Gastos manuales
  const totalOperationCost = totalProjectCosts + totalManualExpenses;

  const totalTaxQuoted = activeQuotes.reduce((sum, q) => sum + q.tax, 0);
  const realCollected = quotesThisMonth.reduce((sum, q) => sum + (q.realAmountCollected || 0), 0);
  
  // Calcular IVA recolectado de forma proporcional
  const totalTaxCollected = quotesThisMonth.reduce((sum, q) => {
    const collected = q.realAmountCollected || 0;
    const taxPortion = q.total > 0 ? (collected * (q.tax / q.total)) : 0;
    return sum + taxPortion;
  }, 0);

  const totalCollectedNet = realCollected - totalTaxCollected;
  
  // Utilidad Real = Dinero que entró (sin IVA) - Costos de Proyectos - Gastos Manuales
  const totalUtilityReal = totalCollectedNet - totalProjectCosts - totalManualExpenses;

  const stats = [
    { 
      name: "Ventas Totales (C/IVA)", 
      value: `$${totalAmountWithAnticipo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      subValue: `Por cobrar: $${totalGlobalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    },
    { 
      name: "IVA por Pagar (Total)", 
      value: `$${totalTaxQuoted.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      subValue: `Cobrado: $${totalTaxCollected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    { 
      name: "Gastos Operativos", 
      value: `$${totalOperationCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      subValue: "Materiales + Gastos Fijos",
      icon: Package,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    { 
      name: "Utilidad Real (Neta)", 
      value: `$${totalUtilityReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      subValue: "Libre de Gastos e IVA",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
  ];


  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Panel de Control</h1>
          <p className="text-sm text-gray-500">Resumen operativo y financiero de Laser Inova</p>
        </div>
        <Link 
          href="/dashboard/quotes/new"
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
        >
          Nueva Cotización
        </Link>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.name}</p>
                <p className="text-lg font-black text-gray-900">{stat.value}</p>
                {stat.subValue && (
                  <p className="text-[9px] font-bold text-gray-400 mt-1">{stat.subValue}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board Section */}
      <KanbanBoard initialQuotes={quotesThisMonth} columns={columns} />
    </div>
  );
}
