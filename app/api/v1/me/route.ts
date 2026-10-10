import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/errors";

/**
 * GET /api/v1/me
 * Protected endpoint returning the authenticated session identity.
 * Strictly requires an active Better Auth session.
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // 1. Authenticate session
    const session = await requireAuth(request);

    // 2. Return standard success envelope
    return NextResponse.json(
      {
        data: {
          user: session.user,
          session: {
            id: session.session.id,
            expiresAt: session.session.expiresAt,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
