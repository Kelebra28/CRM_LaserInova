"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Settings, 
  FileText, 
  PieChart,
  DollarSign,
  Cpu
} from "lucide-react";
import { useSession } from "next-auth/react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Cotizaciones", href: "/dashboard/quotes", icon: FileText },
  { name: "Clientes", href: "/dashboard/clients", icon: Users },
  { name: "Materiales", href: "/dashboard/materials", icon: Package },
  { name: "Procesos", href: "/dashboard/processes", icon: Cpu },
  { name: "Finanzas", href: "/dashboard/finance", icon: DollarSign, adminOnly: true },
  { name: "Reportes", href: "/dashboard/reports", icon: PieChart },
  { name: "Configuración", href: "/dashboard/settings", icon: Settings, adminOnly: true },
];



export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <div className="flex flex-col w-64 bg-black text-white h-full border-r border-gray-800">
      <div className="flex items-center justify-center p-4 border-b border-gray-800">
        <Link href="/dashboard" className="block w-full">
          <img
            src="/laser_inova_navbar_mas_grande.png"
            alt="Laser Inova Logo"
            className="w-full h-auto max-h-24 object-contain mx-auto"
          />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
