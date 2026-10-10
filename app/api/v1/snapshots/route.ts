import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { snapshotService } from "@/lib/services/SnapshotService";
import { handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");

    const snapshots = await snapshotService.listSnapshots();
    return NextResponse.json({ data: snapshots });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");

    let notes: string | undefined;
    try {
      const body = await request.json();
      notes = body?.notes;
    } catch {
      // Empty body
    }

    const snapshot = await snapshotService.generateSnapshot(session.user.id, notes);
    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
