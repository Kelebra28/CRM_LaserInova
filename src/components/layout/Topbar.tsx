"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Menu, ShieldCheck, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const name = user?.name || user?.email || "Usuario";
  const role = user?.role as string | undefined;
  const isAdmin = role === "ADMIN";

  return (
    <header className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left: hamburger (mobile) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-3">
        {/* User identity pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-2xl border border-gray-100">
          {/* Avatar — Ahora usa RI/RA y colores fijos */}
          <UserAvatar name={name} size="sm" />

          {/* Name + role */}
          <div className="hidden sm:block">
            <p className="text-xs font-black text-gray-800 leading-none">{name}</p>
            <p className={`text-[9px] font-black uppercase tracking-wider mt-0.5 flex items-center gap-0.5 ${
              isAdmin ? "text-violet-600" : "text-blue-600"
            }`}>
              {isAdmin
                ? <><ShieldCheck className="w-2.5 h-2.5" /> Admin</>
                : <><UserIcon className="w-2.5 h-2.5" /> Vendedor</>
              }
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
