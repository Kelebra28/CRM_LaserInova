"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH";

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createTaskAction(data: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeIds?: string[];
  createdById: string;
  status?: TaskStatus;
}) {
  // Get the max order in the target column so new task lands at the bottom
  const maxOrder = await prisma.task.aggregate({
    _max: { order: true },
    where: { status: data.status ?? "PENDING" },
  });

  await prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? "NORMAL",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status ?? "PENDING",
      order: (maxOrder._max.order ?? -1) + 1,
      createdById: data.createdById,
      assignees: data.assigneeIds?.length
        ? { create: data.assigneeIds.map((userId) => ({ userId })) }
        : undefined,
    },
  });

  revalidatePath("/dashboard/tasks");
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string | null;
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
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
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

// ─── Move (drag & drop status change) ───────────────────────────────────────

export async function moveTaskAction(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus, order: newOrder },
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
