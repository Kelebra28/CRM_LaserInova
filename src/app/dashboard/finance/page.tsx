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
  Package,
  Activity,
  BarChart3
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

  // Cuentas por Cobrar (GLOBAL)
  const allPendingQuotes = await prisma.quote.findMany({
    where: {
      active: true,
      status: { notIn: ["CANCELLED", "REJECTED", "DRAFT"] },
    },
    include: {
      client: true
    }
  });

  const totalCollectedGross = quotesPaid.reduce((sum, q) => sum + (q.realAmountCollected || 0), 0);
  
  let totalIncomeNet = 0;
  let totalProjectCosts = 0;

  quotesPaid.forEach(q => {
    const collected = q.realAmountCollected || 0;
    if (collected === 0) return;
    const total = q.total || 1;
    const subtotal = q.subtotal || 1;
    const proportion = collected / total;
    const netCollected = subtotal * proportion;
    totalIncomeNet += netCollected;
    const proportionalCost = (q.realCostTotal || 0) * proportion;
    totalProjectCosts += proportionalCost;
  });

  const totalTaxCollected = totalCollectedGross - totalIncomeNet;

  const expenses = await prisma.expense.findMany({
    where: {
      active: true,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'desc' }
  });

  const configs = await prisma.costConfiguration.findMany();
  const configMap = new Map(configs.map(c => [c.key, c.value]));
  
  const fixedMonthlyOverhead = configMap.has("gastos_fijos_mensuales") 
    ? configMap.get("gastos_fijos_mensuales")! 
    : 3910;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) + fixedMonthlyOverhead;
  const netProfit = totalIncomeNet - totalExpenses - totalProjectCosts;
  const grossProfit = totalIncomeNet - totalProjectCosts;
  const profitMargin = totalIncomeNet > 0 ? (grossProfit / totalIncomeNet) * 100 : 0;
  const netMargin = totalIncomeNet > 0 ? (netProfit / totalIncomeNet) * 100 : 0;

  const fullyPaidQuotes = quotesThisMonth.filter(q => (q.total - (q.realAmountCollected || 0)) <= 0.01 && (q.realAmountCollected || 0) > 0);

  return (
    <div className="space-y-8 max-w-7xl pb-20 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-red-900/10 border border-white/5">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-red-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px]" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-2">
              <Activity className="h-3 w-3" />
              Estado Financiero Tiempo Real
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase">
              Panel de <span className="text-red-500">Control</span>
            </h1>
            <p className="text-white/40 font-medium text-sm md:text-base max-w-md italic">
              "Si no puedes medirlo, no puedes mejorarlo." — Analiza tu rentabilidad real hoy.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
             <div className="text-right">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Balance Neto Real</p>
                <p className={`text-4xl md:text-6xl font-black ${netProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                  ${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
             </div>
             <ExpenseForm />
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card: Cobrado */}
        <div className="group relative bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-red-900/5 transition-all duration-500 hover:-translate-y-1">
          <div className="absolute top-4 right-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <TrendingUp className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ventas Totales (Cobrado)
          </p>
          <h3 className="text-3xl font-black text-gray-900 mb-1">${totalCollectedGross.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs font-bold text-gray-400">Bruto (Incluye IVA)</p>
          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase">Sin Impuestos</p>
               <p className="text-sm font-black text-gray-900">${totalIncomeNet.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
               <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card: Gastos */}
        <div className="group relative bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="absolute top-4 right-4 text-red-500/10 group-hover:text-red-500/20 transition-colors">
            <TrendingDown className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Gastos Operativos
          </p>
          <h3 className="text-3xl font-black text-red-600 mb-1">-${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs font-bold text-gray-400">Fijos + Variables</p>
          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase">Costos Proyectos</p>
               <p className="text-sm font-black text-gray-900">-${totalProjectCosts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
               <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card: Utilidad Proyectos */}
        <div className={`p-8 rounded-[2rem] border shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden group ${grossProfit >= 0 ? 'bg-gray-900 border-white/5 shadow-gray-900/20' : 'bg-red-600 border-white/10 shadow-red-600/20'}`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${grossProfit >= 0 ? 'bg-emerald-400' : 'bg-white'}`} />
            Utilidad Bruta (Proyectos)
          </p>
          <h3 className={`text-3xl font-black mb-1 ${grossProfit >= 0 ? 'text-emerald-400' : 'text-white'}`}>
            ${grossProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs font-bold text-white/40">Margen del {profitMargin.toFixed(1)}%</p>
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <div>
               <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Estado</p>
               <p className={`text-xs font-black uppercase tracking-widest ${grossProfit >= 0 ? 'text-emerald-400' : 'text-white'}`}>En Operación</p>
            </div>
            <div className={`p-3 bg-white/10 rounded-2xl ${grossProfit >= 0 ? 'text-emerald-400' : 'text-white'}`}>
               <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card: IVA */}
        <div className="group relative bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="absolute top-4 right-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
            <Receipt className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            IVA por Pagar
          </p>
          <h3 className="text-3xl font-black text-blue-600 mb-1">${totalTaxCollected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs font-bold text-gray-400 font-mono">16% de lo cobrado</p>
          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase">Cuentas Pendientes</p>
               <p className="text-sm font-black text-gray-900">{allPendingQuotes.length} Folios</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
               <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Control de Cobranza Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
             <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-3">
               <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
                  <Calendar className="h-4 w-4" />
               </div>
               Tablero de Seguimiento de Cobros
             </h3>
             <div className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                {allPendingQuotes.length} Proyectos activos
             </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-2">
            <PaymentBoard initialQuotes={allPendingQuotes} initialPaidQuotes={fullyPaidQuotes} />
          </div>
        </div>

        {/* Recent Expenses List */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-3 px-4">
             <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                <ArrowDownRight className="h-4 w-4" />
             </div>
             Últimos Gastos Registrados
          </h3>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden divide-y divide-gray-50">
            {expenses.slice(0, 8).map((expense) => (
              <div key={expense.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-white group-hover:text-red-500 transition-all border border-transparent group-hover:border-red-100">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{expense.description}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{expense.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-red-600">-${expense.amount.toLocaleString('es-MX')}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(expense.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="p-12 text-center">
                <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Sin gastos recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
