"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex-1 flex">
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
