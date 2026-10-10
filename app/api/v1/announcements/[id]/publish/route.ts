import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { announcementService } from "@/lib/services/AnnouncementService";
import { handleApiError } from "@/lib/api/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");
    const { id } = await params;

    const published = await announcementService.publish(session.user.id, id);
    return NextResponse.json({ data: published });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
