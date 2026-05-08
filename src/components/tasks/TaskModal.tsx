"use client";

import { useState } from "react";
import { X, CalendarDays, Flag, Users, Check, Zap, AlertTriangle } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/app/dashboard/tasks/actions";

interface TaskUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  points: number;
  blockerReason: string | null;
  dueDate: string | null;
  assignees: { user: TaskUser }[];
}

interface Props {
  task: Task | null;
  users: TaskUser[];
  currentUserRole: string;
  initialStatus?: TaskStatus;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    points: number;
    blockerReason?: string;
    dueDate?: string;
    assigneeIds: string[];
  }) => void;
}

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  icon: string;
  activeBg: string;
  activeText: string;
  ring: string;
}[] = [
  { value: "LOW",    label: "Baja",   icon: "🔵", activeBg: "bg-slate-700 border-slate-700",  activeText: "text-white", ring: "ring-slate-400/30"  },
  { value: "NORMAL", label: "Normal", icon: "🟡", activeBg: "bg-amber-500 border-amber-500",  activeText: "text-white", ring: "ring-amber-400/30"  },
  { value: "HIGH",   label: "Alta",   icon: "🔴", activeBg: "bg-red-600   border-red-600",    activeText: "text-white", ring: "ring-red-400/30"    },
];

function avatarGradient(name: string) {
  const g = ["from-red-500 to-rose-600","from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-violet-500 to-purple-600","from-amber-500 to-orange-600"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return g[Math.abs(h) % g.length];
}

function avatarInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskModal({ task, initialStatus, users, currentUserRole, onClose, onSave }: Props) {
  const [title, setTitle]           = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority]     = useState<TaskPriority>(task?.priority ?? "NORMAL");
  const [points, setPoints]         = useState(task?.points ?? 0);
  const [blockerReason, setBlockerReason] = useState(task?.blockerReason ?? "");
  const [dueDate, setDueDate]       = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task?.assignees.map((a) => a.user.id) ?? []);
  const [saving, setSaving]         = useState(false);

  const isBlocked = task?.status === "BLOCKED" || initialStatus === "BLOCKED";

  const toggleAssignee = (userId: string) =>
    setAssigneeIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      points,
      blockerReason: isBlocked ? (blockerReason.trim() || undefined) : undefined,
      dueDate: dueDate || undefined,
      assigneeIds,
    });
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              {task ? "Editar tarea" : "Nueva tarea"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {task ? "Modifica los detalles de la tarea" : "Completa los campos para crear la tarea"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Title */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Qué hay que hacer?"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-gray-50/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles, contexto o instrucciones..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none bg-gray-50/50"
              />
            </div>

            {/* Blocker reason — only shown when editing a BLOCKED task */}
            {isBlocked && (
              <div>
                <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Razón del bloqueo *
                </label>
                <textarea
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="¿Cuál es el inconveniente o qué se necesita para continuar?"
                  rows={2}
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-rose-200 text-sm text-gray-700 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-all resize-none bg-rose-50/30"
                />
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                <Flag className="w-3 h-3 inline mr-1 mb-0.5" /> Prioridad
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITY_OPTIONS.map((opt) => {
                  const active = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 font-bold text-xs transition-all duration-200
                        ${active ? `${opt.activeBg} ${opt.activeText} shadow-lg ring-4 ${opt.ring} scale-[1.03]` : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-100"}`}
                    >
                      <span className="text-lg leading-none">{opt.icon}</span>
                      <span className={active ? "text-white/90" : ""}>{opt.label}</span>
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/25 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Story points */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-500" /> Puntos (1 punto = 1 hora)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPoints((p) => Math.max(0, p - 1))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 text-gray-600 font-black text-lg hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  −
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={points}
                    onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-3 text-center rounded-2xl border border-gray-200 text-lg font-black text-violet-700 bg-violet-50/50 focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-400">
                    {points === 1 ? "hora" : "horas"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPoints((p) => p + 1)}
                  className="w-10 h-10 rounded-xl border-2 border-violet-200 text-violet-600 font-black text-lg hover:border-violet-400 hover:bg-violet-50 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                <CalendarDays className="w-3 h-3 inline mr-1 mb-0.5" /> Fecha límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all cursor-pointer"
              />
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                <Users className="w-3 h-3 inline mr-1 mb-0.5" /> Asignar a
              </label>
              {users.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No hay usuarios disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => {
                    const selected = assigneeIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAssignee(user.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200 text-left
                          ${selected ? "border-red-500 bg-red-50/60 shadow-sm shadow-red-500/10" : "border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-gray-100/80"}`}
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient(user.name)} text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          {avatarInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${selected ? "text-red-700" : "text-gray-800"}`}>{user.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${user.role === "ADMIN" ? selected ? "bg-red-200 text-red-700" : "bg-gray-200 text-gray-500" : selected ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                          {user.role === "ADMIN" ? "Admin" : "Vendedor"}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "border-red-600 bg-red-600" : "border-gray-300"}`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-black shadow-lg shadow-red-600/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : task ? "Guardar cambios" : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
      `}</style>
    </div>
  );
}
