"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type TaskStatus = "BACKLOG" | "PENDING" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH";

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createTaskAction(data: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  points?: number;
  dueDate?: string;
  assigneeIds?: string[];
  createdById: string;
  status?: TaskStatus;
}) {
  const maxOrder = await prisma.task.aggregate({
    _max: { order: true },
    where: { status: data.status ?? "PENDING" },
  });

  const newTask = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? "NORMAL",
      points: data.points ?? 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status ?? "PENDING",
      order: (maxOrder._max.order ?? -1) + 1,
      createdById: data.createdById,
      assignees: data.assigneeIds?.length
        ? { create: data.assigneeIds.map((userId) => ({ userId })) }
        : undefined,
    },
    include: {
      assignees: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  revalidatePath("/dashboard/tasks");
  return {
    ...newTask,
    status: newTask.status as TaskStatus,
    priority: newTask.priority as TaskPriority,
    dueDate: newTask.dueDate?.toISOString() ?? null,
    createdAt: newTask.createdAt.toISOString(),
    updatedAt: newTask.updatedAt.toISOString(),
  };
}

// ─── Update (full edit) ──────────────────────────────────────────────────────

export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    points?: number;
    dueDate?: string | null;
    blockerReason?: string | null;
    assigneeIds?: string[];
  }
) {
  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        points: data.points,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
        blockerReason: data.blockerReason,
      },
    });

    if (data.assigneeIds !== undefined) {
      await tx.taskAssignee.deleteMany({ where: { taskId } });
      if (data.assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: data.assigneeIds.map((userId) => ({ taskId, userId })),
        });
      }
    }
  });

  revalidatePath("/dashboard/tasks");
}

// ─── Quick status change (from card or detail modal) ─────────────────────────

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: TaskStatus,
  blockerReason?: string
) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      blockerReason: newStatus === "BLOCKED" ? blockerReason ?? null : null,
    },
  });

  revalidatePath("/dashboard/tasks");
}

// ─── Move (drag & drop) ───────────────────────────────────────────────────────

export async function moveTaskAction(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number,
  blockerReason?: string
) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      order: newOrder,
      blockerReason: newStatus === "BLOCKED" ? blockerReason ?? null : null,
    },
  });

  revalidatePath("/dashboard/tasks");
}

// ─── Reorder within same column ──────────────────────────────────────────────

export async function reorderTasksAction(
  items: { id: string; order: number }[]
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.task.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );
  revalidatePath("/dashboard/tasks");
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteTaskAction(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/dashboard/tasks");
}
