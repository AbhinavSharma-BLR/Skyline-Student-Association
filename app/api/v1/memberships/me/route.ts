import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { MembershipService } from "@/lib/services/MembershipService";
import { handleApiError } from "@/lib/api/errors";

/**
 * GET /api/v1/memberships/me
 * Protected endpoint: returns current user's active membership record.
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    const session = await requireAuth(request);
    const membership = await MembershipService.getCurrentMembership(session.user.id);

    return NextResponse.json({ data: membership }, { status: 200 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
