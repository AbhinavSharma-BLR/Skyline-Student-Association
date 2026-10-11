import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { MembershipService } from "@/lib/services/MembershipService";

/**
 * GET /api/v1/me
 * Protected endpoint returning the authenticated session identity,
 * server-verified roles, and current active membership status.
 * Strictly requires an active Better Auth session.
 */
export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // 1. Authenticate session
    const session = await requireAuth(request);

    // 2. Fetch server-verified roles and active membership in parallel
    const [rolesRecords, membership] = await Promise.all([
      (prisma as any).role.findMany({
        where: { userId: session.user.id },
        select: { role: true },
      }),
      MembershipService.getCurrentMembership(session.user.id),
    ]);
    const roles: string[] = rolesRecords.map((r: { role: string }) => r.role);
    const isMember = Boolean(membership?.isMember);

    // 4. Return standard success envelope
    return NextResponse.json(
      {
        data: {
          user: {
            ...session.user,
            roles,
            isMember,
            membership,
          },
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
