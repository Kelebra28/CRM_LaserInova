"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ArrowLeft, CalendarDays, Plus,
  AlertTriangle, Filter, X, Activity,
} from "lucide-react";
import { updateTaskDueDateAction, createTaskAction, type TaskStatus, type TaskPriority } from "@/app/dashboard/tasks/actions";
import type { CalTask, TaskUser, TaskTag } from "./CalendarTypes";
import { STATUS_META, PRIORITY_META, MONTHS, DAYS_OF_WEEK, toDateStr, MAX_DAILY_HOURS } from "./CalendarTypes";
import { calcHealthScore, calcWeekMetrics, calcDayCapacity, generateRecommendations, CAPACITY_STYLE, urgencyScore } from "./CalendarEngine";
import { HealthBar, RecommendationsBar, TodayView, TaskPanel } from "./CalendarPanels";
import { TaskModal } from "./TaskModal";

interface Props {
  initialTasks: CalTask[];
  users: TaskUser[];
  tags: TaskTag[];
  currentUserId: string;
  currentUserRole: string;
}

type FilterKey = "all" | "mine" | "overdue" | "blocked" | "high" | "done" | "pending";

export function TaskCalendar({ initialTasks, users, tags, currentUserId, currentUserRole }: Props) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState<CalTask[]>(initialTasks);
  const [draggingId, setDraggingId]   = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<CalTask | null>(null);
  const [showToday, setShowToday]     = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [createForDate, setCreateForDate] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  // ── Computed ────────────────────────────────────────────────────────────────

  const health  = useMemo(() => calcHealthScore(tasks), [tasks]);
  const metrics = useMemo(() => calcWeekMetrics(tasks),  [tasks]);
  const recs    = useMemo(() => generateRecommendations(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      if (activeFilter === "mine")    return t.assignees.some(a => a.user.id === currentUserId);
      if (activeFilter === "overdue") return t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < now;
      if (activeFilter === "blocked") return t.status === "BLOCKED";
      if (activeFilter === "high")    return t.priority === "HIGH";
      if (activeFilter === "done")    return t.status === "DONE";
      if (activeFilter === "pending") return ["BACKLOG","PENDING"].includes(t.status);
      return true;
    });
  }, [tasks, activeFilter, currentUserId]);

  const calendarTasks = filteredTasks.filter(t => t.dueDate !== null);

  const tasksByDay = useMemo(() =>
    calendarTasks.reduce<Record<string, CalTask[]>>((acc, t) => {
      const key = t.dueDate!.slice(0, 10);
      (acc[key] ??= []).push(t);
      return acc;
    }, {}),
  [calendarTasks]);

  // ── Calendar grid ──────────────────────────────────────────────────────────

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { setMonth(m => m === 0 ? (setYear(y=>y-1), 11) : m-1); setSelectedTask(null); };
  const nextMonth = () => { setMonth(m => m === 11 ? (setYear(y=>y+1), 0) : m+1); setSelectedTask(null); };

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const handleDrop = useCallback((dateStr: string) => {
    if (!draggingId) return;
    setTasks(prev => prev.map(t => t.id === draggingId ? { ...t, dueDate: dateStr+"T12:00:00.000Z" } : t));
    const id = draggingId;
    setDraggingId(null); setDragOverDay(null);
    startTransition(async () => { await updateTaskDueDateAction(id, dateStr); });
  }, [draggingId]);

  // ── Create from calendar ───────────────────────────────────────────────────

  const handleSave = async (data: {
    title: string; description?: string; priority?: TaskPriority; points?: number;
    dueDate?: string; assigneeIds: string[]; subtasks: {id:string;title:string}[]; tagIds: string[];
  }) => {
    const newTask = await createTaskAction({
      ...data,
      status: "PENDING",
      createdById: currentUserId,
      dueDate: createForDate ?? data.dueDate,
    });
    setTasks(prev => [...prev, newTask as unknown as CalTask]);
    setCreateForDate(null);
  };

  // ── Grid cells ─────────────────────────────────────────────────────────────

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",     label: "Todas" },
    { key: "mine",    label: "Mis tareas" },
    { key: "high",    label: "Alta prioridad" },
    { key: "overdue", label: "Vencidas" },
    { key: "blocked", label: "Bloqueadas" },
    { key: "pending", label: "Pendientes" },
    { key: "done",    label: "Terminadas" },
  ];

  return (
    <div className="min-h-full flex flex-col gap-4 p-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tasks" className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Calendario Operativo</h1>
            <p className="text-xs text-gray-400 mt-0.5">{tasks.length} tareas · arrastra para mover fechas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowToday(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black transition-all ${showToday ? "bg-amber-500 border-amber-500 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"}`}
          >
            <Activity className="w-4 h-4" /> Hoy en el Taller
          </button>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-black text-gray-800 min-w-[130px] text-center">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }} className="ml-1 px-2.5 py-1 text-[11px] font-black bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* ── Health Bar ─────────────────────────────────────────────────────── */}
      <HealthBar health={health} metrics={metrics} />

      {/* ── Recommendations ────────────────────────────────────────────────── */}
      <RecommendationsBar recs={recs} />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              activeFilter === f.key
                ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        {isPending && <span className="text-[11px] text-indigo-500 font-bold animate-pulse ml-auto">Guardando…</span>}
      </div>

      {/* ── Today View (toggle) ─────────────────────────────────────────────── */}
      {showToday && <TodayView tasks={tasks} todayStr={todayStr} />}

      {/* ── Calendar + Side Panel ──────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 items-start">

        {/* Grid */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="py-3 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {/* Empty leading cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="min-h-[120px] border-b border-r border-gray-50 bg-gray-50/40" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayTasks = tasksByDay[dateStr] ?? [];
              const cap = calcDayCapacity(tasks, dateStr);
              const cs  = CAPACITY_STYLE[cap.level];
              const isToday   = dateStr === todayStr;
              const isDragOver = dragOverDay === dateStr;
              const isWeekend  = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
              const hasOverdue = dayTasks.some(t => t.status !== "DONE" && new Date(t.dueDate!) < today);
              const hasBlocked = dayTasks.some(t => t.status === "BLOCKED");

              return (
                <div
                  key={dateStr}
                  className={`min-h-[120px] border-b border-r border-gray-100 p-1.5 flex flex-col gap-1 transition-colors duration-150 cursor-pointer
                    ${isWeekend && cap.level==="light" ? "bg-gray-50/50" : cs.bg}
                    ${isDragOver ? "!bg-indigo-50 ring-2 ring-inset ring-indigo-400/50" : ""}
                  `}
                  onDragOver={e => { e.preventDefault(); setDragOverDay(dateStr); }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={() => handleDrop(dateStr)}
                  onClick={() => setCreateForDate(dateStr)}
                >
                  {/* Day number row */}
                  <div className="flex items-center justify-between">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                      ${isToday ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400"}`}>
                      {day}
                    </span>
                    <div className="flex items-center gap-1">
                      {hasOverdue  && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      {hasBlocked  && <span className="w-2 h-2 rounded-full bg-orange-400" title="Bloqueada"/>}
                      {cap.hours > 0 && (
                        <span className={`text-[9px] font-black px-1 py-0.5 rounded border ${cs.badge}`}>{cap.hours}h</span>
                      )}
                    </div>
                  </div>

                  {/* Task chips */}
                  {dayTasks.slice(0, 3).map(task => {
                    const sm = STATUS_META[task.status];
                    const isOver = task.status !== "DONE" && new Date(task.dueDate!) < today;
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => { e.dataTransfer.setData("taskId", task.id); e.stopPropagation(); setDraggingId(task.id); }}
                        onClick={e => { e.stopPropagation(); setSelectedTask(prev => prev?.id===task.id ? null : task); }}
                        title={task.title}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold truncate border cursor-grab active:cursor-grabbing transition-all hover:shadow-sm select-none
                          ${isOver ? "bg-rose-50 border-rose-200 text-rose-700" : `${sm.bg} border-transparent ${sm.color}`}
                          ${selectedTask?.id===task.id ? "ring-2 ring-indigo-400/60 ring-offset-1" : ""}
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_META[task.priority].dot}`} />
                        <span className="truncate">{task.title}</span>
                        {isOver && <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-rose-500" />}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <button
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 text-left pl-1"
                      onClick={e => { e.stopPropagation(); setSelectedTask(dayTasks[3]); }}
                    >
                      +{dayTasks.length - 3} más
                    </button>
                  )}
                  {dayTasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        {selectedTask && (
          <TaskPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap pb-2 text-[10px]">
        <span className="font-black text-gray-400 uppercase tracking-widest">Carga:</span>
        {(["light","normal","loaded","saturated"] as const).map(l => (
          <span key={l} className={`px-2 py-0.5 rounded-lg border font-bold ${CAPACITY_STYLE[l].badge}`}>
            {CAPACITY_STYLE[l].label}
          </span>
        ))}
        <span className="mx-2 text-gray-200">|</span>
        {(Object.entries(STATUS_META) as [TaskStatus, typeof STATUS_META[TaskStatus]][]).map(([k,m]) => (
          <span key={k} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${m.bg} ${m.color} font-bold border ${m.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`}/>{m.label}
          </span>
        ))}
      </div>

      {/* ── Create Task Modal ─────────────────────────────────────────────── */}
      {createForDate && (
        <TaskModal
          task={null}
          initialStatus="PENDING"
          users={users}
          tags={tags}
          currentUserRole={currentUserRole}
          onClose={() => setCreateForDate(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
