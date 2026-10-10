import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { claimService } from "@/lib/services/ClaimService";
import { PayoutClaimRequestSchema } from "@/lib/schemas/claims";
import { handleApiError, SkylineError } from "@/lib/api/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "treasurer");
    const { id } = await params;

    const body = await request.json();
    const parsed = PayoutClaimRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Payout reference is required",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const updated = await claimService.payoutClaim(
      session.user.id,
      id,
      parsed.data.payoutRef
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
