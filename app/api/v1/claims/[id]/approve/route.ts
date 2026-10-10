import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { claimService } from "@/lib/services/ClaimService";
import { ReviewClaimRequestSchema } from "@/lib/schemas/claims";
import { handleApiError } from "@/lib/api/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "treasurer");
    const { id } = await params;

    let reviewNote: string | undefined;
    try {
      const body = await request.json();
      const parsed = ReviewClaimRequestSchema.safeParse(body);
      if (parsed.success) {
        reviewNote = parsed.data.reviewNote;
      }
    } catch {
      // Empty body is acceptable for simple approval
    }

    const updated = await claimService.approveClaim(session.user.id, id, reviewNote);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
