import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { activityService } from "@/lib/services/ActivityService";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const officerRole = await (prisma as any).role.findFirst({
      where: { userId: session.user.id, role: "officer" },
    });

    const isStaff = await (prisma as any).activityStaff.findFirst({
      where: { activityId: id, userId: session.user.id },
    });

    if (!officerRole && !isStaff) {
      throw new SkylineError(
        "FORBIDDEN",
        "Only officers and designated activity staff can view attendance",
        403
      );
    }

    const attendance = await activityService.getAttendance(id);
    return NextResponse.json({ data: attendance });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
