import { prisma } from "@/lib/prisma";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt,
  Trash2,
  Wallet,
  CheckCircle,
  Package
} from "lucide-react";
import ExpenseForm from "@/components/finance/ExpenseForm";
import { deleteExpense } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import PaymentBoard from "@/components/finance/PaymentBoard";

export default async function FinancePage() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);

  // Fetch all relevant quotes for the month
  const quotesThisMonth = await prisma.quote.findMany({
    where: {
      updatedAt: { gte: startDate, lte: endDate },
    }
  });

  // 1. Ingresos Reales (Monto cobrado neto en el mes)
  const quotesPaid = quotesThisMonth.filter(q => (q.realAmountCollected || 0) > 0 || ["PAID", "PARTIAL"].includes(q.paymentStatus));

  // Cuentas por Cobrar (GLOBAL - Todas las que tengan saldo pendiente)
  const allPendingQuotes = await prisma.quote.findMany({
    where: {
      active: true,
      status: { notIn: ["CANCELLED", "REJECTED", "DRAFT"] }, // Solo ventas reales o aprobadas
    },
    include: {
      client: true
    }
  });

  const pendingPayments = allPendingQuotes.filter(q => {
    const total = q.total || 0;
    const collected = q.realAmountCollected || 0;
    const hasBalance = (total - collected) > 0.01;
    const isExplicitlyPending = ["PENDING", "PARTIAL"].includes(q.paymentStatus);
    return hasBalance || isExplicitlyPending;
  });

  const totalCollectedGross = quotesPaid.reduce((sum, q) => sum + (q.realAmountCollected || 0), 0);
  
  // 1. Ingresos y Costos Proporcionales (CASH FLOW)
  // Calculamos cuánto de lo cobrado es ingreso neto y cuánto es costo proporcional
  let totalIncomeNet = 0;
  let totalProjectCosts = 0;

  quotesPaid.forEach(q => {
    const collected = q.realAmountCollected || 0;
    if (collected === 0) return;

    const total = q.total || 1;
    const subtotal = q.subtotal || 1;
    
    // Proporción de lo cobrado vs total
    const proportion = collected / total;
    
    // Ingreso neto cobrado (sin IVA)
    const netCollected = subtotal * proportion;
    totalIncomeNet += netCollected;

    // Costo proporcional a lo cobrado
    const proportionalCost = (q.realCostTotal || 0) * proportion;
    totalProjectCosts += proportionalCost;
  });

  const totalTaxCollected = totalCollectedGross - totalIncomeNet;

  // 2. Gastos Manuales (Salarios, Renta, etc.)
  const expenses = await prisma.expense.findMany({
    where: {
      active: true,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'desc' }
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncomeNet - totalExpenses - totalProjectCosts;
  const grossProfit = totalIncomeNet - totalProjectCosts;
  const profitMargin = totalIncomeNet > 0 ? (grossProfit / totalIncomeNet) * 100 : 0;
  const netMargin = totalIncomeNet > 0 ? (netProfit / totalIncomeNet) * 100 : 0;

  // Categorizar para el Tablero de Cobranza
  const unpaidQuotes = allPendingQuotes.filter(q => (q.realAmountCollected || 0) === 0);
  const partiallyPaidQuotes = allPendingQuotes.filter(q => (q.realAmountCollected || 0) > 0 && (q.total - (q.realAmountCollected || 0)) > 0.01);
  const fullyPaidQuotes = quotesThisMonth.filter(q => (q.total - (q.realAmountCollected || 0)) <= 0.01 && (q.realAmountCollected || 0) > 0);

  return (
    <div className="space-y-8 max-w-7xl pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Finanzas y Gastos</h1>
          <p className="text-sm text-gray-500 font-medium">Control de ingresos, egresos operativos y rentabilidad</p>
        </div>
        <ExpenseForm />
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cobrado Real</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${totalCollectedGross.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Total en Caja (C/IVA)</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos Netos</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${totalIncomeNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Cobrado sin IVA (Mes)</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-indigo-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IVA Recolectado</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${totalTaxCollected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Impuestos en Caja</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <TrendingDown className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gastos Fijos/Var</span>
          </div>
          <p className="text-2xl font-black text-gray-900">-${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Salarios, Renta, etc.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Costos Directos</span>
          </div>
          <p className="text-2xl font-black text-gray-900">-${totalProjectCosts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Materiales y Producción</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilidad Bruta</span>
          </div>
          <p className="text-2xl font-black text-gray-900">${(totalIncomeNet - totalProjectCosts).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Ganancia de Proyectos</p>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm ${netProfit >= 0 ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-white/10 text-emerald-400' : 'bg-white/20 text-white'}`}>
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Utilidad Neta Final</span>
          </div>
          <p className="text-2xl font-black">${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold text-white/40 uppercase mt-1">Balance después de Gastos Fijos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margen Bruto (Proyectos)</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{profitMargin.toFixed(1)}%</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Rentabilidad por Trabajo</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margen Neto Real</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{netMargin.toFixed(1)}%</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Después de Gastos Fijos</p>
        </div>
      </div>

      {/* Control de Cobranza Board */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500" />
          Control de Cobranza
        </h3>
        
        <PaymentBoard initialQuotes={allPendingQuotes} initialPaidQuotes={fullyPaidQuotes} />
      </div>

      {/* Expenses Detailed Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-red-500" />
            Detalle de Egresos (Gastos Operativos)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(expense.date).toLocaleDateString('es-MX')}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-gray-900">{expense.description}</div>
                    {expense.notes && <div className="text-[10px] text-gray-400 font-medium">{expense.notes}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase tracking-widest border border-gray-200">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-red-600 text-right font-mono">
                    -${expense.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={expense.id} />
                      <SubmitButton variant="danger" className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No hay gastos registrados este mes</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
