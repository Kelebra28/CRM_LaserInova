"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ArrowLeft, CalendarDays,
  Flag, Tag, Clock, AlertTriangle, CheckCircle2, Loader2,
  AlignLeft, ListChecks,
} from "lucide-react";
import { updateTaskDueDateAction, type TaskStatus, type TaskPriority } from "@/app/dashboard/tasks/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskUser { id: string; name: string; email: string; role: string; }
interface TaskTag  { id: string; name: string; color: string; }
interface SubTask  { id: string; title: string; done: boolean; order: number; createdAt: string; }

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  points: number;
  progress: number;
  blockerReason: string | null;
  dueDate: string; // always present in calendar view
  order: number;
  createdById: string | null;
  createdBy: { id: string; name: string } | null;
  assignees: { user: TaskUser }[];
  subtasks: SubTask[];
  tags: TaskTag[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialTasks: Task[];
  currentUserId: string;
  currentUserRole: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<TaskStatus, { label: string; icon: React.ElementType; color: string; bg: string; dot: string }> = {
  BACKLOG:     { label: "Por Hacer",  icon: AlignLeft,     color: "text-slate-700",   bg: "bg-slate-100",   dot: "bg-slate-400"   },
  PENDING:     { label: "Pendiente",  icon: Clock,         color: "text-amber-700",   bg: "bg-amber-50",    dot: "bg-amber-400"   },
  IN_PROGRESS: { label: "En Proceso", icon: Loader2,       color: "text-blue-700",    bg: "bg-blue-50",     dot: "bg-blue-500"    },
  BLOCKED:     { label: "Bloqueado",  icon: AlertTriangle, color: "text-rose-700",    bg: "bg-rose-50",     dot: "bg-rose-500"    },
  DONE:        { label: "Terminado",  icon: CheckCircle2,  color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH:   "bg-red-500",
  NORMAL: "bg-amber-400",
  LOW:    "bg-slate-300",
};

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function avatarInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

// ─── Task Chip ────────────────────────────────────────────────────────────────

function TaskChip({
  task,
  onDragStart,
  isSelected,
  onClick,
}: {
  task: Task;
  onDragStart: () => void;
  isSelected: boolean;
  onClick: () => void;
}) {
  const sm = STATUS_META[task.status];
  const overdue = task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("taskId", task.id);
        onDragStart();
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={task.title}
      className={`
        group relative cursor-grab active:cursor-grabbing select-none
        flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold truncate
        border transition-all duration-150 hover:shadow-sm
        ${overdue
          ? "bg-rose-50 border-rose-200 text-rose-700"
          : sm.bg + " border-transparent " + sm.color
        }
        ${isSelected ? "ring-2 ring-indigo-400/60 ring-offset-1" : ""}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
      <span className="truncate">{task.title}</span>
      {overdue && <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-rose-500" />}
    </div>
  );
}

// ─── Task Detail Side Panel ───────────────────────────────────────────────────

function TaskPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const sm = STATUS_META[task.status];
  const overdue = task.status !== "DONE" && new Date(task.dueDate) < new Date();
  const pm = PRIORITY_DOT[task.priority];
  const doneSubtasks = task.subtasks.filter(s => s.done).length;

  return (
    <div className="w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
      {/* accent */}
      <div className="h-1 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

      <div className="p-4 flex items-start justify-between gap-3 border-b border-gray-100">
        <div className="flex flex-wrap gap-1.5 flex-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${sm.bg} ${sm.color}`}>
            <sm.icon className="w-2.5 h-2.5" /> {sm.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black text-gray-500 bg-gray-100`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pm}`} />
            {task.priority === "HIGH" ? "Alta" : task.priority === "NORMAL" ? "Normal" : "Baja"}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5">×</button>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        <h3 className="text-base font-black text-gray-900 leading-snug">{task.title}</h3>

        {task.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
        )}

        {/* Fecha */}
        <div className="flex items-center gap-2 text-xs">
          <CalendarDays className={`w-3.5 h-3.5 ${overdue ? "text-rose-500" : "text-gray-400"}`} />
          <span className={overdue ? "text-rose-600 font-bold" : "text-gray-600"}>
            {overdue && "⚠ "}
            {new Date(task.dueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <span key={tag.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md border border-gray-200 uppercase tracking-wide">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Asignados */}
        {task.assignees.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Responsables</p>
            <div className="flex flex-wrap gap-1.5">
              {task.assignees.map(({ user }) => (
                <div key={user.id} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[9px] font-black flex items-center justify-center">
                    {avatarInitials(user.name)}
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">{user.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtareas */}
        {task.subtasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtareas</p>
              <span className="text-[10px] font-bold text-gray-500">{doneSubtasks}/{task.subtasks.length}</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                style={{ width: `${task.subtasks.length > 0 ? (doneSubtasks / task.subtasks.length) * 100 : 0}%` }}
              />
            </div>
            <div className="space-y-1">
              {task.subtasks.map(s => (
                <div key={s.id} className={`flex items-center gap-2 text-[11px] ${s.done ? "text-gray-400 line-through" : "text-gray-600"}`}>
                  <div className={`w-3 h-3 rounded border shrink-0 flex items-center justify-center ${s.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                    {s.done && <span className="text-white text-[8px]">✓</span>}
                  </div>
                  {s.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Puntos */}
        {task.points > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1.5 rounded-xl w-fit">
            <span className="font-black">{task.points}h</span>
            <span className="text-[10px] text-violet-500 font-medium">estimadas</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Calendar Component ──────────────────────────────────────────────────

export function TaskCalendar({ initialTasks, currentUserId, currentUserRole }: Props) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggingId, setDraggingId]   = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPending, startTransition]  = useTransition();

  // ── Calendar grid ──────────────────────────────────────────────────────────

  const firstDay  = new Date(year, month, 1).getDay();   // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedTask(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedTask(null);
  };

  const tasksByDay = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.dueDate.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const handleDrop = useCallback((dateStr: string) => {
    if (!draggingId || dateStr === tasks.find(t => t.id === draggingId)?.dueDate.slice(0, 10)) {
      setDraggingId(null); setDragOverDay(null); return;
    }
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === draggingId ? { ...t, dueDate: dateStr + "T12:00:00.000Z" } : t
    ));
    setDraggingId(null);
    setDragOverDay(null);

    startTransition(async () => {
      await updateTaskDueDateAction(draggingId, dateStr);
    });
  }, [draggingId, tasks]);

  const todayStr = toLocalDateStr(today);

  // build grid: leading empty cells + day cells
  const gridCells: Array<{ type: "empty" } | { type: "day"; day: number; dateStr: string }> = [];
  for (let i = 0; i < firstDay; i++) gridCells.push({ type: "empty" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    gridCells.push({ type: "day", day: d, dateStr });
  }

  return (
    <div className="min-h-full flex flex-col gap-5 p-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tasks"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Calendario de Tareas</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {tasks.length} tarea{tasks.length !== 1 ? "s" : ""} con fecha programada · arrastra para mover
            </p>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-black text-gray-800 min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            className="ml-2 px-3 py-1 text-[11px] font-black bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* ── Calendar + Side Panel ─────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-0 items-start">

        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="py-3 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {gridCells.map((cell, i) => {
              if (cell.type === "empty") {
                return <div key={`e-${i}`} className="min-h-[110px] border-b border-r border-gray-50 bg-gray-50/40" />;
              }

              const { day, dateStr } = cell;
              const dayTasks = tasksByDay[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isDragOver = dragOverDay === dateStr;
              const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;

              return (
                <div
                  key={dateStr}
                  className={`
                    min-h-[110px] border-b border-r border-gray-100 p-1.5 flex flex-col gap-1 transition-colors duration-150
                    ${isWeekend ? "bg-gray-50/60" : "bg-white"}
                    ${isDragOver ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400/40" : ""}
                  `}
                  onDragOver={(e) => { e.preventDefault(); setDragOverDay(dateStr); }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={() => handleDrop(dateStr)}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                        ${isToday
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/40"
                          : "text-gray-400"
                        }
                      `}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-black text-gray-400">{dayTasks.length}</span>
                    )}
                  </div>

                  {/* Task chips — show max 3, then "+N más" */}
                  {dayTasks.slice(0, 3).map(task => (
                    <TaskChip
                      key={task.id}
                      task={task}
                      onDragStart={() => setDraggingId(task.id)}
                      isSelected={selectedTask?.id === task.id}
                      onClick={() => setSelectedTask(prev => prev?.id === task.id ? null : task)}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <button
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 text-left pl-1"
                      onClick={() => setSelectedTask(dayTasks[3])}
                    >
                      +{dayTasks.length - 3} más
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        {selectedTask && (
          <TaskPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap pb-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estados:</span>
        {(Object.entries(STATUS_META) as [TaskStatus, typeof STATUS_META[TaskStatus]][]).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${meta.bg} ${meta.color} border border-transparent`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        ))}
        {isPending && (
          <span className="text-[10px] text-indigo-500 font-bold animate-pulse ml-auto">Guardando cambio de fecha…</span>
        )}
      </div>

    </div>
  );
}
