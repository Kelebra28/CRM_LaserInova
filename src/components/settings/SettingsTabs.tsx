"use client";

import { useState } from "react";
import { SlidersHorizontal, Users } from "lucide-react";

interface Props {
  costsContent: React.ReactNode;
  usersContent: React.ReactNode;
}

export function SettingsTabs({ costsContent, usersContent }: Props) {
  const [activeTab, setActiveTab] = useState<"costs" | "users">("costs");

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
        <button
          onClick={() => setActiveTab("costs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "costs"
              ? "bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200/50"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Costos Operativos
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "users"
              ? "bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-200/50"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
        >
          <Users className="w-4 h-4" /> Usuarios del Sistema
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "costs" ? costsContent : usersContent}
      </div>
    </div>
  );
}
