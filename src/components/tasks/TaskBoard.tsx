"use client";

import { useState, useRef, useCallback } from "react";
import {
  Plus, CheckCircle2, Clock, Loader2, CalendarDays, Trash2,
  Pencil, ListChecks, AlignLeft, AlertTriangle, Zap, Filter, Users,
} from "lucide-react";
import {
  createTaskAction, deleteTaskAction, moveTaskAction,
  reorderTasksAction, updateTaskAction, updateTaskStatusAction,
  type TaskPriority, type TaskStatus,
} from "@/app/dashboard/tasks/actions";
import { TaskModal } from "./TaskModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { ConfirmModal } from "./ConfirmModal";
import { UserAvatar } from "@/components/ui/UserAvatar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskUser { id: string; name: string; email: string; role: string; }

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  points: number;
  blockerReason: string | null;
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
  id: TaskStatus; label: string; icon: React.ElementType;
  accentColor: string; headerBg: string; countBg: string; dropBg: string; emptyText: string;
}[] = [
  { id: "BACKLOG",     label: "Por Hacer",  icon: AlignLeft,     accentColor: "text-slate-600",   headerBg: "bg-slate-50 border-slate-100",   countBg: "bg-slate-100 text-slate-700",   dropBg: "border-slate-300 bg-slate-50/60",   emptyText: "Sin ideas registradas"    },
  { id: "PENDING",     label: "Pendiente",  icon: Clock,         accentColor: "text-amber-600",   headerBg: "bg-amber-50 border-amber-100",   countBg: "bg-amber-100 text-amber-700",   dropBg: "border-amber-300 bg-amber-50/60",   emptyText: "Sin tareas pendientes"    },
  { id: "IN_PROGRESS", label: "En Proceso", icon: Loader2,       accentColor: "text-blue-600",    headerBg: "bg-blue-50 border-blue-100",     countBg: "bg-blue-100 text-blue-700",     dropBg: "border-blue-300 bg-blue-50/60",     emptyText: "Nada en proceso"          },
  { id: "BLOCKED",     label: "Bloqueado",  icon: AlertTriangle, accentColor: "text-rose-600",    headerBg: "bg-rose-50 border-rose-100",     countBg: "bg-rose-100 text-rose-700",     dropBg: "border-rose-300 bg-rose-50/60",     emptyText: "Sin bloqueos"          },
  { id: "DONE",        label: "Terminado",  icon: CheckCircle2,  accentColor: "text-emerald-600", headerBg: "bg-emerald-50 border-emerald-100", countBg: "bg-emerald-100 text-emerald-700", dropBg: "border-emerald-300 bg-emerald-50/60", emptyText: "Nada terminado aún"   },
];

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  LOW:    { label: "Baja",   color: "text-slate-500", dot: "bg-slate-400" },
  NORMAL: { label: "Normal", color: "text-amber-600", dot: "bg-amber-400" },
  HIGH:   { label: "Alta",   color: "text-red-600",   dot: "bg-red-500"   },
};

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
  task, currentUserId, currentUserRole,
  onEdit, onDelete, onDragStart, onCardClick,
}: {
  task: Task; currentUserId: string; currentUserRole: string;
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, t: Task) => void;
  onCardClick: (t: Task) => void;
}) {
  const p = PRIORITY_META[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);
  const canModify = currentUserRole === "ADMIN" || task.createdById === currentUserId;
  const isBlocked = task.status === "BLOCKED";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onCardClick(task)}
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 cursor-pointer select-none
        ${isBlocked ? "border-rose-200 bg-rose-50/30" : "border-gray-100"}`}
    >
      {/* Priority + points row */}
      <div className="flex items-center justify-between mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${
          isBlocked ? "bg-rose-100" : "bg-gray-100"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${p.color}`}>{p.label}</span>
        </div>
        {task.points > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-lg">
            <Zap className="w-2.5 h-2.5" />{task.points}h
          </span>
        )}
      </div>

      {/* Blocker badge */}
      {isBlocked && (
        <div className="flex items-center gap-1.5 mb-2 text-rose-600">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest">Bloqueado</p>
        </div>
      )}

      {/* Title & actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold text-gray-800 leading-snug flex-1">{task.title}</p>
        {canModify && (
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
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
        {task.dueDate ? (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${overdue ? "text-red-500" : "text-gray-400"}`}>
            <CalendarDays className="w-3 h-3" />{overdue && "⚠ "}{formatDate(task.dueDate)}
          </span>
        ) : <span />}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignees.map((a) => (
              <UserAvatar key={a.user.id} name={a.user.name} size="xs" className="ring-2 ring-white" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function Column({
  col, tasks, totalPoints, currentUserId, currentUserRole,
  onAddClick, onEdit, onDelete, onDragStart, onDrop, onCardClick,
}: {
  col: typeof COLUMNS[number]; tasks: Task[]; totalPoints: number;
  currentUserId: string; currentUserRole: string;
  onAddClick: (s: TaskStatus) => void; onEdit: (t: Task) => void;
  onDelete: (id: string) => void; onDragStart: (e: React.DragEvent, t: Task) => void;
  onDrop: (e: React.DragEvent, s: TaskStatus, targetId?: string) => void;
  onCardClick: (t: Task) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex flex-col rounded-3xl border-2 transition-all duration-200 min-w-[280px] ${
        isDragOver ? `${col.dropBg} shadow-xl` : "border-transparent bg-gray-50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false); }}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, col.id); }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3.5 rounded-t-3xl border-b ${col.headerBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${col.countBg}`}>
            <col.icon className={`w-3.5 h-3.5 ${col.accentColor}`} />
          </div>
          <h2 className={`text-sm font-black uppercase tracking-widest ${col.accentColor}`}>{col.label}</h2>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${col.countBg}`}>{tasks.length}</span>
          {totalPoints > 0 && (
            <span className="text-[10px] font-bold text-violet-500 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />{totalPoints}h
            </span>
          )}
        </div>
        <button
          onClick={() => onAddClick(col.id)}
          title="Nueva tarea"
          className={`group w-8 h-8 rounded-xl ${col.countBg} ${col.accentColor} cursor-pointer
            flex items-center justify-center
            transition-all duration-200
            hover:scale-110 hover:shadow-md active:scale-95
            hover:ring-2 hover:ring-current hover:ring-offset-1`}
        >
          <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5 p-3 flex-1 min-h-[180px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.stopPropagation(); onDrop(e, col.id, task.id); }}
          >
            <TaskCard
              task={task} currentUserId={currentUserId} currentUserRole={currentUserRole}
              onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} onCardClick={onCardClick}
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
  const [tasks, setTasks]             = useState<Task[]>(initialTasks);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask]   = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("PENDING");
  const [confirmId, setConfirmId]     = useState<string | null>(null);
  // Multi-select user filter: empty = show all
  const [filterUserIds, setFilterUserIds] = useState<string[]>([]);
  const draggedTask = useRef<Task | null>(null);

  // ── Filters ──────────────────────────────────────────────────────────────

  const toggleUserFilter = (uid: string) =>
    setFilterUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );

  const filteredTasks = filterUserIds.length === 0
    ? tasks
    : tasks.filter((t) =>
        t.assignees.some((a) => filterUserIds.includes(a.user.id))
      );

  const tasksByStatus = useCallback(
    (status: TaskStatus) =>
      filteredTasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [filteredTasks]
  );

  // ── Stats ─────────────────────────────────────────────────────────────────

  const total    = filteredTasks.length;
  const done     = filteredTasks.filter((t) => t.status === "DONE").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // Total points per user (for the filter bar)
  const pointsByUser = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.id] = filteredTasks
      .filter((t) => t.assignees.some((a) => a.user.id === u.id))
      .reduce((s, t) => s + t.points, 0);
    return acc;
  }, {});

  // ── Drag & Drop ───────────────────────────────────────────────────────────

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
      const without  = prev.filter((t) => t.id !== src.id);
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
    setDetailTask(null);
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => setConfirmId(id);

  const handleDeleteConfirm = async () => {
    if (!confirmId) return;
    setTasks((prev) => prev.filter((t) => t.id !== confirmId));
    setConfirmId(null);
    await deleteTaskAction(confirmId);
  };

  const handleSave = async (data: {
    title: string; description?: string; priority: TaskPriority;
    points: number; blockerReason?: string; dueDate?: string; assigneeIds: string[];
  }) => {
    setModalOpen(false);

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t, ...data,
                dueDate: data.dueDate ?? null,
                blockerReason: data.blockerReason ?? null,
                assignees: data.assigneeIds.map((uid) => ({ user: users.find((u) => u.id === uid)! })),
              }
            : t
        )
      );
      await updateTaskAction(editingTask.id, {
        title: data.title, description: data.description,
        priority: data.priority, points: data.points,
        dueDate: data.dueDate || null, assigneeIds: data.assigneeIds,
        blockerReason: data.blockerReason ?? null,
      });
    } else {
      const tempId = `tmp-${Date.now()}`;
      const newTask: Task = {
        id: tempId, title: data.title, description: data.description ?? null,
        status: defaultStatus, priority: data.priority, points: data.points,
        blockerReason: data.blockerReason ?? null,
        dueDate: data.dueDate ?? null, order: tasksByStatus(defaultStatus).length,
        createdById: currentUserId, createdBy: { id: currentUserId, name: "Tú" },
        assignees: data.assigneeIds.map((uid) => ({ user: users.find((u) => u.id === uid)! })),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
      await createTaskAction({ ...data, createdById: currentUserId, status: defaultStatus });
    }
  };

  // Optimistic status change from detail modal
  const handleStatusChangeFromDetail = (taskId: string, newStatus: TaskStatus, blockerReason?: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, blockerReason: blockerReason ?? null } : t
      )
    );
    if (detailTask?.id === taskId) {
      setDetailTask((prev) => prev ? { ...prev, status: newStatus, blockerReason: blockerReason ?? null } : prev);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
          <Plus className="w-4 h-4" /> Nueva Tarea
        </button>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
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

      {/* ── User filter bar ──────────────────────────────────────────────── */}
      {users.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-widest shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </div>
          <button
            onClick={() => setFilterUserIds([])}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
              ${filterUserIds.length === 0
                ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            <Users className="w-3.5 h-3.5" /> Todos
          </button>
          {users.map((u) => {
            const active = filterUserIds.includes(u.id);
            const pts = pointsByUser[u.id] ?? 0;
            return (
              <button
                key={u.id}
                onClick={() => toggleUserFilter(u.id)}
                className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border text-xs font-bold transition-all
                  ${active
                    ? "bg-red-600 border-red-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
              >
                <UserAvatar name={u.name} size="xs" />
                <span>{u.name.split(" ")[0]}</span>
                {pts > 0 && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-black ${active ? "text-white/80" : "text-violet-500"}`}>
                    <Zap className="w-2.5 h-2.5" />{pts}h
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Kanban Board ─────────────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.id);
          const colPoints = colTasks.reduce((s, t) => s + t.points, 0);
          return (
            <div key={col.id} className="flex-1 min-w-[260px]">
              <Column
                col={col} tasks={colTasks} totalPoints={colPoints}
                currentUserId={currentUserId} currentUserRole={currentUserRole}
                onAddClick={handleAddClick} onEdit={handleEdit}
                onDelete={handleDeleteRequest} onDragStart={handleDragStart}
                onDrop={handleDrop} onCardClick={setDetailTask}
              />
            </div>
          );
        })}
      </div>

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          users={users}
          currentUserRole={currentUserRole}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* ── Detail Modal (click on card) ─────────────────────────────────── */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onClose={() => setDetailTask(null)}
          onEdit={handleEdit}
          onStatusChange={handleStatusChangeFromDetail}
        />
      )}

      {/* ── Confirm Delete ───────────────────────────────────────────────── */}
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
