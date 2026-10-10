import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { CreateMembershipSchema } from "@/lib/schemas/memberships";
import { MembershipService } from "@/lib/services/MembershipService";
import { handleApiError } from "@/lib/api/errors";

/**
 * POST /api/v1/memberships
 * Initiates membership registration or renewal for the authenticated student.
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid();

  try {
    // 1. Authenticate user
    const session = await requireAuth(request);

    // 2. Parse and validate input body
    const body = await request.json();
    const parsed = CreateMembershipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid membership request",
            fieldErrors: parsed.error.flatten().fieldErrors,
          },
          requestId,
        },
        { status: 422 }
      );
    }

    // 3. Initiate membership record
    const result = await MembershipService.initiateMembership(session.user.id, parsed.data.periodId);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
