import React from "react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        {/* Center pulse */}
        <div className="absolute inset-4 bg-red-50 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-1">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest animate-pulse">
          Cargando
        </h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
          Laser Inova CRM
        </p>
      </div>
    </div>
  );
}
