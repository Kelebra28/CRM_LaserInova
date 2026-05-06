"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, CheckCircle2, Clock, Loader2, CalendarDays, Trash2, Pencil, ListChecks } from "lucide-react";
import {
  createTaskAction,
  deleteTaskAction,
  moveTaskAction,
  reorderTasksAction,
  updateTaskAction,
  type TaskPriority,
  type TaskStatus,
} from "@/app/dashboard/tasks/actions";
import { TaskModal } from "./TaskModal";
import { ConfirmModal } from "./ConfirmModal";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  dueDate: string | null;
  order: number;
  createdById: string | null;
  createdBy: { id: string; name: string } | null;
  assignees: { user: TaskUser }[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialTasks: Task[];
  users: TaskUser[];
  currentUserId: string;
  currentUserRole: string;
}

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMNS: {
  id: TaskStatus;
  label: string;
  icon: React.ElementType;
  accentColor: string;
  headerBg: string;
  countBg: string;
  dropBg: string;
  emptyText: string;
}[] = [
  {
    id: "PENDING",
    label: "Pendiente",
    icon: Clock,
    accentColor: "text-amber-600",
    headerBg: "bg-amber-50 border-amber-100",
    countBg: "bg-amber-100 text-amber-700",
    dropBg: "border-amber-300 bg-amber-50/60",
    emptyText: "Sin tareas pendientes",
  },
  {
    id: "IN_PROGRESS",
    label: "En Proceso",
    icon: Loader2,
    accentColor: "text-blue-600",
    headerBg: "bg-blue-50 border-blue-100",
    countBg: "bg-blue-100 text-blue-700",
    dropBg: "border-blue-300 bg-blue-50/60",
    emptyText: "Nada en proceso",
  },
  {
    id: "DONE",
    label: "Terminado",
    icon: CheckCircle2,
    accentColor: "text-emerald-600",
    headerBg: "bg-emerald-50 border-emerald-100",
    countBg: "bg-emerald-100 text-emerald-700",
    dropBg: "border-emerald-300 bg-emerald-50/60",
    emptyText: "Nada terminado aún",
  },
];

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  LOW:    { label: "Baja",   color: "text-slate-500", bg: "bg-slate-100",  dot: "bg-slate-400" },
  NORMAL: { label: "Normal", color: "text-amber-600", bg: "bg-amber-50",   dot: "bg-amber-400" },
  HIGH:   { label: "Alta",   color: "text-red-600",   bg: "bg-red-50",     dot: "bg-red-500"   },
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
];

function avatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function avatarInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function isOverdue(iso: string | null, status: TaskStatus) {
  if (!iso || status === "DONE") return false;
  return new Date(iso) < new Date();
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
  onDragStart,
}: {
  task: Task;
  currentUserId: string;
  currentUserRole: string;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}) {
  const p = PRIORITY_META[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);
  const canModify = currentUserRole === "ADMIN" || task.createdById === currentUserId;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 select-none"
    >
      {/* Priority strip */}
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${p.bg} mb-3`}>
        <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${p.color}`}>{p.label}</span>
      </div>

      {/* Title & actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold text-gray-800 leading-snug flex-1">{task.title}</p>
        {canModify && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
        {/* Due date */}
        {task.dueDate ? (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${overdue ? "text-red-500" : "text-gray-400"}`}>
            <CalendarDays className="w-3 h-3" />
            {overdue && "⚠ "}
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span />
        )}

        {/* Assignee avatars */}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map(({ user }) => (
              <div
                key={user.id}
                title={user.name}
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarGradient(user.name)} text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-sm`}
              >
                {avatarInitials(user.name)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function Column({
  col,
  tasks,
  currentUserId,
  currentUserRole,
  onAddClick,
  onEdit,
  onDelete,
  onDragStart,
  onDrop,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  currentUserId: string;
  currentUserRole: string;
  onAddClick: (status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus, targetTaskId?: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex flex-col rounded-3xl border-2 transition-all duration-200 ${
        isDragOver ? `${col.dropBg} shadow-xl` : "border-transparent bg-gray-50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => {
        // Only fire if leaving the column entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
      }}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, col.id); }}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3.5 rounded-t-3xl border-b ${col.headerBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${col.countBg}`}>
            <col.icon className={`w-3.5 h-3.5 ${col.accentColor}`} />
          </div>
          <h2 className={`text-sm font-black uppercase tracking-widest ${col.accentColor}`}>
            {col.label}
          </h2>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${col.countBg}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddClick(col.id)}
          className={`w-7 h-7 rounded-xl ${col.countBg} ${col.accentColor} hover:opacity-80 transition-opacity flex items-center justify-center`}
          title="Nueva tarea"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards list */}
      <div className="flex flex-col gap-2.5 p-3 flex-1 min-h-[240px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.stopPropagation(); onDrop(e, col.id, task.id); }}
          >
            <TaskCard
              task={task}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
            />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-gray-300">
            <col.icon className="w-9 h-9 opacity-40" />
            <p className="text-xs font-semibold">{col.emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function TaskBoard({ initialTasks, users, currentUserId, currentUserRole }: Props) {
  const [tasks, setTasks]           = useState<Task[]>(initialTasks);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("PENDING");
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const draggedTask = useRef<Task | null>(null);

  const tasksByStatus = useCallback(
    (status: TaskStatus) =>
      tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [tasks]
  );

  // Stats
  const total    = tasks.length;
  const done     = tasks.filter((t) => t.status === "DONE").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Drag ──────────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    draggedTask.current = task;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus, targetTaskId?: string) => {
    e.preventDefault();
    const src = draggedTask.current;
    if (!src) return;

    const columnTasks = tasksByStatus(targetStatus).filter((t) => t.id !== src.id);
    let newOrder: number;
    if (targetTaskId) {
      const idx = columnTasks.findIndex((t) => t.id === targetTaskId);
      newOrder = idx >= 0 ? idx : columnTasks.length;
    } else {
      newOrder = columnTasks.length;
    }

    setTasks((prev) => {
      const without = prev.filter((t) => t.id !== src.id);
      const colItems = without.filter((t) => t.status === targetStatus);
      const others   = without.filter((t) => t.status !== targetStatus);
      colItems.splice(newOrder, 0, { ...src, status: targetStatus });
      return [...others, ...colItems.map((t, i) => ({ ...t, order: i }))];
    });

    draggedTask.current = null;
    await moveTaskAction(src.id, targetStatus, newOrder);
    const colItems = tasksByStatus(targetStatus).filter((t) => t.id !== src.id);
    colItems.splice(newOrder, 0, src);
    await reorderTasksAction(colItems.map((t, i) => ({ id: t.id, order: i })));
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleAddClick = (status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  // Request delete → open confirm modal
  const handleDeleteRequest = (id: string) => setConfirmId(id);

  // Confirmed delete
  const handleDeleteConfirm = async () => {
    if (!confirmId) return;
    setTasks((prev) => prev.filter((t) => t.id !== confirmId));
    setConfirmId(null);
    await deleteTaskAction(confirmId);
  };

  const handleSave = async (data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;
    assigneeIds: string[];
  }) => {
    setModalOpen(false);

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...data,
                dueDate: data.dueDate ?? null,
                assignees: data.assigneeIds.map((uid) => ({
                  user: users.find((u) => u.id === uid)!,
                })),
              }
            : t
        )
      );
      await updateTaskAction(editingTask.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate || null,
        assigneeIds: data.assigneeIds,
      });
    } else {
      const tempId = `tmp-${Date.now()}`;
      const newTask: Task = {
        id: tempId,
        title: data.title,
        description: data.description ?? null,
        status: defaultStatus,
        priority: data.priority,
        dueDate: data.dueDate ?? null,
        order: tasksByStatus(defaultStatus).length,
        createdById: currentUserId,
        createdBy: { id: currentUserId, name: "Tú" },
        assignees: data.assigneeIds.map((uid) => ({
          user: users.find((u) => u.id === uid)!,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
      await createTaskAction({ ...data, createdById: currentUserId, status: defaultStatus });
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/25">
            <ListChecks className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tareas del Equipo</h1>
            <p className="text-xs text-gray-400 mt-0.5">{total} tarea{total !== 1 ? "s" : ""} · {done} completada{done !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <button
          onClick={() => handleAddClick("PENDING")}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-red-600/25 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-black text-gray-400 shrink-0">{progress}%</span>
        </div>
      )}

      {/* ── Kanban Board ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            col={col}
            tasks={tasksByStatus(col.id)}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onAddClick={handleAddClick}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* ── Task Modal ──────────────────────────────────────────────────── */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          users={users}
          currentUserRole={currentUserRole}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* ── Confirm Delete Modal ────────────────────────────────────────── */}
      {confirmId && (
        <ConfirmModal
          title="¿Eliminar tarea?"
          message="Esta acción no se puede deshacer. La tarea se eliminará permanentemente."
          confirmLabel="Sí, eliminar"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
