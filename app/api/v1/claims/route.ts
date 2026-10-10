import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { claimService } from "@/lib/services/ClaimService";
import { CreateClaimRequestSchema } from "@/lib/schemas/claims";
import { handleApiError, SkylineError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "treasurer");

    const claims = await claimService.listAllClaims();
    return NextResponse.json({ data: claims });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const parsed = CreateClaimRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid claim payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const claim = await claimService.submitClaim(session.user.id, parsed.data);
    return NextResponse.json({ data: claim }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
