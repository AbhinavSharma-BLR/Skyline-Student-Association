import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { activityService } from "@/lib/services/ActivityService";
import { CreateActivityRequestSchema } from "@/lib/schemas/activities";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
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

    const activities = await activityService.listActivities(isOfficer);
    return NextResponse.json({ data: activities });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");

    const body = await request.json();
    const parsed = CreateActivityRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid activity payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const created = await activityService.createActivity(session.user.id, parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
