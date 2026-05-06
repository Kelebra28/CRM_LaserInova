"use client";

import React from "react";

interface UserAvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ name, size = "md", className = "" }: UserAvatarProps) {
  // Lógica de letras: Las 2 primeras del nombre (RI de Ricardo, RA de Raul)
  const getInitials = (userName: string) => {
    const parts = userName.trim().split(" ");
    const firstName = parts[0] || "";
    if (firstName.length >= 2) {
      return firstName.substring(0, 2).toUpperCase();
    }
    return firstName.substring(0, 1).toUpperCase();
  };

  // Colores fijos para los jefes, dinámicos para el resto
  const getGradient = (userName: string) => {
    const lowerName = userName.toLowerCase();
    if (lowerName.includes("ricardo")) return "from-red-500 to-rose-600 shadow-red-500/20";
    if (lowerName.includes("raul")) return "from-blue-500 to-indigo-600 shadow-blue-500/20";
    
    // Para otros usuarios, color basado en el hash del nombre
    const gradients = [
      "from-emerald-500 to-teal-600",
      "from-violet-500 to-purple-600",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-cyan-500 to-blue-600",
    ];
    let hash = 0;
    for (let i = 0; i < userName.length; i++) hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const sizes = {
    xs: "w-5 h-5 text-[8px] rounded-md",
    sm: "w-7 h-7 text-[10px] rounded-lg",
    md: "w-9 h-9 text-xs rounded-xl",
    lg: "w-12 h-12 text-sm rounded-2xl",
  };

  return (
    <div
      title={name}
      className={`flex items-center justify-center font-black text-white bg-gradient-to-br shadow-sm flex-shrink-0 transition-transform ${sizes[size]} ${getGradient(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
