"use client";

import { useState } from "react";
import { Edit2, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { deleteCategory } from "@/app/dashboard/materials/categories/actions";
import StatusModal from "@/components/ui/StatusModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface CategoryActionsProps {
  categoryId: string;
  categoryName: string;
}

export default function CategoryActions({ categoryId, categoryName }: CategoryActionsProps) {
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
      const result = await deleteCategory(categoryId);
      if (result?.error) {
        setStatusModal({
          isOpen: true,
          title: "Aviso",
          message: result.error,
          type: "error"
        });
      } else {
        setStatusModal({
          isOpen: true,
          title: "¡Eliminado!",
          message: "La categoría ha sido eliminada correctamente.",
          type: "success"
        });
      }
      setShowConfirm(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      setStatusModal({
        isOpen: true,
        title: "Error",
        message: "No se pudo eliminar la categoría.",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
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
              <button
                onClick={() => {
                  // TODO: Implement Edit category if needed, for now just show confirm delete
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
        message={`¿Estás seguro de que deseas eliminar la categoría "${categoryName}"? Esta acción solo se podrá realizar si no hay materiales asociados.`}
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
