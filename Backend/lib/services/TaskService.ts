import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
} from "@/lib/schemas/tasks";

export interface TaskActor {
  id: string;
  isOfficer: boolean;
}

export class TaskService {
  /**
   * Lists tasks based on caller role and activity authorization.
   */
  async listTasks(actor: TaskActor, activityId?: string): Promise<TaskResponse[]> {
    const whereClause: any = {};

    if (activityId) {
      whereClause.activityId = activityId;
    }

    if (!actor.isOfficer) {
      // Find activities where user has staff capability
      const staffAssignments = await (prisma as any).activityStaff.findMany({
        where: { userId: actor.id },
        select: { activityId: true },
      });
      const staffActivityIds = staffAssignments.map((s: any) => s.activityId);

      whereClause.OR = [
        { assigneeId: actor.id },
        ...(staffActivityIds.length > 0 ? [{ activityId: { in: staffActivityIds } }] : []),
      ];
    }

    const tasks = await (prisma as any).task.findMany({
      where: whereClause,
      include: {
        activity: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((t: any) => ({
      id: t.id,
      activityId: t.activityId,
      title: t.title,
      description: t.description ?? null,
      status: t.status,
      assigneeId: t.assigneeId,
      assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName ?? "Volunteer" } : null,
      dueDate: t.dueAt ? t.dueAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  /**
   * Creates a new task. Requires officer role or staff authorization on the activity.
   */
  async createTask(actor: TaskActor, input: CreateTaskRequest): Promise<TaskResponse> {
    if (!actor.isOfficer) {
      const isStaff = await (prisma as any).activityStaff.findFirst({
        where: {
          activityId: input.activityId,
          userId: actor.id,
        },
      });
      if (!isStaff) {
        throw new SkylineError(
          "FORBIDDEN",
          "Only club officers and activity staff may create tasks for this activity",
          403
        );
      }
    }

    const task = await (prisma as any).task.create({
      data: {
        activityId: input.activityId,
        title: input.title,
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
        dueAt: input.dueDate ? new Date(input.dueDate) : null,
        status: "open",
      },
    });

    return {
      id: task.id,
      activityId: task.activityId,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      assigneeId: task.assigneeId,
      assignee: task.assigneeId ? { id: task.assigneeId, name: "Assignee" } : null,
      dueDate: task.dueAt ? task.dueAt.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
    };
  }

  /**
   * Updates task details or status.
   */
  async updateTask(
    actor: TaskActor,
    taskId: string,
    input: UpdateTaskRequest
  ): Promise<TaskResponse> {
    const existing = await (prisma as any).task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new SkylineError("NOT_FOUND", "Task not found", 404);
    }

    if (!actor.isOfficer) {
      const isAssignee = existing.assigneeId === actor.id;
      const isStaff = await (prisma as any).activityStaff.findFirst({
        where: {
          activityId: existing.activityId,
          userId: actor.id,
        },
      });

      if (!isAssignee && !isStaff) {
        throw new SkylineError("FORBIDDEN", "Insufficient permissions to update this task", 403);
      }

      // Assignee without officer/staff capability may only transition status
      if (isAssignee && !isStaff) {
        if (input.title || input.description || input.dueDate) {
          throw new SkylineError(
            "FORBIDDEN",
            "Task assignees may only update task status",
            403
          );
        }
      }
    }

    const updated = await (prisma as any).task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.dueDate !== undefined ? { dueAt: input.dueDate ? new Date(input.dueDate) : null } : {}),
      },
    });

    return {
      id: updated.id,
      activityId: updated.activityId,
      title: updated.title,
      description: updated.description ?? null,
      status: updated.status,
      assigneeId: updated.assigneeId,
      assignee: updated.assigneeId ? { id: updated.assigneeId, name: "Assignee" } : null,
      dueDate: updated.dueAt ? updated.dueAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Assigns or unassigns a task.
   */
  async assignTask(actor: TaskActor, taskId: string, assigneeId: string | null): Promise<TaskResponse> {
    const existing = await (prisma as any).task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new SkylineError("NOT_FOUND", "Task not found", 404);
    }

    if (!actor.isOfficer) {
      const isStaff = await (prisma as any).activityStaff.findFirst({
        where: {
          activityId: existing.activityId,
          userId: actor.id,
        },
      });
      if (!isStaff) {
        throw new SkylineError("FORBIDDEN", "Only officers and activity staff can assign tasks", 403);
      }
    }

    const updated = await (prisma as any).task.update({
      where: { id: taskId },
      data: { assigneeId },
    });

    return {
      id: updated.id,
      activityId: updated.activityId,
      title: updated.title,
      description: updated.description ?? null,
      status: updated.status,
      assigneeId: updated.assigneeId,
      assignee: updated.assigneeId ? { id: updated.assigneeId, name: "Assignee" } : null,
      dueDate: updated.dueAt ? updated.dueAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}

export const taskService = new TaskService();
