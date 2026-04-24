"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User as UserIcon, Menu } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-600 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        {/* Breadcrumbs or search could go here */}
      </div>
      <div className="ml-4 flex items-center md:ml-6 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <UserIcon className="h-5 w-5 text-gray-400" />
          <span className="hidden sm:inline-block font-medium">
            {session?.user?.name || session?.user?.email}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
            {(session?.user as any)?.role}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          title="Cerrar sesión"
        >
          <span className="sr-only">Cerrar sesión</span>
          <LogOut className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
