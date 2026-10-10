import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { taskService } from "@/lib/services/TaskService";
import { CreateTaskRequestSchema } from "@/lib/schemas/tasks";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId") || undefined;

    // Check if user is officer
    const officerRole = await (prisma as any).role.findFirst({
      where: { userId: session.user.id, role: "officer" },
    });

    const tasks = await taskService.listTasks(
      { id: session.user.id, isOfficer: Boolean(officerRole) },
      activityId
    );

    return NextResponse.json({ data: tasks });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const parsed = CreateTaskRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid task payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const officerRole = await (prisma as any).role.findFirst({
      where: { userId: session.user.id, role: "officer" },
    });

    const task = await taskService.createTask(
      { id: session.user.id, isOfficer: Boolean(officerRole) },
      parsed.data
    );

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
