import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { activityService } from "@/lib/services/ActivityService";
import { UpdateActivityRequestSchema } from "@/lib/schemas/activities";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const { id } = await params;
    let isOfficer = false;
    try {
      const session = await requireAuth(request);
      const officerRole = await (prisma as any).role.findFirst({
        where: { userId: session.user.id, role: "officer" },
      });
      isOfficer = Boolean(officerRole);
    } catch {
      isOfficer = false;
    }

    const activity = await activityService.getActivity(id, isOfficer);
    return NextResponse.json({ data: activity });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");
    const { id } = await params;

    const body = await request.json();
    const parsed = UpdateActivityRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid activity update payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const updated = await activityService.updateActivity(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
