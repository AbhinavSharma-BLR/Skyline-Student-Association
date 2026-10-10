import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { announcementService } from "@/lib/services/AnnouncementService";
import { handleApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const { id } = await params;
    let isMember = false;
    try {
      const session = await requireAuth(request);
      const activeMembership = await (prisma as any).membership.findFirst({
        where: { userId: session.user.id, status: "active" },
      });
      isMember = Boolean(activeMembership);
    } catch {
      isMember = false;
    }

    const announcement = await announcementService.getAnnouncement(id, isMember);
    return NextResponse.json({ data: announcement });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
