import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { announcementService } from "@/lib/services/AnnouncementService";
import { CreateAnnouncementRequestSchema } from "@/lib/schemas/announcements";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    let isMember = false;
    try {
      const session = await requireAuth(request);
      const activeMembership = await (prisma as any).membership.findFirst({
        where: { userId: session.user.id, status: "active" },
      });
      isMember = Boolean(activeMembership);
    } catch {
      // Unauthenticated public visitor
      isMember = false;
    }

    const announcements = await announcementService.listAnnouncements(isMember);
    return NextResponse.json({ data: announcements });
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
    const parsed = CreateAnnouncementRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid announcement payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const created = await announcementService.createDraft(session.user.id, parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
