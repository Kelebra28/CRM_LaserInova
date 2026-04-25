"use client";

import { useState } from "react";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { deleteClient } from "@/app/dashboard/clients/actions";
import StatusModal from "@/components/ui/StatusModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface ClientActionsProps {
  clientId: string;
  clientName: string;
}

export default function ClientActions({ clientId, clientName }: ClientActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteClient(clientId);
    } catch (error) {
      console.error("Error deleting client:", error);
      setStatusModal({
        isOpen: true,
        title: "Error",
        message: "No se pudo eliminar al cliente.",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 overflow-hidden">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <Link
                href={`/dashboard/clients/${clientId}/edit`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Edit2 className="mr-3 h-4 w-4 text-gray-400" />
                Editar
              </Link>
              <button
                onClick={() => {
                  setShowConfirm(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="mr-3 h-4 w-4 text-red-400" />
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar a ${clientName}? Si tiene cotizaciones asociadas, se desactivará pero su historial se mantendrá.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

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
