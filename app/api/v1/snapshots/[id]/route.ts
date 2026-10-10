import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { snapshotService } from "@/lib/services/SnapshotService";
import { handleApiError } from "@/lib/api/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");
    const { id } = await params;

    const snapshot = await snapshotService.getSnapshot(id);
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
