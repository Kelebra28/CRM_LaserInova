"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/app/dashboard/clients/actions";
import StatusModal from "@/components/ui/StatusModal";
import { useRouter } from "next/navigation";

export default function ClientForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success"
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await createClient(formData);
      setStatusModal({
        isOpen: true,
        title: "¡Éxito!",
        message: "Cliente guardado correctamente.",
        type: "success"
      });
      setTimeout(() => {
        router.push("/dashboard/clients");
      }, 1500);
    } catch (error) {
      console.error(error);
      setStatusModal({
        isOpen: true,
        title: "Error",
        message: "Hubo un problema al guardar el cliente.",
        type: "error"
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/clients"
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm border border-gray-100 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre o Razón Social *
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                required
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Empresa
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="company"
                id="company"
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rfc" className="block text-sm font-medium text-gray-700">
              RFC
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="rfc"
                id="rfc"
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="email"
                id="email"
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="phone"
                id="phone"
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="address"
                id="address"
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notas Internas
            </label>
            <div className="mt-1">
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
          <Link
            href="/dashboard/clients"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Guardar Cliente
              </>
            )}
          </button>
        </div>
      </form>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
      />
    </div>
  );
}
