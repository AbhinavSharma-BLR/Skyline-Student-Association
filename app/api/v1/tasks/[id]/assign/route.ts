import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { taskService } from "@/lib/services/TaskService";
import { AssignTaskRequestSchema } from "@/lib/schemas/tasks";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = AssignTaskRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid assignment payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const officerRole = await (prisma as any).role.findFirst({
      where: { userId: session.user.id, role: "officer" },
    });

    const updated = await taskService.assignTask(
      { id: session.user.id, isOfficer: Boolean(officerRole) },
      id,
      parsed.data.assigneeId
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
