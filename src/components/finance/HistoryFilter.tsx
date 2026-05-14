"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Generar los últimos 5 años
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export function HistoryFilter({ currentMonth, currentYear }: { currentMonth: number, currentYear: number }) {
  const router = useRouter();
  
  const handlePrevMonth = () => {
    let m = currentMonth - 1;
    let y = currentYear;
    if (m < 0) {
      m = 11;
      y--;
    }
    router.push(`/dashboard/finance/history?month=${m}&year=${y}`);
  };

  const handleNextMonth = () => {
    let m = currentMonth + 1;
    let y = currentYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    router.push(`/dashboard/finance/history?month=${m}&year=${y}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    router.push(`/dashboard/finance/history?month=${now.getMonth()}&year=${now.getFullYear()}`);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/dashboard/finance/history?month=${e.target.value}&year=${currentYear}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/dashboard/finance/history?month=${currentMonth}&year=${e.target.value}`);
  };

  return (
    <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Período</p>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-2">
              <select 
                value={currentMonth} 
                onChange={handleMonthChange}
                className="text-sm font-black text-gray-900 uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>

              <select 
                value={currentYear} 
                onChange={handleYearChange}
                className="text-sm font-black text-gray-900 uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="w-px h-8 bg-gray-100" />
      <button 
        onClick={handleCurrentMonth}
        className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors uppercase tracking-widest px-2"
      >
        Mes Actual
      </button>
    </div>
  );
}
