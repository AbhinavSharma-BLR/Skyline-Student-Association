import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { claimService } from "@/lib/services/ClaimService";
import { handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const claims = await claimService.listUserClaims(session.user.id);
    return NextResponse.json({ data: claims });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
