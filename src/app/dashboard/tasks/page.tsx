import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/tasks/TaskBoard";

export const metadata = {
  title: "Tareas — Laser Inova CRM",
  description: "Tablero de tareas del equipo con drag and drop",
};

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const currentUser = session.user as { id: string; role: string; name: string };

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ status: "asc" }, { order: "asc" }],
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates for client components
  const serializedTasks = tasks.map((t) => ({
    ...t,
    status: t.status as "PENDING" | "IN_PROGRESS" | "DONE",
    priority: t.priority as "LOW" | "NORMAL" | "HIGH",
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    assignees: t.assignees.map((a) => ({ user: a.user })),
  }));

  return (
    <TaskBoard
      initialTasks={serializedTasks}
      users={users}
      currentUserId={currentUser.id}
      currentUserRole={currentUser.role}
    />
  );
}
